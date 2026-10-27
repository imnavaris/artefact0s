import {T,mat,texMat,box,part,surface,morph} from './shared.js';

const clamp01=(v)=>v<0?0:v>1?1:v;

export function createBook(){
  const root=new T.Group();

  // Tapa y contratapa en tonos cálidos de papel y cartón antiguo con marco grabado
  const coverMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#9c9486');
   g.addColorStop(.5,'#b8b0a0');
   g.addColorStop(1,'#8c8476');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='#dfd8c8';c.lineWidth=12;c.strokeRect(18,18,w-36,h-36);
  },{roughness:.6,metalness:.08});

  const brassMat=mat('#dfd8c8',{roughness:.3,metalness:.4});
  const spineMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,0);
   g.addColorStop(0,'#948c7e');g.addColorStop(.5,'#b5ad9e');g.addColorStop(1,'#948c7e');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.fillStyle='#dfd8c8';
   for(const y of [.14,.32,.5,.68,.86])c.fillRect(0,y*h-4,w,8);
  },{roughness:.55,metalness:.1});

  const pageBlockMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,0);
   g.addColorStop(0,'#c8c0b0');g.addColorStop(.7,'#e6dfd1');g.addColorStop(1,'#b5ad9e');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.fillStyle='rgba(140,132,118,0.25)';
   for(let y=0;y<h;y+=6)c.fillRect(0,y,w,2);
  },{roughness:.65,metalness:.03});

  const paperMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.32,h*.5,12,w*.5,h*.5,w*.72);
   g.addColorStop(0,'#d4ccb8');
   g.addColorStop(.6,'#ebe4d6');
   g.addColorStop(1,'#b8b0a0');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.fillStyle='rgba(120,112,98,0.22)';
   for(let y=26;y<h-26;y+=12)c.fillRect(26,y,w-58-(y%22),2);
  },{roughness:.65,metalness:.02});

  // Ceniza clara legible en tonos cálidos sin negros oscuros
  const charMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.38,h*.5,10,w*.5,h*.5,w*.7);
   g.addColorStop(0,'#9e9688');
   g.addColorStop(.5,'#8e8678');
   g.addColorStop(1,'#7e7668');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='rgba(158,150,136,0.4)';
   c.lineWidth=2;
   for(let i=0;i<7;i++){
    const y=18+i*(h-36)/6;
    c.beginPath();
    c.moveTo(w*.14,y);
    c.bezierCurveTo(w*.36,y-16,w*.58,y+18,w*.86,y-6);
    c.stroke();
   }
  },{roughness:.8,metalness:.02});

  // Hojas en combustión con el acento ocre/brasa autorizado
  const emberMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w*.3,h);
   g.addColorStop(0,'#d99b26');
   g.addColorStop(.4,'#e89c28');
   g.addColorStop(1,'#9e8678');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='rgba(217,155,38,0.7)';
   c.lineWidth=2;
   for(let i=0;i<9;i++){
    const y=10+i*(h-20)/8;
    c.beginPath();
    c.moveTo(w*.06,y);
    c.bezierCurveTo(w*.3,y-10,w*.5,y+12,w*.82,y-4);
    c.stroke();
   }
  },{roughness:.75,metalness:.05});
  emberMat.userData = { isEmber: true };

  const pages=[];

  // Lomo central con costillas de encuadernación
  const spineGeo=new T.CylinderGeometry(.24,.24,2.14,22,1,false,Math.PI*.48,Math.PI*1.04);
  spineGeo.rotateX(Math.PI/2);
  part(root,spineGeo,spineMat,[0,-.42,0]);
  for(const z of [-.82,-.41,0,.41,.82]){
   const rib=new T.CylinderGeometry(.265,.265,.075,18,1,false,Math.PI*.46,Math.PI*1.08);
   rib.rotateX(Math.PI/2);
   part(root,rib,brassMat,[0,-.42,z]);
  }

  // Mitades del libro articuladas en el eje Z
  for(const sign of [-1,1]){
   const half=new T.Group();
   half.position.set(sign*.14,-.46,0);
   half.rotation.z=-sign*.52;
   root.add(half);

   // Tapa dura con paneles de relieve
   box(half,[1.68,.10,2.14],coverMat,[sign*.84,-.05,0]);
   box(half,[1.40,.045,1.84],coverMat,[sign*.84,-.11,0]);
   box(half,[.52,.055,.66],brassMat,[sign*.84,-.12,0]);
   for(const cz of [-.98,.98]){
    box(half,[.28,.12,.28],brassMat,[sign*1.55,-.05,cz]);
   }

   // Bloque de páginas sólido
   box(half,[1.56,.20,2.02],pageBlockMat,[sign*.80,.09,0]);

   // Páginas arqueadas optimizadas en 18x14 segmentos
   for(let n=0;n<9;n++){
    const height=.18+n*.05;
    const page=surface(half,18,14,(u,v)=>{
     const arch=Math.sin(u*Math.PI)*(.18+n*.014)-u*.04;
     return [sign*(.02+u*1.56),height+arch,(v-.5)*1.98];
    },paperMat,sign<0);
    pages.push({mesh:page,sign,n,height});
   }
  }

  root.rotation.x=.46;
  root.rotation.y=-.22;
  root.position.y=-.18;

  const burnOrder=[...pages].sort((a,b)=>b.n-a.n);

  const SPAN=.55;
  const burnAt=(i,p)=>{
   const start=(i/burnOrder.length)*(1-SPAN);
   return clamp01((p-start)/SPAN);
  };

  return {
   root,
   kind:'book',
   update(p){
    burnOrder.forEach((pg,i)=>{
     const amount=burnAt(i,p);
     const {mesh,sign,n,height}=pg;
     mesh.material=amount>=1?charMat:amount>0?emberMat:paperMat;
     morph(mesh,18,14,(u,v)=>{
      const arch=Math.sin(u*Math.PI)*(.18+n*.014)-u*.04;
      const shrink=1-.34*amount;
      const curl=amount*.30*Math.sin(u*Math.PI)*Math.pow(v,2);
      const edge=amount*.22*Math.pow(Math.abs(u-.5)*2,3);
      return [
       sign*(.02+u*1.56*shrink),
       height+arch+curl+edge,
       (v-.5)*1.98*shrink
      ];
     });
    });
   },
   burn(p){
    let sum=0;
    for(let i=0;i<burnOrder.length;i++)sum+=burnAt(i,p);
    return sum/burnOrder.length;
   }
  };
}
