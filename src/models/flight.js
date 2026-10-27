import {T,mat,texMat,box,part,tube} from './shared.js';

export function createFlight(){
  const root=new T.Group();

  const fuselageMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,0,h);
   g.addColorStop(0,'#ebe4d6');
   g.addColorStop(.48,'#dfd8c8');
   g.addColorStop(.52,'#b8b0a0');
   g.addColorStop(.68,'#a49c8e');
   g.addColorStop(.72,'#9e9688');
   g.addColorStop(1,'#8e8678');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.52,metalness:.22});

  const wingMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#f2efe6');
   g.addColorStop(.45,'#e6dfd1');
   g.addColorStop(.85,'#c4bcac');
   g.addColorStop(1,'#a49c8e');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.42,metalness:.45});

  const tailFinMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#ebe4d6');
   g.addColorStop(.45,'#dfd8c8');
   g.addColorStop(1,'#9e9688');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.48,metalness:.25});

  const nacelleMat=mat('#b8b0a0',{roughness:.4,metalness:.55});
  const darkMetal=mat('#968e80',{roughness:.5,metalness:.45});
  const glassMat=mat('#8e8678',{roughness:.3,metalness:.3});
  const propTipMat=mat('#dfd8c8',{roughness:.35,metalness:.4});
  const rampMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#ebe4d6');
   g.addColorStop(.5,'#dfd8c8');
   g.addColorStop(1,'#b8b0a0');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.55,metalness:.2});
  const bayInteriorMat=mat('#8e8678',{roughness:.65,metalness:.1});

  box(root,[3.05,.91,1.04],fuselageMat,[0,-.03,0]);
  const nose=part(root,new T.SphereGeometry(.65,14,10),fuselageMat,[-1.55,-.06,0]);
  nose.scale.set(.85,.69,.8);
  box(root,[.7,.48,.9],fuselageMat,[-1.25,.5,0],[0,0,-.28]);

  for(const s of [-1,1]){
   box(root,[.52,.26,.025],glassMat,[-1.34,.47,s*.48],[0,0,-.2]);
   for(let i=0;i<5;i++)box(root,[.20,.22,.028],glassMat,[-.75+i*.43,.14,s*.53]);
  }

  box(root,[1.05,.12,5.6],wingMat,[-.12,.64,0]);
  box(root,[.86,.09,2.7],wingMat,[1.36,.12,0]);

  for(const s of [-1,1]){
   box(root,[.72,1.08,.09],tailFinMat,[1.37,.66,s*1.27]);
   part(root,new T.CylinderGeometry(.20,.20,.80,12),nacelleMat,[-.2,.53,s*1.3],[0,0,Math.PI/2]);
   part(root,new T.ConeGeometry(.20,.28,12),darkMetal,[-.72,.53,s*1.3],[0,0,Math.PI/2]);
   tube(root,[[0,-.35,s*.52],[-.08,.62,s*1.45]],.032,wingMat,12,5);
   tube(root,[[.12,-.42,s*.48],[.15,-.88,s*1.74]],.048,darkMetal,12,5);
   part(root,new T.CylinderGeometry(.20,.20,.16,12),darkMetal,[.15,-.88,s*1.75],[Math.PI/2,0,0]);
  }

  part(root,new T.CylinderGeometry(.15,.15,.13,12),darkMetal,[-1.45,-.82,0],[Math.PI/2,0,0]);
  tube(root,[[-1.38,-.4,0],[-1.45,-.82,0]],.038,darkMetal,12,5);

  for(const s of [-1,1]){
   const p=new T.Group();
   p.position.set(-.86,.53,s*1.3);
   root.add(p);
   box(p,[.035,.82,.07],propTipMat);
   box(p,[.035,.07,.82],propTipMat);
  }

  box(root,[.06,.1,1.08],fuselageMat,[1.57,.46,0]);
  for(const s of [-1,1])box(root,[.06,.86,.08],fuselageMat,[1.57,-.01,s*.52]);
  const ramp=new T.Group();
  ramp.position.set(1.57,-.49,0);
  root.add(ramp);
  box(ramp,[.06,.91,.95],rampMat,[0,.455,0]);
  box(root,[.03,.68,.78],bayInteriorMat,[1.535,-.04,0]);

  root.rotation.set(.32,-.62,-.08);
  root.scale.setScalar(.88);

  return {
   root,
   kind:'flight',
   update(p){
    ramp.rotation.z=-p*Math.PI*.62;
    root.rotation.y=-.62 - p*.28;
    root.rotation.x=.32 + p*.12;
   }
  };
}
