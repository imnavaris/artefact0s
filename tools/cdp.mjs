// Conduce Chromium por CDP (DevTools Protocol) para verificar la obra con
// scroll real, rAF real y capturas. Node 24 trae WebSocket global: no hace
// falta ningun paquete.
//   node tools/cdp.mjs <orden> [...args]
//
//   ordenes:
//     scroll <pieza?>|all   recorre el scroll y deja un informe en stdout
//     shot  <salida.png>    captura la ventana
//     eval  <expr>         evalua una expresion en la pagina
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = 'C:\\Users\\Usuario\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const PORT = process.env.PORT || '8011';
const DEBUG_PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--hide-scrollbars',
  '--force-prefers-reduced-motion=0',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=C:\\Users\\Usuario\\AppData\\Local\\Temp\\opencode\\cdp-profile',
  '--window-size=1440,900',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] });

process.on('exit', () => chrome.kill());

// Espera a que el puerto de depuracion responda.
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const json = await res.json();
    wsUrl = json.webSocketDebuggerUrl;
  } catch { /* todavia no */ }
}
if (!wsUrl) { console.error('no se pudo hablar con Chromium'); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
const sessions = new Map();

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};

function send(method, params = {}, sessionId) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

// Crea una pestana y se conecta a ella.
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
sessions.set(targetId, sessionId);
const call = (m, p) => send(m, p, sessionId);

await call('Page.enable');
await call('Runtime.enable');
await call('Log.enable');
await call('Network.enable');
// El perfil es persistente: sin esto Chromium puede servir un modulo viejo
// del cache y la verificacion mide una version que no esta en disco.
await call('Network.setCacheDisabled', { cacheDisabled: true });
// El headless reporta movimiento reducido: la obra cuantiza el estado en
// cuatro escalones y la verificacion no mide el camino que ve la gente.
await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });

const consoleLines = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    consoleLines.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleLines.push(`EXCEPTION: ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description || ''}`);
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleLines.push(`LOG ERROR: ${msg.params.entry.text}`);
  }
});

const [order, ...args] = process.argv.slice(2);

async function evaluate(expr) {
  const res = await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
  return res.result.value;
}

async function goto(url) {
  await call('Page.navigate', { url });
  await sleep(2500);
  // El perfil es persistente: el navegador restaura el scroll de la sesion
  // anterior y la captura sale del final de la obra.
  await evaluate("history.scrollRestoration='manual'; scrollTo(0,0); 1");
}

if (order === 'scroll') {
  const piece = args[0] || 'all';
  const url = `http://127.0.0.1:${PORT}/${piece === 'all' ? '' : `?piece=${piece}`}`;
  await goto(url);
  const report = await evaluate(`(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const steps = 36;
    const rows = [];
    let frames = 0;
    const count = () => { frames++; requestAnimationFrame(count); };
    requestAnimationFrame(count);
    for (let i = 0; i <= steps; i++) {
      const y = (document.body.scrollHeight - innerHeight) * (i / steps);
      scrollTo(0, y);
      await sleep(200);
      const active = document.querySelector('.piece.is-active');
      const sec = active ? window.__artefactos.sections.find((s) => s.id === active.dataset.piece) : null;
      const pre = document.querySelector('.glyph-output');
      rows.push({
        y: Math.round(scrollY),
        piece: active ? active.dataset.piece : null,
        state: sec ? +sec.state.toFixed(2) : null,
        glow: getComputedStyle(document.documentElement).getPropertyValue('--glow').trim(),
        pre: pre ? pre.textContent.replace(/\\s/g, '').length : 0,
        quote: active ? active.querySelector('.citation p').textContent.slice(0, 24) : null,
      });
    }
    return { frames, rows, height: document.body.scrollHeight, vh: innerHeight };
  })()`);
  console.log(JSON.stringify(report, null, 1));
  console.log('CONSOLA:', consoleLines.length ? consoleLines.join('\n') : 'limpia');
} else if (order === 'shot') {
  //   shot <salida.png> [pieza] [p] [rx] [ry]
  const piece = args[1] || '';
  const p = args[2] || '';
  const rx = args[3] || '';
  const ry = args[4] || '';
  const params = [];
  if (piece) params.push(`piece=${piece}`);
  if (p !== '') params.push(`p=${p}`);
  if (rx !== '') params.push(`rx=${rx}`);
  if (ry !== '') params.push(`ry=${ry}`);
  await goto(`http://127.0.0.1:${PORT}/${params.length ? '?' + params.join('&') : ''}`);
  // Se espera a que la escena tenga glifos: capturar antes muestra el
  // calentamiento, con la trama sin inscripcion.
  await evaluate("new Promise(r => { const t0 = Date.now(); const t = setInterval(() => { const o = document.querySelector('.glyph-output'); if ((o && o.textContent.trim().length > 200) || Date.now() - t0 > 8000) { clearInterval(t); r(1); } }, 100); })");
  await sleep(600);
  const state = await evaluate("[scrollY, window.__artefactos.stage.lines, document.querySelector('.glyph-output').textContent.replace(/\\s/g,'').slice(0,60), window.__artefactos.stage.burn, window.__artefactos.stage.extent, window.__artefactos.sections.map(s=>+s.state.toFixed(2)), window.__artefactos.models.get('book').burn(0.5)]");
  console.log('ESTADO:', JSON.stringify(state));
  const { data } = await call('Page.captureScreenshot', { format: 'png' });
  writeFileSync(args[0], Buffer.from(data, 'base64'));
  console.log(args[0]);
  console.log('CONSOLA:', consoleLines.length ? consoleLines.join('\n') : 'limpia');
} else if (order === 'eval') {
  await goto(`http://127.0.0.1:${PORT}/`);
  const out = await evaluate(args.join(' '));
  console.log(JSON.stringify(out, null, 1));
  console.log('CONSOLA:', consoleLines.length ? consoleLines.join('\n') : 'limpia');
} else {
  console.error('ordenes: scroll | shot | eval');
}

ws.close();
chrome.kill();
process.exit(0);
