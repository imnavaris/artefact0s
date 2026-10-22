import {T,mat,texMat,box,part,tube,approach} from './shared.js';

export function createFlight(){
 const root=new T.Group();

 // Distinct multi-color livery for the Short Skyvan PA-51 so fuselage, wings, engines, tail fins, and ramp read clearly
 const fuselageMat=texMat((c,w,h)=>{
  const g=c.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#f0e6d2');
  g.addColorStop(.48,'#dfd3bc');
  g.addColorStop(.52,'#e07a2e'); // Ochre-orange identification cheatline
  g.addColorStop(.68,'#b84a24');
  g.addColorStop(.72,'#4d6e66'); // Maritime slate-olive lower hull
  g.addColorStop(1,'#354d47');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.52,metalness:.22});

 const wingMat=texMat((c,w,h)=>{
  const g=c.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#e2edf5');
  g.addColorStop(.45,'#98b4c4');
  g.addColorStop(.85,'#688699');
  g.addColorStop(1,'#e0602e');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.42,metalness:.45});

 const tailFinMat=texMat((c,w,h)=>{
  const g=c.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#e87a2e');
  g.addColorStop(.45,'#f0e6d2');
  g.addColorStop(1,'#466964');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.48,metalness:.25});

 const nacelleMat=mat('#c99242',{roughness:.4,metalness:.55});
 const darkMetal=mat('#384852',{roughness:.5,metalness:.45});
 const glassMat=mat('#4cc9f0',{roughness:.2,metalness:.3,emissive:'#1b5e7a',emissiveIntensity:.45});
 const propTipMat=mat('#f5c84c',{roughness:.35,metalness:.4});
 const rampMat=texMat((c,w,h)=>{
  const g=c.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#d98236');
  g.addColorStop(.5,'#dfd3bc');
  g.addColorStop(1,'#7d4e2d');
  c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.55,metalness:.2});
 const bayInteriorMat=mat('#b84428',{roughness:.65,emissive:'#4f1508',emissiveIntensity:.35});

 let open=false,doorAngle=0;

 // Short Skyvan: boxy fuselage, nose cone, stepped cockpit, high braced wing, twin turboprops, H-tail twin fins, rear cargo ramp
 box(root,[3.05,.91,1.04],fuselageMat,[0,-.03,0]);
 const nose=part(root,new T.SphereGeometry(.65,32,20),fuselageMat,[-1.55,-.06,0]);
 nose.scale.set(.85,.69,.8);
 box(root,[.7,.48,.9],fuselageMat,[-1.25,.5,0],[0,0,-.28]);

 // Cockpit glazing & side cabin windows
 for(const s of [-1,1]){
  box(root,[.52,.26,.025],glassMat,[-1.34,.47,s*.48],[0,0,-.2]);
  for(let i=0;i<5;i++)box(root,[.20,.22,.028],glassMat,[-.75+i*.43,.14,s*.53]);
 }

 // High straight wing & horizontal tailplane
 box(root,[1.05,.12,5.6],wingMat,[-.12,.64,0]);
 box(root,[.86,.09,2.7],wingMat,[1.36,.12,0]);

 // Twin vertical tail fins, twin engine nacelles, wing struts, and main landing gear
 for(const s of [-1,1]){
  box(root,[.72,1.08,.09],tailFinMat,[1.37,.66,s*1.27]);
  part(root,new T.CylinderGeometry(.20,.20,.80,20),nacelleMat,[-.2,.53,s*1.3],[0,0,Math.PI/2]);
  part(root,new T.ConeGeometry(.20,.28,20),darkMetal,[-.72,.53,s*1.3],[0,0,Math.PI/2]);
  // Wing bracing strut
  tube(root,[[0,-.35,s*.52],[-.08,.62,s*1.45]],.032,wingMat);
  // Landing gear strut & wheel
  tube(root,[[.12,-.42,s*.48],[.15,-.88,s*.74]],.048,darkMetal);
  part(root,new T.CylinderGeometry(.20,.20,.16,20),darkMetal,[.15,-.88,s*.75],[Math.PI/2,0,0]);
 }

 // Nose wheel
 part(root,new T.CylinderGeometry(.15,.15,.13,20),darkMetal,[-1.45,-.82,0],[Math.PI/2,0,0]);
 tube(root,[[-1.38,-.4,0],[-1.45,-.82,0]],.038,darkMetal);

 // Spinning propellers with bright yellow-gold blade tips
 const propellers=[];
 for(const s of [-1,1]){
  const p=new T.Group();
  p.position.set(-.86,.53,s*1.3);
  root.add(p);
  box(p,[.035,.82,.07],propTipMat);
  box(p,[.035,.07,.82],propTipMat);
  propellers.push(p);
 }

 // Rear cargo bay frame & hinged cargo ramp
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
  get state(){return {open,doorAngle};},
  toggle(){open=!open;},
  update(t,dt){
   doorAngle=approach(doorAngle,open?1:0,dt,3);
   ramp.rotation.z=-doorAngle*Math.PI*.62;
   propellers.forEach(p=>p.rotation.x=t*7.5);
  }
 };
}
