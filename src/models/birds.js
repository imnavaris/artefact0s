import {T,mat,texMat,part,shape,tube} from './shared.js';

const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const rnd=(i,k)=>{const s=Math.sin(i*127.1+k*311.7)*43758.5453;return s-Math.floor(s);};
const lerpAngle=(a,b,t)=>{const d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t;};

export function createBirds(){
 const root=new T.Group();
 const N=16;

 // Materiales mas brillantes con blancos destacados
 const bodyMat=texMat((c,w,h)=>{
 const g=c.createLinearGradient(0,0,w,h);
 g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#e8e4dc');g.addColorStop(1,'#c4bcac');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.35});
 const wingMat=texMat((c,w,h)=>{
 const g=c.createLinearGradient(0,0,w,h);
 g.addColorStop(0,'#ffffff');g.addColorStop(.55,'#f0ede4');g.addColorStop(1,'#b5ad9e');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.3});
 const beakMat=mat('#ffffff',{roughness:.3,metalness:.2});
 const cageBarMat=mat('#dfd8c8',{roughness:.35,metalness:.45});
 const cageRingMat=mat('#ffffff',{roughness:.25,metalness:.6});

 const birds=[];
 for(let i=0;i<N;i++){
 const b=new T.Group();
 b.rotation.order='YXZ';
 root.add(b);
 const body=part(b,new T.SphereGeometry(.12,8,6),bodyMat);
 body.scale.set(1.05,.95,2.15);
 part(b,new T.SphereGeometry(.088,7,6),bodyMat,[0,.06,.20]);
 part(b,new T.ConeGeometry(.05,.17,5),beakMat,[0,.055,.33],[Math.PI/2,0,0]);
 shape(b,[[-.04,0],[.04,0],[.18,-.29],[-.18,-.29]],.024,wingMat).rotation.x=Math.PI*.48;
 const wings=[];
 for(const s of [-1,1]){
 const pivot=new T.Group();
 b.add(pivot);
 shape(pivot,[[0,0],[s*.62,.26],[s*.92,.12],[s*.58,-.08],[s*.2,-.13]],.026,wingMat);
 wings.push({s,pivot});
 }
 const a=i*2.39996323;
 const rr=.25+.95*Math.sqrt((i+.5)/N);
 birds.push({b,wings,a,start:[Math.cos(a)*rr,-1.1+rnd(i,1)*1.75,Math.sin(a)*rr]});
 }

 const cage=new T.Group();
 root.add(cage);
 const bars=[];
 const nBars=9;
 for(let i=0;i<nBars;i++){
 const a=i/nBars*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
 const g=new T.Group();
 g.position.set(x*1.62,-1.42,z*1.62);
 cage.add(g);
 tube(g,[[0,0,0],[0,2.06,0],[-x*.84,3.06,-z*.84],[-x*1.62,3.36,-z*1.62]],.038,cageBarMat,14,6);
 bars.push({g,tan:new T.Vector3(-z,0,x)});
 }
 const rings=new T.Group();
 cage.add(rings);
 for(const y of [-1.42,-.4,.62]){
 part(rings,new T.TorusGeometry(1.62,.052,8,32),cageRingMat,[0,y,0],[Math.PI/2,0,0]);
 }
 const crown=part(cage,new T.TorusGeometry(.2,.042,6,16),cageRingMat,[0,1.94,0],[Math.PI/2,0,0]);

 return {
 root,
 kind:'birds',
 update(p){
 // La animacion dura mas y se expande en abanico largo
 const open=sm(.08,.48,p);
 bars.forEach(({g,tan})=>g.quaternion.setFromAxisAngle(tan,-open*1.05));
 rings.visible=open<.58;
 rings.scale.set(1+open*.6,1,1+open*.6);
 crown.visible=open<.32;

 birds.forEach(({b,wings,a,start},i)=>{
 const ti=.18+.25*rnd(i,2);
 const s=sm(ti,0.98,p);
 const phi=a+(rnd(i,5)-.5)*1.1;
 const hd=4.2+rnd(i,3)*2.6; // Vuelo mas amplio hacia el horizonte
 const end=[Math.cos(phi)*hd, 2.2+rnd(i,4)*3.2, Math.sin(phi)*hd*.88];
 const e=Math.pow(s,1.25);
 const px=start[0]+(end[0]-start[0])*e;
 const py=start[1]+(end[1]-start[1])*e+Math.sin(s*Math.PI)*.45;
 const pz=start[2]+(end[2]-start[2])*e;
 b.position.set(px,py,pz);
 const dx=end[0]-start[0],dy=end[1]-start[1],dz=end[2]-start[2];
 const yawFly=Math.atan2(dx,dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
 const turn=sm(0,.12,s);
 b.rotation.set(-pitch*turn*.8,lerpAngle(-a,yawFly,turn),0);
 b.scale.setScalar(1-.18*s);
 const amp=.12+.65*sm(0,.1,s);
 const beat=Math.sin(p*(42+50*turn)+i*1.3)*amp;
 wings.forEach(({s:sg,pivot})=>{pivot.rotation.z=sg*(.18+beat);});
 });
 }
 };
}