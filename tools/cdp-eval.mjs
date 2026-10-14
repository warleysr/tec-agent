// node cdp-eval.mjs <port> <targetId> <jsExpressionFile> [navigateUrl]
import fs from "node:fs";
const [port, targetId, file, nav] = process.argv.slice(2);
const ws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
if (nav) { await send("Page.enable"); await send("Page.navigate", { url: nav }); await new Promise((r) => setTimeout(r, 6000)); }
const r = await send("Runtime.evaluate", { expression: fs.readFileSync(file, "utf8"), awaitPromise: true, returnByValue: true });
console.log(typeof r.result?.value === "string" ? r.result.value : JSON.stringify(r, null, 1));
process.exit(0);
