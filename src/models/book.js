import {T,mat,texMat,box,part,surface,morph} from './shared.js';

const clamp01=(v)=>v<0?0:v>1?1:v;

export function createBook(){
  const root=new T.Group();

  // Rich multi-tone antique leather cover & contratapa texture (bright warm terracotta, mahogany, gold-ochre, and char)
  const coverMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#c44d34');
   g.addColorStop(.35,'#e06d48');
   g.addColorStop(.7,'#9e3522');
   g.addColorStop(1,'#5e2218');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   // Ornate golden-ochre border frame & corner plates on contratapa
   c.strokeStyle='#f5c869';c.lineWidth=14;c.strokeRect(18,18,w-36,h-36);
   c.strokeStyle='#d99438';c.lineWidth=6;c.strokeRect(38,38,w-76,h-76);
   // Central emblem on contratapa
   c.fillStyle='#f5c869';
   c.beginPath();c.arc(w/2,h/2,38,0,Math.PI*2);c.fill();
   c.fillStyle='#a83824';
   c.beginPath();c.arc(w/2,h/2,22,0,Math.PI*2);c.fill();
   // Burn/charred edge patches
   for(let i=0;i<36;i++){
    const ang=(i/36)*Math.PI*2;
    const x=w/2+Math.cos(ang)*(w*.46),y=h/2+Math.sin(ang)*(h*.46);
    const rg=c.createRadialGradient(x,y,2,x,y,24);
    rg.addColorStop(0,'rgba(45,25,18,0.75)');
    rg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=rg;c.fillRect(x-24,y-24,48,48);
   }
  },{roughness:.5,metalness:.18});

  const brassMat=mat('#f5c869',{roughness:.3,metalness:.65});
  const spineMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,0);
   g.addColorStop(0,'#8c3220');g.addColorStop(.5,'#d45b3e');g.addColorStop(1,'#8c3220');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.fillStyle='#f5c869';
   for(const y of [.14,.32,.5,.68,.86])c.fillRect(0,y*h-6,w,12);
  },{roughness:.48,metalness:.22});

  const pageBlockMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,0);
   g.addColorStop(0,'#e0c99e');g.addColorStop(.68,'#fff4dc');g.addColorStop(.9,'#c49460');g.addColorStop(1,'#5c3828');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.fillStyle='rgba(120,82,50,0.32)';
   for(let y=0;y<h;y+=6)c.fillRect(0,y,w,2);
  },{roughness:.68,metalness:.05});

  const paperMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.32,h*.5,12,w*.5,h*.5,w*.72);
   g.addColorStop(0,'#d49b62');
   g.addColorStop(.35,'#f5e6c4');
   g.addColorStop(.76,'#fff8e6');
   g.addColorStop(.92,'#b87c48');
   g.addColorStop(1,'#593626');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.fillStyle='rgba(110,74,46,0.36)';
   for(let y=26;y<h-26;y+=12)c.fillRect(26,y,w-58-(y%22),3);
  },{roughness:.68,metalness:.04});

  // Papel carbonizado: sin fuego ni brasas, solo la fibra quemada con vetas
  // incandescentes en la grieta.
  const charMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.38,h*.5,10,w*.5,h*.5,w*.7);
   g.addColorStop(0,'#7a3520');
   g.addColorStop(.32,'#4a2216');
   g.addColorStop(.66,'#2b1710');
   g.addColorStop(1,'#171009');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='rgba(196,84,28,0.55)';
   c.lineWidth=3;
   for(let i=0;i<7;i++){
    const y=18+i*(h-36)/6;
    c.beginPath();
    c.moveTo(w*.14,y);
    c.bezierCurveTo(w*.36,y-16,w*.58,y+18,w*.86,y-6);
    c.stroke();
   }
  },{roughness:.86,metalness:.02});

  const pages=[];

  // Curved central spine (lomo) with golden binding ribs so contratapa is 100% solid
  const spineGeo=new T.CylinderGeometry(.24,.24,2.14,22,1,false,Math.PI*.48,Math.PI*1.04);
  spineGeo.rotateX(Math.PI/2);
  part(root,spineGeo,spineMat,[0,-.42,0]);
  for(const z of [-.82,-.41,0,.41,.82]){
   const rib=new T.CylinderGeometry(.265,.265,.075,18,1,false,Math.PI*.46,Math.PI*1.08);
   rib.rotateX(Math.PI/2);
   part(root,rib,brassMat,[0,-.42,z]);
  }

  // Left and right book halves hinged properly around Z axis. La bisagra se
  // abre bastante: con las tapas casi planas, la hoja de arriba tapa las
  // demas y el libro se lee como una masa, no como un libro abierto.
  for(const sign of [-1,1]){
   const half=new T.Group();
   half.position.set(sign*.14,-.46,0);
   half.rotation.z=-sign*.52;
   root.add(half);

   // Hardcover board (tapa / contratapa) + decorative relief panels on contratapa
   box(half,[1.68,.10,2.14],coverMat,[sign*.84,-.05,0]);
   box(half,[1.40,.045,1.84],coverMat,[sign*.84,-.11,0]);
   box(half,[.52,.055,.66],brassMat,[sign*.84,-.12,0]);
   for(const cz of [-.98,.98]){
    box(half,[.28,.12,.28],brassMat,[sign*1.55,-.05,cz]);
   }

   // Solid page block resting on cover so sides and back have full volume
   box(half,[1.56,.20,2.02],pageBlockMat,[sign*.80,.09,0]);

   // Arched pages on top. El paso entre hojas es de 0,05 unidades (una celda):
   // con menos, las nueve hojas se pisan y la trama hierve.
   for(let n=0;n<9;n++){
    const height=.18+n*.05;
    const page=surface(half,26,20,(u,v)=>{
     const arch=Math.sin(u*Math.PI)*(.18+n*.014)-u*.04;
     return [sign*(.02+u*1.56),height+arch,(v-.5)*1.98];
    },paperMat,sign<0);
    pages.push({mesh:page,sign,n,height});
   }
  }

  root.rotation.x=.46;
  root.rotation.y=-.22;
  root.position.y=-.18;

  // La quema arranca por la hoja mas alta de cada tanda.
  const burnOrder=[...pages].sort((a,b)=>b.n-a.n);

  return {
   root,
   kind:'book',
   // El estado es funcion del progreso: bajar el scroll deshace la quema.
   update(p){
    burnOrder.forEach((pg,i)=>{
     const amount=clamp01(p*burnOrder.length-i);
     const {mesh,sign,n,height}=pg;
     mesh.material=amount>.5?charMat:paperMat;
     morph(mesh,26,20,(u,v)=>{
      const arch=Math.sin(u*Math.PI)*(.18+n*.014)-u*.04;
      // La hoja carbonizada se encoge y sus bordes se levantan.
      const shrink=1-.22*amount;
      const curl=amount*.16*Math.sin(u*Math.PI)*Math.pow(v,2);
      const edge=amount*.10*Math.pow(Math.abs(u-.5)*2,3);
      return [
       sign*(.02+u*1.56*shrink),
       height+arch+curl+edge,
       (v-.5)*1.98*shrink
      ];
     });
    });
   }
  };
}
