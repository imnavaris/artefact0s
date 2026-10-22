import {T,mat,texMat,part,shape,tube,approach} from './shared.js';

export function createBirds(){
 const root=new T.Group();

 // Vibrant multi-colored plumage palettes for the flock
 const bodyPalettes=[
  texMat((c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#ffd166');g.addColorStop(.55,'#f4a261');g.addColorStop(1,'#e76f51');c.fillStyle=g;c.fillRect(0,0,w,h);},{roughness:.48}),
  texMat((c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#90e0ef');g.addColorStop(.5,'#48bfe3');g.addColorStop(1,'#3a86ff');c.fillStyle=g;c.fillRect(0,0,w,h);},{roughness:.48}),
  texMat((c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f7ede2');g.addColorStop(.5,'#f28482');g.addColorStop(1,'#d94e4e');c.fillStyle=g;c.fillRect(0,0,w,h);},{roughness:.48})
 ];

 const wingPalettes=[
  texMat((c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#48bfe3');g.addColorStop(.6,'#72efdd');g.addColorStop(1,'#f4a261');c.fillStyle=g;c.fillRect(0,0,w,h);},{roughness:.45}),
  texMat((c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f4a261');g.addColorStop(.6,'#ffd166');g.addColorStop(1,'#4cc9f0');c.fillStyle=g;c.fillRect(0,0,w,h);},{roughness:.45}),
  texMat((c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#ff758f');g.addColorStop(.6,'#ffb3c1');g.addColorStop(1,'#ffd166');c.fillStyle=g;c.fillRect(0,0,w,h);},{roughness:.45})
 ];

 const beakMat=mat('#ff9f1c',{roughness:.35,metalness:.2});
 const cageBarMat=mat('#529e88',{roughness:.42,metalness:.55}); // Oxidized verdigris copper
 const cageRingMat=mat('#e0a646',{roughness:.32,metalness:.72}); // Antique golden brass

 let caged=false,enclosure=0;
 const birds=[];

 for(let i=0;i<15;i++){
  const b=new T.Group();
  root.add(b);
  const bMat=bodyPalettes[i%3];
  const wMat=wingPalettes[i%3];

  // Sculpted bird torso, head, beak, and fanned tail
  const body=part(b,new T.SphereGeometry(.115,14,10),bMat);
  body.scale.set(1.05,.95,2.15);
  part(b,new T.SphereGeometry(.082,12,10),bMat,[0,.055,.19]);
  part(b,new T.ConeGeometry(.048,.16,8),beakMat,[0,.05,.31],[Math.PI/2,0,0]);
  shape(b,[[-.04,0],[.04,0],[.14,-.24],[-.14,-.24]],.022,wMat).rotation.x=Math.PI*.48;

  const wings=[];
  for(const s of [-1,1]){
   const pivot=new T.Group();
   b.add(pivot);
   shape(pivot,[[0,0],[s*.48,.20],[s*.72,.09],[s*.46,-.07],[s*.15,-.10]],.024,wMat);
   wings.push({s,pivot});
  }
  birds.push({b,wings});
 }

 // Architectural domed cage with 10 spaced bars so birds inside remain clearly visible
 const cage=new T.Group();
 root.add(cage);
 const nBars=10;
 for(let i=0;i<nBars;i++){
  const a=i/nBars*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
  tube(cage,[[x*1.62,-1.42,z*1.62],[x*1.62,.62,z*1.62],[x*.78,1.62,z*.78],[0,1.92,0]],.026,cageBarMat);
 }
 for(const y of [-1.42,-.4,.62]){
  part(cage,new T.TorusGeometry(1.62,.042,10,96),cageRingMat,[0,y,0],[Math.PI/2,0,0]);
 }
 part(cage,new T.TorusGeometry(.18,.032,10,36),cageRingMat,[0,2.06,0]);

 return {
  root,
  kind:'birds',
  get state(){return {caged,enclosure};},
  toggle(){caged=!caged;},
  update(t,dt){
   enclosure=approach(enclosure,caged?1:0,dt,3);
   cage.scale.setScalar(.001+enclosure*.999);
   birds.forEach(({b,wings},i)=>{
    const a=t*(.28+i*.005)+i*2.4;
    const r=(1.55+Math.sin(i*1.7)*.38)*(1-enclosure*.36);
    b.position.set(
     Math.cos(a)*r,
     Math.sin(a*1.4+i)*(.95-enclosure*.22),
     Math.sin(a)*(.88-enclosure*.18)
    );
    b.rotation.y=-a;
    wings.forEach(({s,pivot})=>{
     pivot.rotation.z=s*Math.sin(t*7.2+i)*.58;
    });
   });
  }
 };
}
