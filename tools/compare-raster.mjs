// Compara opciones de raster de glyphcss en imagen y en costo.
//   node tools/compare-raster.mjs <pieza> <carpeta-salida>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';
const DEBUG_PORT = 9336;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const piece = process.argv[2] || 'book';
const outDir = process.argv[3] || '.';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding', '--hide-scrollbars',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=C:\\Users\\Usuario\\AppData\\Local\\Temp\\opencode\\cdp-profile-raster',
  '--window-size=1440,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] });
process.on('exit', () => chrome.kill());

let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json()).webSocketDebuggerUrl; } catch { /* */ }
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const call = (m, p) => send(m, p, sessionId);
await call('Page.enable');
await call('Runtime.enable');
await call('Page.navigate', { url: `http://127.0.0.1:${PORT}/?piece=${piece}&p=0` });
await sleep(3000);

mkdirSync(outDir, { recursive: true });

const variants = [
  { name: 'sup2-shaded', opts: { supersample: 2, smoothShading: true } },
  { name: 'sup2-plain', opts: { supersample: 2, smoothShading: false } },
  { name: 'sup1-plain', opts: { supersample: 1, smoothShading: false } },
];

const timing = await call('Runtime.evaluate', {
  expression: `(() => {
    const h = window.__artefactos.stage.handle;
    const base = h.getOptions();
    const out = {};
    const bench = (o) => {
      h.setOptions({ ...base, ...o });
      h.rerender();
      const t = performance.now();
      for (let i = 0; i < 8; i++) h.rerender();
      return +((performance.now() - t) / 8).toFixed(1);
    };
    ${variants.map((v) => `out['${v.name}'] = bench(${JSON.stringify(v.opts)});`).join('\n')}
    h.setOptions(base); h.rerender();
    return out;
  })()`,
  returnByValue: true,
});
console.log('render ms:', JSON.stringify(timing.result.value));

for (const v of variants) {
  await call('Runtime.evaluate', {
    expression: `(() => {
      const h = window.__artefactos.stage.handle;
      h.setOptions({ ...h.getOptions(), ...${JSON.stringify(v.opts)} });
      h.rerender();
    })()`,
  });
  await sleep(700);
  const { data } = await call('Page.captureScreenshot', { format: 'png' });
  const file = join(outDir, `${piece}-${v.name}.png`);
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log(file);
}

ws.close();
chrome.kill();
process.exit(0);
