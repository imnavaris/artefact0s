// Maquina de escribir pausada y organica que se escribe mientras el usuario
// visualiza el modelo 3D centrado.

function mulberry32(a) {
 return function () {
 a |= 0; a = (a + 0x6d2b79f5) | 0;
 let t = Math.imul(a ^ (a >>> 15), 1 | a);
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
}

const KB = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function neighbor(ch, rng) {
 const low = ch.toLowerCase();
 for (let r = 0; r < KB.length; r++) {
 const i = KB[r].indexOf(low);
 if (i < 0) continue;
 const opts = [KB[r][i - 1], KB[r][i + 1], KB[r - 1] && KB[r - 1][i], KB[r + 1] && KB[r + 1][i]].filter(Boolean);
 return opts[(rng() * opts.length) | 0];
 }
 return null;
}

export class Typewriter {
 constructor(p, { seed = 1, typo = 0.02 } = {}) {
 this.p = p;
 this.block = p.closest('.citation') || p.parentElement;
 this.spans = [...p.querySelectorAll('span')];
 this.full = this.spans.map((s) => s.textContent).join('\n');
 this.rng = mulberry32(seed);
 this.steps = this.script(this.full, typo);
 this.p.setAttribute('aria-label', this.full.replace(/\n/g, ' '));
 this.spans.forEach((s) => s.setAttribute('aria-hidden', 'true'));
 this.cursor = document.createElement('span');
 this.cursor.className = 'cursor';
 this.cursor.setAttribute('aria-hidden', 'true');
 this.t0 = null;
 this.idx = -1;
 this.done = false;
 this.render('', false);
 }

 script(full, typo) {
 const r = this.rng;
 const out = [{ t: 0, s: '' }];
 let t = 800; // Pausa inicial elegante antes de comenzar el tecleo
 let s = '';
 for (let i = 0; i < full.length; i++) {
 const ch = full[i];
 if (ch !== '\n' && /[a-záéíóúñ]/i.test(ch) && s.length > 4 && r() < typo) {
 const wrong = neighbor(ch, r);
 if (wrong) {
 s += wrong; t += 110 + r() * 90; out.push({ t, s });
 t += 240 + r() * 220; s = s.slice(0, -1); out.push({ t, s });
 t += 120 + r() * 90;
 }
 }
 s += ch;
 // Cadencia mas tranquila y fluida
 let d = 85 + r() * 90;
 if (ch === ' ') d += 40 + r() * 80;
 if (',;:'.includes(ch)) d += 280 + r() * 240;
 if ('.?!'.includes(ch)) d += 440 + r() * 320;
 if (ch === '\n') d += 520 + r() * 350;
 t += d;
 out.push({ t, s });
 }
 return out;
 }

 begin(now) {
 this.t0 = now;
 this.idx = -1;
 this.done = false;
 this.block.classList.remove('is-done');
 }

 reset() {
 this.t0 = null;
 this.done = false;
 this.block.classList.remove('is-done');
 this.render('', false);
 }

 finish() {
 this.t0 = null;
 this.done = true;
 this.render(this.full, false);
 this.block.classList.add('is-done');
 }

 update(now) {
 if (this.t0 === null || this.done) return;
 const el = now - this.t0;
 let i = this.idx;
 while (i + 1 < this.steps.length && this.steps[i + 1].t <= el) i++;
 if (i === this.idx) return;
 this.idx = i;
 const last = i >= this.steps.length - 1;
 this.render(this.steps[i].s, !last);
 if (last) {
 this.done = true;
 this.block.classList.add('is-done');
 setTimeout(() => this.cursor.remove(), 2400);
 }
 }

 render(s, withCursor) {
 const lines = s.split('\n');
 this.spans.forEach((sp, k) => { sp.textContent = lines[k] ?? ''; });
 this.cursor.remove();
 const at = Math.min(lines.length - 1, this.spans.length - 1);
 if (withCursor || (s === '' && this.t0 !== null)) this.spans[at].appendChild(this.cursor);
 else if (this.done) this.spans[this.spans.length - 1].appendChild(this.cursor);
 }
}