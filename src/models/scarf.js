import {T,texMat,surface,morph,part} from './shared.js';

export function createScarf(){
  const root=new T.Group();

  // Tela de algodón crudo con trama diagonal: el pañuelo es de las Madres de
  // Plaza de Mayo, blanco, no un trapo gris.
  const clothMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#f2efe6');
   g.addColorStop(.35,'#e2ddd0');
   g.addColorStop(.68,'#cfc8b6');
   g.addColorStop(1,'#b6ae9c');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='rgba(120,112,96,0.30)';
   c.lineWidth=3;
   for(let i=0;i<26;i++){
    c.beginPath();
    c.moveTo((i/26)*w,0);
    c.quadraticCurveTo(w*.5,h*.55,w*.5+((i-13)*14),h);
    c.stroke();
   }
  },{roughness:.72,metalness:.04},512,512);

  const shadeMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#e8e3d6');
   g.addColorStop(.5,'#c6bfae');
   g.addColorStop(1,'#8e8879');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.76,metalness:.03},256,256);

  // La cabeza: un óvalo cubierto por la tela, con la cara en sombra.
  const headMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.42,h*.36,8,w*.5,h*.5,w*.62);
   g.addColorStop(0,'#4a4640');
   g.addColorStop(.65,'#2e2b28');
   g.addColorStop(1,'#1a1817');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.85,metalness:.02},128,128);

  // Nudo al costado de la cabeza.
  const knotMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.36,h*.34,6,w*.5,h*.5,w*.62);
   g.addColorStop(0,'#f6f2e7');
   g.addColorStop(.6,'#d6cfbe');
   g.addColorStop(1,'#9c9584');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.7,metalness:.05},128,128);

  const head=part(root,new T.SphereGeometry(.40,28,22),headMat,[0,.10,0]);
  head.scale.set(.92,1.10,.94);

  const knot=part(root,new T.SphereGeometry(.17,20,16),knotMat,[.34,-.02,.26]);
  knot.scale.set(1.15,.85,1);

  // El pañuelo: una malla triangular que en p=0 se apoya abombada sobre la
  // cabeza y en p=1 se despliega plana en el triángulo del pañuelo.
  const nu=40,nv=36;
  const cloth=surface(root,nu,nv,()=>[0,0,0],clothMat);

  // Vértices del triángulo desplegado (el triángulo del pañuelo, con el
  // vértice arriba y la base abajo). La caja del triángulo y la de la tela
  // anudada son casi la misma: si no, el encuadre de una pieza no valdría
  // para los dos estados y la pieza se saldría de cuadro al desenlazarse.
  const A=[0,.46,0],B=[-.40,-.45,.02],C=[.40,-.45,.02];
  const cx=(A[0]+B[0]+C[0])/3,cy=(A[1]+B[1]+C[1])/3;
  const R=Math.max(Math.hypot(A[0]-cx,A[1]-cy),Math.hypot(B[0]-cx,B[1]-cy),Math.hypot(C[0]-cx,C[1]-cy));

  // Posición de un punto de la malla (u transversal, v vertical) sobre el triángulo.
  const tri=(u,v)=>[
   A[0]*(1-v)+(B[0]*(1-u)+C[0]*u)*v,
   A[1]*(1-v)+(B[1]*(1-u)+C[1]*u)*v,
   A[2]*(1-v)+(B[2]*(1-u)+C[2]*u)*v
  ];

  // Dos puntas colgando, que son las del pañuelo anudado.
  const tails=[];
  for(const s of [-1,1]){
   tails.push({s,m:surface(root,18,22,()=>[0,0,0],shadeMat)});
  }

  return {
   root,
   kind:'scarf',
   // p=0: anudado en la cabeza. p=1: desplegado en el triángulo.
   update(p){
    const open=p;
    const knotT=1-open;

    morph(cloth,nu,nv,(u,v)=>{
     const t=tri(u,v);
     // Posición abombada: la tela apoya sobre el cráneo, con la misma caja
     // que el triángulo desplegado.
     const dx=t[0]-cx,dy=t[1]-(cy+.16);
     const r=Math.min(1,Math.hypot(dx,dy)/R);
     const dome=Math.sqrt(Math.max(0,1-r*r))*.24;
     const wrapped=[t[0]*.86,cy+.16+(t[1]-(cy+.16))*.80,dome+.24];
     // Desplegada, la tela cuelga en arco: un triángulo plano se leeria de
     // canto y no se veria nada. El arco le da cuerpo desde cualquier vista.
     const bow=.30*Math.sin(Math.PI*u);
     const ripple=.035*Math.sin(u*9+v*4);
     const open3=[
      t[0],
      t[1],
      t[2]+bow+ripple+.10
     ];
     return [
      wrapped[0]+(open3[0]-wrapped[0])*open,
      wrapped[1]+(open3[1]-wrapped[1])*open,
      wrapped[2]+(open3[2]-wrapped[2])*open
     ];
    });

    tails.forEach(({s,m})=>{
     morph(m,18,22,(u,v)=>{
      const side=(u-.5)*2;
      const w=Math.sin(Math.pow(v,.8)*Math.PI)*.16;
      // Caída de la punta junto al nudo.
      const x=.32+s*(.13+side*w*1.4);
      const y=-.05-v*.62;
      const z=.24-side*w*.5;
      // Al desplegarse, las puntas se guardan en el pliegue del triángulo.
      const gx=s>0?.09:-.09;
      return [
       x+(gx-x)*open,
       y+(.18-y)*open,
       z+(.06-z)*open
      ];
     });
    });

    // La cabeza y el nudo se ocultan al desplegarse la tela.
    const vis=knotT>.12;
    head.visible=vis;
    head.scale.set(.92*knotT,1.10*knotT,.94*knotT);
    knot.visible=vis;
    knot.scale.set(1.15*knotT,.85*knotT,1*knotT);
   }
  };
}
