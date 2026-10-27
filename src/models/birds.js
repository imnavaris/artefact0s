import {T,mat,texMat,part,shape,tube} from './shared.js';

export function createBirds(){
  const root=new T.Group();

  const bodyMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#dfd8c8');
   g.addColorStop(.6,'#c4bcac');
   g.addColorStop(1,'#9e9688');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.5});

  const wingMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#ebe4d6');
   g.addColorStop(.6,'#d4ccb8');
   g.addColorStop(1,'#b8b0a0');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.45});

  const beakMat=mat('#c8c0b0',{roughness:.4,metalness:.2});
  const cageBarMat=mat('#9a9284',{roughness:.45,metalness:.4});
  const cageRingMat=mat('#b8b0a0',{roughness:.35,metalness:.5});

  const birds=[];

  for(let i=0;i<15;i++){
   const b=new T.Group();
   root.add(b);

   const body=part(b,new T.SphereGeometry(.115,7,5),bodyMat);
   body.scale.set(1.05,.95,2.15);
   part(b,new T.SphereGeometry(.082,6,5),bodyMat,[0,.055,.19]);
   part(b,new T.ConeGeometry(.048,.16,4),beakMat,[0,.05,.31],[Math.PI/2,0,0]);
   shape(b,[[-.04,0],[.04,0],[.17,-.28],[-.17,-.28]],.022,wingMat).rotation.x=Math.PI*.48;

   const wings=[];
   for(const s of [-1,1]){
    const pivot=new T.Group();
    b.add(pivot);
    shape(pivot,[[0,0],[s*.58,.24],[s*.86,.11],[s*.55,-.08],[s*.18,-.12]],.024,wingMat);
    wings.push({s,pivot});
   }
   birds.push({b,wings});
  }

  const cage=new T.Group();
  root.add(cage);
  const nBars=8;
  for(let i=0;i<nBars;i++){
   const a=i/nBars*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
   tube(cage,[[x*1.62,-1.42,z*1.62],[x*1.62,.62,z*1.62],[x*.78,1.62,z*.78],[0,1.92,0]],.034,cageBarMat,12,5);
  }
  for(const y of [-1.42,-.4,.62]){
   part(cage,new T.TorusGeometry(1.62,.046,6,28),cageRingMat,[0,y,0],[Math.PI/2,0,0]);
  }
  part(cage,new T.TorusGeometry(.18,.036,5,14),cageRingMat,[0,2.06,0]);

  return {
   root,
   kind:'birds',
   update(p){
    const cageGrow=Math.min(1,Math.max(0,(p-.08)/.20));
    cage.scale.setScalar(.001+.999*Math.pow(cageGrow,.6));

    birds.forEach(({b,wings},i)=>{
     const a=i*2.39996323;
     const r=(1.55+Math.sin(i*1.7)*.38)*(1-p*.36);
     const y=Math.sin(i*2.1)*.95*(1-p*.22);
     b.position.set(Math.cos(a)*r,y,Math.sin(a)*(.88-p*.18));
     b.rotation.y=-a;
     const beat=Math.sin(p*38+i)*.58*(1-p*.5);
     wings.forEach(({s,pivot})=>{
      pivot.rotation.z=s*beat;
     });
    });
   }
  };
}
