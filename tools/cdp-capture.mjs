// Passive-ish CDP network capture against a user-owned Chrome (loopback only).
// Usage: node cdp-capture.mjs <port> <targetId> <outFile> [navigateUrl] [ms]
// Cookies/Authorization headers are redacted before writing.
import fs from "node:fs";
const [port, targetId, out, nav, msArg] = process.argv.slice(2);
const ms = Number(msArg || 8000);
const ws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
let id = 0; const pending = new Map(); const reqs = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const redact = (h = {}) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k, /cookie|authorization/i.test(k) ? "<redacted>" : v]));
ws.onmessage = async (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); return; }
  const p = m.params;
  if (m.method === "Network.requestWillBeSent") reqs.set(p.requestId, { url: p.request.url, method: p.request.method, type: p.type, headers: redact(p.request.headers), postData: p.request.postData, initiator: p.initiator?.type });
  if (m.method === "Network.responseReceived") Object.assign(reqs.get(p.requestId) ?? {}, { status: p.response.status, mime: p.response.mimeType, respHeaders: redact(p.response.headers) });
  if (m.method === "Network.loadingFinished") {
    const r = reqs.get(p.requestId); if (!r) return;
    if (/json|html|xml|text/.test(r.mime || "") && !/google|doubleclick|facebook|hotjar|clarity/.test(r.url)) {
      const b = await send("Network.getResponseBody", { requestId: p.requestId });
      r.body = (b.body || "").slice(0, 60000);
    }
  }
};
await new Promise((r) => (ws.onopen = r));
await send("Network.enable"); await send("Page.enable");
if (nav) await send("Page.navigate", { url: nav }); else await send("Page.reload", { ignoreCache: true });
await new Promise((r) => setTimeout(r, ms));
fs.writeFileSync(out, JSON.stringify([...reqs.values()], null, 1));
console.log("captured", reqs.size);
process.exit(0);
