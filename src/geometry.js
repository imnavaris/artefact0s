import * as T from 'three';

// Convierte un grafo de Three.js (Y-up) a Polygon[] de glyphcss (Z-up).
const SAMPLERS = new WeakMap();

function samplerFor(texture) {
 if (!texture) return null;
 if (SAMPLERS.has(texture)) return SAMPLERS.get(texture);
 const img = texture.image;
 let sample = null;
 if (img && typeof img.getContext === 'function') {
 const w = img.width, h = img.height;
 const data = img.getContext('2d').getImageData(0, 0, w, h).data;
 sample = (u, v) => {
 const x = Math.min(w - 1, Math.max(0, Math.round(u * (w - 1))));
 const y = Math.min(h - 1, Math.max(0, Math.round((1 - v) * (h - 1))));
 const i = (y * w + x) * 4;
 return [data[i], data[i + 1], data[i + 2]];
 };
 }
 SAMPLERS.set(texture, sample);
 return sample;
}

export function invalidateTexture(texture) { SAMPLERS.delete(texture); }

const hex = (r, g, b) => '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

// Escala de blancos y marfiles de alto contraste para despegar del fondo
function clampPaperColor(r, g, b, allowEmber = false) {
 if (allowEmber) return '#d99b26';
 const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
 // Piso de brillo elevado a 0.48 y maximo a 1.0 para nitidez absoluta
 const t = 0.48 + 0.52 * Math.pow(Math.min(1, Math.max(0, lum)), 0.75);
 return hex(Math.round(255 * t), Math.round(250 * t), Math.round(240 * t));
}

export function toGlyphPolygons(root, opts = {}) {
 const map = (x, y, z) => [x, -z, y];
 const out = [];
 const v = new T.Vector3();
 root.updateMatrixWorld(true);
 root.traverse((mesh) => {
 if (!mesh.isMesh || !mesh.visible || mesh.userData.asciiSkip) return;
 const geo = mesh.geometry;
 const mat = mesh.material;
 const pos = geo.attributes && geo.attributes.position;
 if (!pos) return;
 const idx = geo.index;
 const uv = geo.attributes.uv;
 const sample = samplerFor(mat && mat.map);
 const base = mat && mat.color ? mat.color.getHexString() : 'ffffff';
 const fixed = mat && mat.userData && mat.userData.fixedColor;
 const noise = Boolean(mesh.userData.glyphNoise);
 const isEmber = Boolean(mat && mat.userData && mat.userData.isEmber);
 const count = idx ? idx.count : pos.count;
 for (let i = 0; i + 2 < count; i += 3) {
 const vertices = [];
 let r = 0, g = 0, b = 0, painted = 0;
 for (let k = 0; k < 3; k++) {
 const vi = idx ? idx.getX(i + k) : i + k;
 v.fromBufferAttribute(pos, vi).applyMatrix4(mesh.matrixWorld);
 vertices.push(map(v.x, v.y, v.z));
 if (uv && sample) {
 const c = sample(uv.getX(vi), uv.getY(vi));
 r += c[0]; g += c[1]; b += c[2]; painted++;
 }
 }
 let color;
 if (fixed) {
 color = fixed;
 } else {
 const raw = painted
 ? [r / painted, g / painted, b / painted]
 : [parseInt(base.slice(0, 2), 16), parseInt(base.slice(2, 4), 16), parseInt(base.slice(4, 6), 16)];
 if (noise) {
 const l = Math.round(0.299 * raw[0] + 0.587 * raw[1] + 0.114 * raw[2]);
 color = hex(l, l, l);
 } else {
 color = clampPaperColor(Math.round(raw[0]), Math.round(raw[1]), Math.round(raw[2]), isEmber);
 }
 }
 out.push({ vertices, color });
 }
 });
 return center(out);
}

function center(polygons) {
 if (!polygons.length) return polygons;
 let minX = Infinity, minY = Infinity, minZ = Infinity;
 let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
 for (const p of polygons) for (const v of p.vertices) {
 if (v[0] < minX) minX = v[0]; if (v[0] > maxX) maxX = v[0];
 if (v[1] < minY) minY = v[1]; if (v[1] > maxY) maxY = v[1];
 if (v[2] < minZ) minZ = v[2]; if (v[2] > maxZ) maxZ = v[2];
 }
 const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
 for (const p of polygons) for (const v of p.vertices) {
 v[0] -= cx; v[1] -= cy; v[2] -= cz;
 }
 return polygons;
}

export function bounds(polygons) {
 let minX = Infinity, minY = Infinity, minZ = Infinity;
 let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
 for (const p of polygons) for (const v of p.vertices) {
 if (v[0] < minX) minX = v[0]; if (v[0] > maxX) maxX = v[0];
 if (v[1] < minY) minY = v[1]; if (v[1] > maxY) maxY = v[1];
 if (v[2] < minZ) minZ = v[2]; if (v[2] > maxZ) maxZ = v[2];
 }
 return { minX, minY, minZ, maxX, maxY, maxZ };
}