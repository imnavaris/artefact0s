// Titulo con animacion lenta y fluida de disolucion
function mulberry32(a) {
 return function () {
 a |= 0; a = (a + 0x6d2b79f5) | 0;
 let t = Math.imul(a ^ (a >>> 15), 1 | a);
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
}

const NOISE = '.:;+*xX#%@-=,`';

export class Dissolve {
 constructor(el, { seed = 3 } = {}) {
 this.el = el;
 this.text = el.textContent.trim();
 el.setAttribute('aria-label', this.text);
 el.textContent = '';
 const r = mulberry32(seed + this.text.length);
 this.chars = [...this.text].map((ch) => {
 const s = document.createElement('span');
 s.className = 'dz';
 s.setAttribute('aria-hidden', 'true');
 s.textContent = ch;
 el.appendChild(s);
 return { ch, s, off: r(), dx: (r() - 0.5) * 80, dy: (r() - 0.8) * 60, rot: (r() - 0.5) * 45, g: (r() * 97) | 0 };
 });
 this.t = -1;
 this.set(0);
 }

 set(t) {
 t = Math.round(Math.min(1, Math.max(0, t)) * 360) / 360;
 if (t === this.t) return;
 this.t = t;
 const tick = Math.floor(t * 24);
 for (const c of this.chars) {
 if (c.ch === ' ') continue;
 const s = Math.min(1, Math.max(0, (t - c.off * 0.4) / 0.6));
 const k = 1 - s;
 c.s.style.opacity = s <= 0 ? '0' : String(Math.min(1, s * 1.8));
 c.s.style.transform = k > 0.001 ? `translate(${(c.dx * k).toFixed(1)}px,${(c.dy * k).toFixed(1)}px) rotate(${(c.rot * k).toFixed(1)}deg)` : 'none';
 c.s.textContent = s > 0.85 ? c.ch : NOISE[(c.g + tick) % NOISE.length];
 }
 }
}