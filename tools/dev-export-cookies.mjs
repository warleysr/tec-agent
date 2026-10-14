// Dev-only: exporta cookies do Chrome de depuração (porta 9333) para teste local. NÃO versionar o arquivo gerado.
import fs from "node:fs";
const v = await (await fetch("http://127.0.0.1:9333/json/version")).json();
const ws = new WebSocket(v.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id === 1) {
  const j = {}; for (const c of m.result.cookies.filter((c) => /tecconcursos/.test(c.domain))) j[c.name] = c.value;
  fs.writeFileSync(process.argv[2], JSON.stringify(j)); process.exit(0); } };
ws.send(JSON.stringify({ id: 1, method: "Storage.getCookies" }));
