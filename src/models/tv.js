import { T, mat, texMat, box, part, tube } from './shared.js';
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function createTv() {
  const root = new T.Group();
  const bodyMat = texMat((c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e4dccf'); g.addColorStop(0.55, '#b4ac9e'); g.addColorStop(1, '#7e7769');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }, { roughness: 0.5, metalness: 0.15 });
  const trimMat = mat('#ffffff', { roughness: 0.25, metalness: 0.5 });
  const darkMat = mat('#544f45', { roughness: 0.65, metalness: 0.2 });
  const knobMat = mat('#ffffff', { roughness: 0.2, metalness: 0.5 });
  const screenMat = mat('#384468', { roughness: 0.2, metalness: 0.0 });
  screenMat.userData = { fixedColor: '#384468' };
  box(root, [3.2, 2.4, 1.6], bodyMat, [0, 0, 0]);
  box(root, [2.3, 1.7, 1.0], bodyMat, [-0.1, 0, -1.25]);
  box(root, [1.3, 1.0, 0.75], bodyMat, [-0.1, 0, -2.0]);
  for (const sx of [-1.25, 1.25]) for (const sz of [-0.55, 0.55]) {
    part(root, new T.CylinderGeometry(0.13, 0.17, 0.26, 10), darkMat, [sx, -1.32, sz]);
  }
  const SX = -0.42, SY = 0.06, SW = 2.12, SH = 1.72;
  box(root, [SW + 0.28, 0.16, 0.16], trimMat, [SX, SY + SH / 2 + 0.08, 0.82]);
  box(root, [SW + 0.28, 0.16, 0.16], trimMat, [SX, SY - SH / 2 - 0.08, 0.82]);
  box(root, [0.16, SH + 0.32, 0.16], trimMat, [SX - SW / 2 - 0.08, SY, 0.82]);
  box(root, [0.16, SH + 0.32, 0.16], trimMat, [SX + SW / 2 + 0.08, SY, 0.82]);
  const sg = new T.PlaneGeometry(SW, SH, 20, 16);
  const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const nx = sp.getX(i) / (SW / 2), ny = sp.getY(i) / (SH / 2);
    sp.setZ(i, 0.24 * (1 - (nx * nx + ny * ny) * 0.46));
  }
  sg.computeVertexNormals();
  part(root, sg, screenMat, [SX, SY, 0.78]);
  const PX = 1.14;
  box(root, [0.78, 1.92, 0.08], darkMat, [PX, 0.05, 0.8]);
  for (let i = 0; i < 7; i++) box(root, [0.54, 0.04, 0.06], trimMat, [PX, 0.72 - i * 0.11, 0.85]);
  const knobs = [];
  for (const y of [-0.26, -0.72]) {
    const k = new T.Group();
    k.position.set(PX, y, 0.88);
    root.add(k);
    part(k, new T.CylinderGeometry(0.21, 0.23, 0.16, 14), knobMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
    box(k, [0.055, 0.22, 0.06], darkMat, [0, 0.08, 0.09]);
    knobs.push(k);
  }
  part(root, new T.SphereGeometry(0.34, 12, 8), darkMat, [0, 1.22, 0]).scale.set(1, 0.45, 1);
  const ants = [];
  for (const s of [-1, 1]) {
    const g = new T.Group();
    g.position.set(0, 1.28, 0);
    root.add(g);
    tube(g, [[0, 0, 0], [s * 0.52, 0.88, 0], [s * 1.04, 1.58, 0]], 0.032, trimMat, 10, 6);
    part(g, new T.SphereGeometry(0.075, 8, 6), trimMat, [s * 1.04, 1.6, 0]);
    ants.push({ g, s });
  }
  // De frente hacia la camara
  root.rotation.set(0.04, 0, 0);
  return {
    root,
    kind: 'tv',
    animated: true,
    tvStatic(p) { return sm(0.04, 0.45, p); },
    update(p) {
      root.rotation.y = Math.sin(p * Math.PI) * 0.18;
      root.rotation.x = 0.04 + Math.sin(p * Math.PI) * 0.05;
      knobs.forEach((k, i) => { k.rotation.z = (i ? -1 : 1) * p * 5.5; });
      ants.forEach(({ g, s }) => { g.rotation.z = -s * (0.06 + p * 0.3) + Math.sin(p * 20 + s) * 0.03; });
    }
  };
}
