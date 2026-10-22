// Mide el costo de redibujar una pieza: es el hot path del scroll.
//   node tools/cdp.mjs eval "..."   (usar con PERF=1)
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';
const DEBUG_PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding', '--hide-scrollbars',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=C:\\Users\\Usuario\\AppData\\Local\\Temp\\opencode\\cdp-profile-perf',
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
await call('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
await sleep(3000);

const res = await call('Runtime.evaluate', {
  expression: `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const s = window.__artefactos.stage;
    const models = window.__artefactos.models;
    const sections = window.__artefactos.sections;
    const mod = await import('/src/geometry.js');
    const book = models.get('book');

    // Costo de una reconstruccion completa de la pieza mas pesada.
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      book.update(i / 10);
      mod.toGlyphPolygons(book.root);
    }
    const convertMs = (performance.now() - t0) / 10;

    // Costo del render de la escena (raster a la grilla).
    const t1 = performance.now();
    for (let i = 0; i < 10; i++) s.handle.rerender();
    const renderMs = (performance.now() - t1) / 10;

    // Frecuencia de cuadros durante un scroll suave y continuo.
    let frames = 0;
    let stop = false;
    let worst = 0;
    let last = performance.now();
    const count = () => {
      const now = performance.now();
      worst = Math.max(worst, now - last);
      last = now;
      frames++;
      if (!stop) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    const t2 = performance.now();
    const max = document.body.scrollHeight - innerHeight;
    await new Promise((resolve) => {
      const step = () => {
        scrollBy(0, 12);
        if (scrollY < max - 12) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    const elapsed = performance.now() - t2;
    stop = true;

    return {
      convertMs: +convertMs.toFixed(1),
      renderMs: +renderMs.toFixed(1),
      fpsDuringScroll: +(frames / (elapsed / 1000)).toFixed(1),
      peorCuadroMs: +worst.toFixed(1),
      glifos: document.querySelector('.glyph-output').textContent.replace(/\\s/g, '').length,
      cols: s.cols, rows: s.rows,
    };
  })()`,
  awaitPromise: true,
  returnByValue: true,
});

if (res.exceptionDetails) console.error(JSON.stringify(res.exceptionDetails));
else console.log(JSON.stringify(res.result.value, null, 1));

ws.close();
chrome.kill();
process.exit(0);
