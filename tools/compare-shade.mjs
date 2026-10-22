// Captura el escenario con y sin smoothShading, para comparar el costo de
// sombreado contra lo que se ve.
//   node tools/compare-shade.mjs <pieza> <salida.png>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';
const DEBUG_PORT = 9335;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const piece = process.argv[2] || 'book';
const outFile = process.argv[3] || 'shade.png';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding', '--hide-scrollbars',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=C:\\Users\\Usuario\\AppData\\Local\\Temp\\opencode\\cdp-profile-shade',
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

async function shot(name) {
  const { data } = await call('Page.captureScreenshot', { format: 'png' });
  mkdirSync(dirname(name), { recursive: true });
  writeFileSync(name, Buffer.from(data, 'base64'));
}

await call('Runtime.evaluate', { expression: `(() => {
  const h = window.__artefactos.stage.handle;
  h.setOptions({ ...h.getOptions(), smoothShading: false });
  h.rerender();
})()` });
await sleep(600);
await shot(outFile.replace(/\.png$/, '-sin-sombreado.png'));

await call('Runtime.evaluate', { expression: `(() => {
  const h = window.__artefactos.stage.handle;
  h.setOptions({ ...h.getOptions(), smoothShading: true });
  h.rerender();
})()` });
await sleep(600);
await shot(outFile.replace(/\.png$/, '-con-sombreado.png'));

console.log(outFile.replace(/\.png$/, '-sin-sombreado.png'));
console.log(outFile.replace(/\.png$/, '-con-sombreado.png'));

ws.close();
chrome.kill();
process.exit(0);
