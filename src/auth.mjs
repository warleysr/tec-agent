// Autenticação. O login do TEC exige reCAPTCHA no formulário (campo reCaptchaResponse), que NÃO é contornado aqui:
//  1) `browser`  (padrão): abre um Chrome dedicado, o usuário faz login/resolve o captcha, o agente coleta os cookies.
//  2) `password`: tenta POST /login (email/senha). Só funciona se o servidor não exigir captcha; senão cai no modo 1.
//  3) `import`:   importa cookies copiados de um navegador logado.
// A sessão persiste em ~/.tec-agent/session.json. O cookie "TecPermanecerLogado" (HttpOnly, ~14 dias) é o remember-me:
// o servidor emite novo JSESSIONID a partir dele e o cliente absorve os Set-Cookie automaticamente.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { BASE, HOME, TecClient, Session, UA } from "./client.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loginPassword(client, email, senha) {
  const page = await client.request("GET", "/login", { json: false, referer: BASE + "/" });
  const hash = /name="hash"\s+value="([^"]*)"/.exec(page)?.[1] ?? "";
  const res = await client.request("POST", "/login", {
    form: { email, senha, hash, urlRetorno: "", reCaptchaResponse: "" }, json: false, raw: true, referer: BASE + "/login",
  });
  const who = await client.whoami();
  if (!who.logged) {
    client.session.cookies = Object.fromEntries(Object.entries(client.session.cookies).filter(([k]) => k !== "TecPermanecerLogado"));
    throw new Error(`Login por senha recusado (HTTP ${res.status}); provável reCAPTCHA ou credenciais inválidas. Use: tec login --browser`);
  }
  client.session.meta = { via: "password", at: new Date().toISOString() };
  client.session.save();
  return who;
}

export function importCookies(client, text) {
  // aceita "a=1; b=2", JSON {nome:valor}, ou JSON de extensão [{name,value}]
  let jar = {};
  const t = text.trim();
  if (t.startsWith("[")) for (const c of JSON.parse(t)) jar[c.name] = c.value;
  else if (t.startsWith("{")) jar = JSON.parse(t);
  else for (const p of t.split(";")) { const i = p.indexOf("="); if (i > 0) jar[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }
  client.session.cookies = { ...client.session.cookies, ...jar };
  client.session.meta = { via: "import", at: new Date().toISOString() };
  client.session.save();
}

export function findChrome() {
  const c = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return c.find((p) => fs.existsSync(p));
}

async function cdpCookies(port) {
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const call = (method, params = {}) => new Promise((res) => {
    const id = Math.floor(Math.random() * 1e9);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { ws.removeEventListener("message", h); res(m.result); } };
    ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method, params }));
  });
  return { call, close: () => { try { ws.close(); } catch {} } };
}

export async function loginBrowser(client, { timeoutMs = 10 * 60_000, log = console.error } = {}) {
  const chrome = findChrome();
  if (!chrome) throw new Error("Chrome/Edge não encontrado. Defina CHROME_PATH ou use: tec login --cookies");
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = path.join(HOME, "chrome-profile");
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(chrome, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", `--user-agent=${UA}`, `${BASE}/login`],
    { detached: true, stdio: "ignore" });
  child.unref();
  log(`Chrome aberto. Faça login no TEC (resolva o captcha). Aguardando... (até ${Math.round(timeoutMs / 60000)} min)`);
  const t0 = Date.now(); let cdp;
  try {
    while (Date.now() - t0 < timeoutMs) {
      await sleep(2000);
      try {
        cdp ??= await cdpCookies(port);
        const { cookies } = await cdp.call("Storage.getCookies");
        const mine = Object.fromEntries(cookies.filter((c) => /tecconcursos\.com\.br$/.test(c.domain)).map((c) => [c.name, c.value]));
        if (!mine.TecPermanecerLogado) continue;
        client.session.cookies = mine;
        if ((await client.whoami()).logged) {
          client.session.meta = { via: "browser", at: new Date().toISOString() };
          client.session.save();
          await cdp.call("Browser.close").catch(() => {});
          return client.whoami();
        }
      } catch { cdp = undefined; }
    }
    throw new Error("Tempo esgotado aguardando o login no navegador.");
  } finally { cdp?.close(); }
}

export async function prompt(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
  const a = await new Promise((r) => rl.question(question, r));
  rl.close(); if (hidden) process.stdout.write("\n");
  return a;
}

export { Session, TecClient };
