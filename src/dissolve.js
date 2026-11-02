// Dissolve tipográfico y espectral para los títulos de cada pieza.
// El texto se disuelve gradualmente desde el polvo y glifos ASCII/glitch
// hasta consolidar el título en Newsreader mayúsculas con proporciones nobles.

const RAMP = " .·░▒▓█";
const GLITCH = ["·", "░", "▒", "▓", "*", "+", "x", "X", "#", "%", "@", "$", "&"];

function hash(a, b = 0) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Dissolve {
  constructor(el, { seed = 3 } = {}) {
    this.el = el;
    this.seed = seed;
    this.rawText = el.textContent.trim();
    this.cleanText = this.rawText.toUpperCase();
    el.setAttribute("aria-label", this.rawText);
    el.textContent = "";

    this.wrapper = document.createElement("div");
    this.wrapper.className = "dissolve-art";
    this.wrapper.setAttribute("aria-hidden", "true");
    el.appendChild(this.wrapper);

    this.spans = [];
    for (let i = 0; i < this.cleanText.length; i++) {
      const s = document.createElement("span");
      s.className = "dz-char";
      this.wrapper.appendChild(s);
      this.spans.push(s);
    }

    this.t = -1;
    this.now = 0;
    this.set(0);
  }

  set(t) {
    t = Math.min(1, Math.max(0, t));
    if (Math.abs(t - this.t) < 0.003) return;
    this.t = t;

    if (t <= 0.01) {
      this.el.style.opacity = "0";
      for (const s of this.spans) s.textContent = "";
      return;
    }

    this.el.style.opacity = String(Math.min(1, t * 1.8));

    const len = this.cleanText.length;
    for (let i = 0; i < len; i++) {
      const ch = this.cleanText[i];
      const span = this.spans[i];
      if (ch === " ") {
        span.innerHTML = "&nbsp;";
        span.className = "dz-char";
        continue;
      }

      // Umbral progresivo para cada carácter a lo largo del scroll
      const thr = (i / Math.max(1, len)) * 0.52 + hash(i, this.seed) * 0.22;
      const loc = (t - thr) / 0.26;

      if (loc <= 0) {
        span.textContent = "";
        span.className = "dz-char";
      } else if (loc < 0.32) {
        // Fase 1: polvo tenue
        const gIdx = Math.floor(hash(i, Math.floor(this.now * 0.006) + 11) * 3);
        span.textContent = ["·", ".", " "][gIdx];
        span.className = "dz-char dz-glitch";
      } else if (loc < 0.88) {
        // Fase 2: glitch / rampa de caracteres de memoria
        const gIdx = Math.floor(hash(i, Math.floor(this.now * 0.01) + 23) * GLITCH.length);
        span.textContent = GLITCH[gIdx];
        span.className = "dz-char dz-glitch";
      } else {
        // Fase 3: carácter tipográfico nítido
        span.textContent = ch;
        span.className = "dz-char";
      }
    }
  }

  frame(now) {
    this.now = now;
    // Si estamos en medio de una transición, animar suavemente los glifos vivos
    if (this.t > 0.02 && this.t < 0.98) {
      const prevT = this.t;
      this.t = -1; // forzar actualización de glitch
      this.set(prevT);
    }
  }
}

export class DissolveText extends Dissolve {}
