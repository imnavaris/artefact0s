const CURSOR = "▌";
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
function mulberry32(a) { return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function slip(ch, rand) { const low = ch.toLowerCase(); for (const row of ROWS) { const i = row.indexOf(low); if (i >= 0) { const rep = row[i === 0 ? 1 : i === row.length - 1 ? i - 1 : i + (rand() < 0.5 ? -1 : 1)]; return ch === low ? rep : rep.toUpperCase(); } } return null; }
export class Typewriter {
  constructor(p, { seed = 31 } = {}) {
    this.p = p;
    this.block = p.closest(".citation") || p.parentElement;
    this.spans = [...p.querySelectorAll("span")];
    this.lines = this.spans.map((s) => s.textContent.trim());
    this.full = this.lines.join("\n");
    this.p.setAttribute("aria-label", this.full.replace(/\n/g, " "));
    this.spans.forEach((s) => { s.setAttribute("aria-hidden", "true"); s.textContent = ""; });
    const rand = mulberry32(seed);
    this.events = [[0, ""]];
    let at = 0, text = "";
    const key = (next, wait) => { at += wait; text = next; this.events.push([at, text]); };
    const typeDelay = (ch) => 0.06 + rand() * 0.09 + (ch === " " ? 0.05 + rand() * 0.08 : 0) + (rand() < 0.05 ? 0.3 : 0);
    for (let li = 0; li < this.lines.length; li++) {
      const phrase = this.lines[li];
      const typo = rand() < 0.5 && phrase.length > 5 ? 3 + Math.floor(rand() * (phrase.length - 4)) : -1;
      for (let i = 0; i < phrase.length; i++) {
        const wrong = i === typo ? slip(phrase[i], rand) : null;
        if (wrong) {
          const more = Math.min(Math.floor(rand() * 3), phrase.length - i - 1);
          key(text + wrong, typeDelay(phrase[i]));
          for (let k = 1; k <= more; k++) key(text + phrase[i + k], typeDelay(phrase[i + k]));
          at += 0.25 + rand() * 0.2;
          for (let k = 0; k <= more; k++) key(text.slice(0, -1), k ? 0.07 : 0.1);
        }
        key(text + phrase[i], typeDelay(phrase[i]) + (i && ".,!?".includes(phrase[i - 1]) ? 0.15 : 0));
      }
      if (li < this.lines.length - 1) key(text + "\n", 0.22 + rand() * 0.15);
    }
    this.doneTime = Math.max(0.1, at);
    this.curT = 0; this.targetT = 0; this.lastText = ""; this.lastLit = false; this.lastEventTime = 0; this.done = false;
    this.render("", false);
  }
  setScroll(p, nowMs, dt) {
    const nowSec = nowMs * 0.001;
    let ratio = 0;
    if (p <= 0.025) ratio = 0;
    else if (p <= 0.74) ratio = (p - 0.025) / (0.74 - 0.025);
    else if (p <= 0.88) ratio = 1;
    else ratio = Math.max(0, 1 - (p - 0.88) / 0.10);
    this.targetT = ratio * this.doneTime;
    const diff = this.targetT - this.curT;
    if (Math.abs(diff) < 0.002) this.curT = this.targetT;
    else if (diff > 0) this.curT = Math.min(this.targetT, this.curT + dt * Math.max(2.4, Math.abs(diff) * 6.0));
    else this.curT = Math.max(this.targetT, this.curT - dt * Math.max(5.0, Math.abs(diff) * 10.0));
    let line = "";
    for (let i = 0; i < this.events.length; i++) {
      const [when, s] = this.events[i];
      if (when > this.curT) break;
      line = s;
    }
    if (line !== this.lastText) { this.lastText = line; this.lastEventTime = nowSec; }
    const active = p > 0.02 && p < 0.97 && this.curT > 0.005;
    const idle = Math.max(0, nowSec - this.lastEventTime);
    const lit = active && (idle < 0.45 || (idle - 0.45) % 1.06 > 0.53);
    const isDone = this.curT >= this.doneTime * 0.94 && p <= 0.89;
    if (isDone !== this.done) { this.done = isDone; this.block.classList.toggle("is-done", isDone); }
    if (line !== this._renderedText || lit !== this.lastLit) {
      this._renderedText = line; this.lastLit = lit; this.render(line, lit);
    }
  }
  begin() {}
  update() {}
  reset() { this.curT = 0; this.targetT = 0; this.done = false; this.block.classList.remove("is-done"); this.render("", false); }
  finish() { this.curT = this.doneTime; this.targetT = this.doneTime; this.done = true; this.block.classList.add("is-done"); this.render(this.full, false); }
  render(s, showCursor) {
    const parts = s.split("\n");
    const lastIdx = Math.max(0, Math.min(parts.length - 1, this.spans.length - 1));
    for (let k = 0; k < this.spans.length; k++) {
      let txt = parts[k] ?? "";
      if (showCursor && k === lastIdx && s.length > 0) txt += CURSOR;
      this.spans[k].textContent = txt;
    }
  }
}
