import {T,mat,texMat,box,part,surface,morph,approach} from './shared.js';

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

 const charMat=texMat((c,w,h)=>{
  const g=c.createRadialGradient(w*.35,h*.5,10,w*.5,h*.5,w*.7);
  g.addColorStop(0,'#ff7722');
  g.addColorStop(.25,'#d94618');
  g.addColorStop(.55,'#8c583a');
  g.addColorStop(.82,'#dec296');
  g.addColorStop(1,'#4d2f24');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.7,metalness:.08,emissive:'#5e1906',emissiveIntensity:.38});

 let burning=true,heat=1;
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

 // Left and right book halves hinged properly around Z axis
 for(const sign of [-1,1]){
  const half=new T.Group();
  half.position.set(sign*.14,-.46,0);
  half.rotation.z=-sign*.18;
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

  // Arched pages on top
  for(let n=0;n<9;n++){
   const height=.18+n*.032;
   const isChar=n>=6;
   const page=surface(half,26,20,(u,v)=>{
    const arch=Math.sin(u*Math.PI)*(.18+n*.014)-u*.04;
    return [sign*(.02+u*1.56),height+arch,(v-.5)*1.98];
   },isChar?charMat:paperMat,sign<0);
   pages.push({mesh:page,sign,n,height});
  }
 }

 // Glowing ember bed resting strictly on top of the upper pages
 const emberMats=[
  mat('#fff4b0',{emissive:'#ffb82e',emissiveIntensity:.95,roughness:.25}),
  mat('#ff7b1c',{emissive:'#e64208',emissiveIntensity:.88,roughness:.35}),
  mat('#d92b14',{emissive:'#991406',emissiveIntensity:.75,roughness:.5})
 ];
 const embers=[];
 for(let i=0;i<24;i++){
  const sx=((i*1.618)%1-.5)*1.65;
  const sz=((i*2.718)%1-.5)*1.35;
  const baseArch=.12+Math.sin(Math.min(1,Math.abs(sx)/1.55)*Math.PI)*.18;
  const m=part(root,new T.IcosahedronGeometry(.08+(i%3)*.025,1),emberMats[i%3],[sx,baseArch,sz]);
   m.userData.asciiSkip=true;
  m.scale.set(1.3,.4,1.2);
  embers.push({mesh:m,sx,sz,baseArch,phase:i*1.37});
 }

 // Realistic 3D Fire & Spark Particle System
 const fireMats=[
  mat('#fffad4',{emissive:'#ffe670',emissiveIntensity:1.0,roughness:.2}),
  mat('#ffd447',{emissive:'#ff9e18',emissiveIntensity:.95,roughness:.25}),
  mat('#ff731c',{emissive:'#e63e00',emissiveIntensity:.9,roughness:.35}),
  mat('#e02b14',{emissive:'#a81408',emissiveIntensity:.8,roughness:.45}),
  mat('#9e4c36',{emissive:'#5e2212',emissiveIntensity:.5,roughness:.65})
 ];

 const particles=[];
 const pCount=92;
 for(let i=0;i<pCount;i++){
  const u=((i*.6180339)%1),v=((i*.381966)%1);
  const angle=u*Math.PI*2;
  const radius=Math.pow(v,.65)*.98;
  const x0=Math.cos(angle)*radius*1.05;
  const z0=Math.sin(angle)*radius*.72;
  const y0=.14+Math.sin(Math.min(1,Math.abs(x0)/1.5)*Math.PI)*.18;
  const isSpark=i%4===0;
  const geo=isSpark?new T.OctahedronGeometry(.052,0):new T.IcosahedronGeometry(.11-(i%4)*.014,1);
  const tier=isSpark?1:Math.min(4,Math.floor(v*3.5));
  const mesh=part(root,geo,fireMats[tier],[x0,y0,z0]);
   mesh.userData.asciiSkip=true;
  particles.push({
   mesh,x0,y0,z0,radius,isSpark,tier,
   speed:.62+(i%9)*.09,
   seed:i*2.39996,
   maxH:isSpark?1.35+(i%5)*.22:.68+(1-v*.5)*.72
  });
 }

 root.rotation.x=.46;
 root.rotation.y=-.22;
 root.position.y=-.18;

 return {
  root,
  kind:'book',
  get state(){return {burning,heat};},
  toggle(){burning=!burning;},
  update(t,dt,p){
   heat=approach(heat,burning?1:0,dt,3.2);
   // Check if book is rotated upside-down (looking at contratapa) so flames don't poke below back cover
   const upVec=new T.Vector3(0,1,0).applyQuaternion(root.quaternion);
   const upright=Math.max(0,Math.min(1,(upVec.y+.15)/0.65));

   pages.forEach(({mesh,sign,n,height})=>{
    if(n<5)return;
    morph(mesh,26,20,(u,v)=>{
     const arch=Math.sin(u*Math.PI)*(.18+n*.014)-u*.04;
     const flutter=heat*.036*Math.sin(v*8+t*3.6+n)*Math.pow(u,.8);
     return [sign*(.02+u*1.56),height+arch+flutter,(v-.5)*1.98];
    });
   });

   embers.forEach(({mesh,baseArch,phase})=>{
    mesh.visible=heat>.02&&upright>.1;
    const pulse=(.78+.32*Math.sin(t*7+phase))*heat*upright;
    mesh.scale.set(1.25*pulse,.38*pulse,1.15*pulse);
    mesh.position.y=baseArch+.02*Math.sin(t*4+phase);
   });

   particles.forEach((pt,i)=>{
    pt.mesh.visible=heat>.015&&upright>.12;
    if(!pt.mesh.visible)return;
    const life=(t*pt.speed+pt.seed)%1;
    const rise=Math.pow(life,.88)*pt.maxH*heat*upright;
    const pinch=1-life*(pt.isSpark?.18:.46);
    const turbX=Math.sin(life*7.5-t*5.2+pt.seed)*(.07+life*.15)+Math.cos(t*3.1+i)*life*.05+p.x*life*.12;
    const turbZ=Math.cos(life*6.8-t*4.6+pt.seed*1.3)*(.06+life*.12)+p.y*life*.07;
    pt.mesh.position.set(
     pt.x0*pinch+turbX,
     pt.y0+rise,
     pt.z0*pinch+turbZ
    );
    const env=life<.18?life/.18:Math.pow(1-(life-.18)/.82,pt.isSpark?.55:1.15);
    const s=Math.max(.001,env*heat*upright*(.86+.2*Math.sin(t*11+pt.seed)));
    if(pt.isSpark){
     pt.mesh.scale.set(s*.65,s*1.45,s*.65);
    }else{
     pt.mesh.scale.set(s*(1.05-.25*life),s*(1.25+.35*life),s*(1.05-.25*life));
    }
    pt.mesh.rotation.set(t*2.2+pt.seed,t*1.7-pt.seed,life*2.5);
    if(!pt.isSpark){
     const matIdx=life<.22?0:life<.46?1:life<.72?2:life<.88?3:4;
     pt.mesh.material=fireMats[Math.min(4,Math.max(matIdx,pt.tier>2?1:0))];
    }
   });
  }
 };
}
