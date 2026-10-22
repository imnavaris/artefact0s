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

  // La cabeza: chica y oscura. Queda tapada por arriba: la cara se ve.
  const head=part(root,new T.SphereGeometry(.28,28,22),headMat,[0,.06,0]);
  head.scale.set(1,1.15,1);

  // El nudo, bajo el menton: de ahi salen las dos puntas.
  const knot=part(root,new T.SphereGeometry(.13,20,16),knotMat,[.04,-.08,.22]);
  knot.scale.set(1.3,.75,1);

  // El pañuelo: una malla que en p=0 es la capucha que envuelve la cabeza y
  // en p=1 es el triángulo del pañuelo.
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

  // La capucha anudada: media esfera sobre el craneo, con el borde al frente
  // de la frente. La cara queda a la vista: sin eso la pieza es un huevo.
  const cap=(u,v)=>{
   const a=v*Math.PI*.5;
   const y=.06+.31*Math.cos(a);
   const r=.31*Math.sin(a);
   const phi=-1.95+u*2.85;
   return [Math.sin(phi)*r,y,Math.cos(phi)*r];
  };

  // Dos puntas colgando del nudo: las del pañuelo atado.
  const tails=[];
  for(const s of [-1,1]){
   tails.push({s,m:surface(root,18,22,()=>[0,0,0],shadeMat)});
  }

  // Una punta: tira que cae del nudo, se abre en abanico y termina en punta.
  const tail=(u,v,s)=>{
   const w=(.055+v*.055)*(1-.5*Math.pow(v,8));
   const side=(u-.5)*2;
   return [
    .04+s*v*.13+side*w,
    -.10-v*.36,
    .16-v*.10+side*w*.3
   ];
  };

  return {
   root,
   kind:'scarf',
   // p=0: anudado en la cabeza. p=1: desplegado en el triángulo.
   update(p){
    const open=p;
    const knotT=1-open;

    morph(cloth,nu,nv,(u,v)=>{
     const t=tri(u,v);
     // Desplegada, la tela cuelga en arco: un triangulo plano se leeria de
     // canto y no se veria nada. El arco le da cuerpo desde cualquier vista.
     const bow=.16*Math.sin(Math.PI*u);
     const ripple=.03*Math.sin(u*9+v*4);
     const open3=[t[0],t[1],t[2]+bow+ripple+.06];
     const c=cap(u,v);
     return [
      c[0]+(open3[0]-c[0])*open,
      c[1]+(open3[1]-c[1])*open,
      c[2]+(open3[2]-c[2])*open
     ];
    });

    tails.forEach(({s,m})=>{
     morph(m,18,22,(u,v)=>{
      const t=tail(u,v,s);
      // Al desplegarse, las puntas se guardan en el pliegue del triangulo.
      const gx=s>0?.08:-.08;
      const gy=-.16;
      const gz=.05;
      return [
       t[0]+(gx-t[0])*open,
       t[1]+(gy-t[1])*open,
       t[2]+(gz-t[2])*open
      ];
     });
    });

    // La cabeza y el nudo se ocultan al desplegarse la tela.
    const vis=knotT>.12;
    head.visible=vis;
    head.scale.set(knotT,1.15*knotT,knotT);
    knot.visible=vis;
    knot.scale.set(1.3*knotT,.75*knotT,1*knotT);
   }
  };
}
