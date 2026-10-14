// Cliente HTTP do TEC Concursos: cookie jar persistente + cabeçalhos exigidos pelo balanceador.
// Observado: /api/* responde 403 (AWS ALB) sem Referer do próprio site; com UA de navegador + Referer funciona.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BASE = "https://www.tecconcursos.com.br";
export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";
export const HOME = process.env.TEC_AGENT_HOME || path.join(os.homedir(), ".tec-agent");
export const SESSION_FILE = path.join(HOME, "session.json");

export class AuthError extends Error {}
export class HttpError extends Error {
  constructor(status, url, body) { super(`HTTP ${status} em ${url}`); this.status = status; this.body = body; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Session {
  constructor(file = SESSION_FILE) { this.file = file; this.cookies = {}; this.meta = {}; }
  static load(file = SESSION_FILE) {
    const s = new Session(file);
    try { Object.assign(s, JSON.parse(fs.readFileSync(file, "utf8")), { file }); } catch { /* sem sessão */ }
    return s;
  }
  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify({ cookies: this.cookies, meta: this.meta }, null, 2), { mode: 0o600 });
  }
  clear() { this.cookies = {}; this.meta = {}; try { fs.unlinkSync(this.file); } catch {} }
  header() { return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; "); }
  /** Absorve Set-Cookie (renovação de JSESSIONID / AWSALB / TecPermanecerLogado). */
  absorb(res) {
    let changed = false;
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const [pair, ...attrs] = sc.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim(), value = pair.slice(i + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age\s*=\s*0/i.test(a)) || value === "" || value === "deleted";
      if (expired) { if (name in this.cookies) { delete this.cookies[name]; changed = true; } }
      else if (this.cookies[name] !== value) { this.cookies[name] = value; changed = true; }
    }
    if (changed) this.save();
  }
  get hasLoginCookie() { return !!(this.cookies.TecPermanecerLogado || this.cookies.JSESSIONID); }
}

export class TecClient {
  constructor({ session = Session.load(), minIntervalMs = 250, retries = 3 } = {}) {
    this.session = session; this.minIntervalMs = minIntervalMs; this.retries = retries; this._last = 0;
  }

  async request(method, pathOrUrl, { params, form, referer = `${BASE}/questoes/`, json = true, raw = false } = {}) {
    let url = pathOrUrl.startsWith("http") ? pathOrUrl : BASE + pathOrUrl;
    if (params) { const q = new URLSearchParams(flatten(params)); url += (url.includes("?") ? "&" : "?") + q; }
    const headers = {
      "User-Agent": UA, Referer: referer, Origin: BASE,
      Accept: json ? "application/json, text/plain, */*" : "text/html,*/*",
      "X-Requested-With": "XMLHttpRequest", "Accept-Language": "pt-BR,pt;q=0.9",
    };
    const ck = this.session.header(); if (ck) headers.Cookie = ck;
    let body;
    if (form) { body = new URLSearchParams(flatten(form)).toString(); headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"; }

    for (let attempt = 0; ; attempt++) {
      const wait = this._last + this.minIntervalMs - Date.now(); if (wait > 0) await sleep(wait);
      this._last = Date.now();
      let res;
      try { res = await fetch(url, { method, headers, body, redirect: "manual" }); }
      catch (e) { if (attempt < this.retries) { await sleep(500 * 2 ** attempt); continue; } throw e; }
      this.session.absorb(res);
      if (raw) return res;
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location") || "";
        if (/\/login/.test(loc)) throw new AuthError("Sessão expirada ou ausente. Rode: tec login");
        throw new HttpError(res.status, url, loc);
      }
      if (res.status === 401) throw new AuthError("Não autenticado. Rode: tec login");
      if ((res.status === 429 || res.status >= 500) && attempt < this.retries) { await sleep(1000 * 2 ** attempt); continue; }
      const text = await res.text();
      if (!res.ok) throw new HttpError(res.status, url, text.slice(0, 300));
      if (!json) return text;
      try { return JSON.parse(text); } catch { throw new AuthError("Resposta não-JSON (provável redirecionamento p/ login). Rode: tec login"); }
    }
  }
  get(p, params, o) { return this.request("GET", `/api${p}`, { params, ...o }); }
  post(p, form, o) { return this.request("POST", `/api${p}`, { form, ...o }); }

  /** Verifica se a sessão atual está autenticada (rota exclusiva de usuário logado). */
  async whoami() {
    try { const r = await this.get("/pastas-cadernos"); return Array.isArray(r.pastas) ? { logged: true, pastas: r.pastas.length } : { logged: false }; }
    catch (e) { if (e instanceof AuthError || (e instanceof HttpError && [401, 403].includes(e.status))) return { logged: false }; throw e; }
  }
}

/** { a: [1,2], b: {x:1} } -> pares; arrays viram a[0]=..; mantém chaves já "filtros[0].id" intactas. */
export function flatten(obj) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x, i) => out.push([`${k}[${i}]`, String(x)]));
    else out.push([k, String(v)]);
  }
  return out;
}
