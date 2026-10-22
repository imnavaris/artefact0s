import {T,texMat,surface,morph,part,approach} from './shared.js';

export function createScarf(){
 const root=new T.Group();

 // Rich grayscale cloth texture with diagonal drapery folds (never a single flat color!)
 const clothMat=texMat((c,w,h)=>{
  const g=c.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#ffffff');
  g.addColorStop(.28,'#d4d6dc');
  g.addColorStop(.55,'#f5f5f7');
  g.addColorStop(.82,'#b8bac2');
  g.addColorStop(1,'#e8e9ed');
  c.fillStyle=g;c.fillRect(0,0,w,h);
  for(let i=0;i<22;i++){
   c.strokeStyle=i%2===0?'rgba(255,255,255,0.55)':'rgba(75,78,86,0.38)';
   c.lineWidth=8+(i%4)*5;
   c.beginPath();
   c.moveTo((i/22)*w,0);
   c.quadraticCurveTo(w*.48,h*.52,w*.5+((i-11)*16),h);
   c.stroke();
  }
 },{roughness:.55,metalness:.06},512,512);

 // Materiales marcadores de identificacion (offscreen). El pipeline ASCII ya no los
 // lee por color: cada pieza trae su propio color de inscripcion.
 const headShadowMat=new T.MeshBasicMaterial({color:0xff00aa,side:T.DoubleSide});
 const textMat=new T.MeshBasicMaterial({color:0x00ff44,side:T.DoubleSide});

 const knotShadeMat=texMat((c,w,h)=>{
  const g=c.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#ffffff');
  g.addColorStop(.45,'#cfd1d8');
  g.addColorStop(1,'#7c7f88');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.52,metalness:.08},128,128);

 let tied=true,knot=1;

 const nu=76,nv=48;
 const hood=surface(root,nu,nv,()=>[0,0,0],clothMat);

 const tails=[];
 for(const s of [-1,1]){
  tails.push({s,m:surface(root,24,30,()=>[0,0,0],knotShadeMat)});
 }

 const chinKnot=part(root,new T.SphereGeometry(.22,24,18),knotShadeMat,[.46,-.46,.26]);
 chinKnot.scale.set(1.2,.85,.9);

 const headOval=part(root,new T.SphereGeometry(.50,28,22),headShadowMat,[.45,.42,.36]);
 headOval.scale.set(.52,1.18,.48);

 // Crisp, generously spaced 3D lettering for "NUNCA" (top row) and "MÁS" (bottom row) on the extended triangle (ref image_cf1e7e.jpg)
 const textGroup=new T.Group();
 root.add(textGroup);
 const strokeSegs=[
  // === N === (-1.62 .. -1.12)
  [[-1.62,.14],[-1.62,.72]],[[-1.62,.70],[-1.12,.16]],[[-1.12,.14],[-1.12,.72]],
  // === U === (-0.86 .. -0.38)
  [[-.86,.72],[-.86,.24]],[[-.86,.24],[-.62,.14]],[[-.62,.14],[-.38,.24]],[[-.38,.24],[-.38,.72]],
  // === N === (-0.12 .. +0.38)
  [[-.12,.14],[-.12,.72]],[[-.12,.70],[.38,.16]],[[.38,.14],[.38,.72]],
  // === C === (+0.64 .. +1.04)
  [[1.04,.64],[.78,.72]],[[.78,.72],[.64,.52]],[[.64,.52],[.64,.32]],[[.64,.32],[.78,.14]],[[.78,.14],[1.04,.22]],
  // === A === (+1.22 .. +1.70)
  [[1.22,.14],[1.46,.72]],[[1.46,.72],[1.70,.14]],[[1.30,.36],[1.62,.36]],

  // === M === (-1.04 .. -0.34)
  [[-1.04,-.54],[-.98,.02]],[[-.98,.02],[-.69,-.36]],[[-.69,-.36],[-.40,.02]],[[-.40,.02],[-.34,-.54]],
  // === Á === (-0.08 .. +0.42)
  [[-.08,-.54],[.17,.02]],[[.17,.02],[.42,-.54]],[[0,-.32],[.34,-.32]],[[.16,.06],[.32,.15]],
  // === S === (+0.64 .. +1.04)
  [[1.02,-.06],[.78,.02]],[[.78,.02],[.64,-.11]],[[.64,-.11],[.84,-.26]],[[.84,-.26],[1.02,-.40]],[[1.02,-.40],[.80,-.54]],[[.80,-.54],[.62,-.46]]
 ];
 for(const [[x1,y1],[x2,y2]] of strokeSegs){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
  const cx=(x1+x2)*.5,cy=(y1+y2)*.5;
  const bar=new T.Mesh(new T.BoxGeometry(len+.04,.078,.18),textMat);
  bar.position.set(cx,cy,.22);
  bar.rotation.z=ang;
  textGroup.add(bar);
 }

 return {
  root,
  kind:'scarf',
  get state(){return {tied,knot};},
  toggle(){tied=!tied;},
  update(t,dt,p){
   knot=approach(knot,tied?1:0,dt,4.5);
   const ext=1-knot;

   morph(hood,nu,nv,(u,v)=>{
    // --- STATE 1: TIED HEADSCARF (image_cf1f39.png) ---
    const tx=-1.68+u*2.60;
    const tyBot=-.42+.08*Math.sin(u*Math.PI*.85)-.06*u;
    let tyTop;
    if(u<.84){
     tyTop=-.42+1.92*Math.pow(Math.sin((u/.84)*Math.PI*.56),.76);
    }else{
     const f=(u-.84)/.16;
     const peak=-.42+1.92*Math.pow(Math.sin(Math.PI*.56),.76);
     tyTop=peak*(1-f*f)+(-.46)*(f*f);
    }
    const ty=tyBot+v*(tyTop-tyBot);
    const domeZ=Math.sin(v*Math.PI)*Math.sin(u*Math.PI*.92)*.48;
    const foldZ=Math.sin(u*16-v*9+t*1.3)*.032*Math.sin(v*Math.PI);
    const tz=domeZ+foldZ;

    // --- STATE 2: EXTENDED TRIANGULAR BANNER (image_cf1e7e.jpg) ---
    const ex=(u-.5)*5.60;
    const sag=.12*Math.sin(u*Math.PI);
    const eyTop=.92+.05*(u-.5)-sag;
    const distMid=Math.abs(u-.5)*2;
    const eyBot=-1.32*(1-Math.pow(distMid,.92))+eyTop*Math.pow(distMid,.92);
    const ey=eyBot+v*(eyTop-eyBot);
    const eFold=Math.sin((u-.5)*22+v*8+t*1.2)*.038*(1-distMid*.5)+p.x*.04*(u-.5);
    const ez=.04+eFold;

    return [
     tx*knot+ex*ext,
     ty*knot+ey*ext,
     tz*knot+ez*ext
    ];
   });

   tails.forEach(({s,m})=>{
    morph(m,24,30,(u,v)=>{
     const leafW=Math.sin(Math.pow(v,.76)*Math.PI)*.28;
     const side=(u-.5)*2;
     const dirAngle=s<0?-.38:.44;
     const spineX=.46+Math.sin(dirAngle)*v*1.28;
     const spineY=-.44-Math.cos(dirAngle)*v*1.24;
     const perpX=Math.cos(dirAngle)*side*leafW;
     const perpY=-Math.sin(dirAngle)*side*leafW;
     const tx=spineX+perpX+Math.sin(t*1.5+v*4+s)*.02*v;
     const ty=spineY+perpY;
     const tz=.24+(1-Math.abs(side))*.12+s*.04*v;

     const kx=s*(2.68+v*.28)+(u-.5)*.14*(1-v*.5);
     const ky=.90+(s>0?.03:-.03)+v*.06+Math.sin(u*Math.PI*2)*.11*(1-v*.4);
     const kz=.08+Math.cos(u*Math.PI*2)*.09*(1-v*.4);

     return [
      tx*knot+kx*ext,
      ty*knot+ky*ext,
      tz*knot+kz*ext
     ];
    });
   });

   headOval.visible=knot>.18;
   headOval.scale.set(.52*knot,1.18*knot,.48*knot);
   chinKnot.visible=knot>.1;
   chinKnot.scale.set(1.2*knot,.85*knot,.9*knot);

   textGroup.visible=ext>.15;
   const ts=Math.max(.001,Math.pow(ext,1.1));
   textGroup.scale.set(ts,ts,ts);
  }
 };
}
