// node cdp-cookies.mjs <port> -> prints cookie metadata (never values) for tecconcursos
const port = process.argv[2];
const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const ws = new WebSocket(v.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id === 1) {
  for (const c of m.result.cookies.filter((c) => /tecconcursos/.test(c.domain)))
    console.log(c.name.padEnd(22), c.domain.padEnd(26), "httpOnly=" + c.httpOnly, "session=" + c.session, c.session ? "" : "expires=" + new Date(c.expires * 1000).toISOString(), "len=" + c.value.length);
  process.exit(0);
} };
ws.send(JSON.stringify({ id: 1, method: "Storage.getCookies" }));
