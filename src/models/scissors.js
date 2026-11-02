import {T,mat,texMat,shape,part,box} from './shared.js';

export function createScissors(){
  const root=new T.Group();

  const bladeMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#e6dfd1');
   g.addColorStop(.3,'#c4bcac');
   g.addColorStop(.65,'#9e9688');
   g.addColorStop(1,'#ebe4d6');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.35,metalness:.65});

  const bladeBevelMat=mat('#ebe4d6',{roughness:.3,metalness:.7});

  const handleMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#b8b0a0');
   g.addColorStop(.45,'#a49c8e');
   g.addColorStop(1,'#8e8678');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.5,metalness:.2});

  const brassMat=mat('#ebe4d6',{roughness:.3,metalness:.5});

  const filmBaseMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,0,h);
   g.addColorStop(0,'#9e9688');
   g.addColorStop(.2,'#c4bcac');
   g.addColorStop(.8,'#b8b0a0');
   g.addColorStop(1,'#8e8678');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.55,metalness:.1});

  const frameMats=[
   mat('#dfd8c8',{roughness:.5,metalness:.1}),
   mat('#9e9688',{roughness:.5,metalness:.1}),
   mat('#ebe4d6',{roughness:.5,metalness:.1}),
   mat('#b8b0a0',{roughness:.5,metalness:.1}),
   mat('#c4bcac',{roughness:.5,metalness:.1})
  ];
  const holeMat=mat('#8e8678',{roughness:.8});

  const arms=[];

  for(const s of [-1,1]){
   const a=new T.Group();
   a.position.z=s*.048;
   root.add(a);
   shape(a,[[-.11,-.12],[.09,-.12],[.22,1.44],[.04,1.88],[-.08,1.40]],.09,bladeMat);
   shape(a,[[-.03,-.05],[.07,-.05],[.17,1.40],[.04,1.82],[.01,1.38]],.115,bladeBevelMat);
   const ring=part(a,new T.TorusGeometry(.31,.088,8,28),handleMat,[s*.21,-.72,0]);
   ring.scale.set(1.05,1.38,1.35);
   box(a,[.15,.52,.12],handleMat,[s*.11,-.35,0],[0,0,s*.14]);
   arms.push({s,a});
  }

  part(root,new T.CylinderGeometry(.145,.145,.22,20),brassMat,[0,0,0],[Math.PI/2,0,0]);
  part(root,new T.CylinderGeometry(.085,.085,.26,16),bladeBevelMat,[0,0,0],[Math.PI/2,0,0]);

  const halves=[];
  for(const s of [-1,1]){
   const g=new T.Group();
   root.add(g);
   for(let j=0;j<8;j++){
    const x=s*(.13+j*.21);
    const zWave=Math.sin(x*1.6)*(.16)+s*.04;
    const rotY=Math.cos(x*1.6)*.22;
    box(g,[.205,.58,.055],filmBaseMat,[x,.72,zWave],[0,rotY,0]);
    const fMat=frameMats[(j+(s>0?2:0))%frameMats.length];
    box(g,[.145,.34,.072],fMat,[x,.72,zWave],[0,rotY,0]);
    for(const dy of [-.23,.23]){
     box(g,[.06,.075,.076],holeMat,[x,.72+dy,zWave],[0,rotY,0]);
    }
   }
   halves.push({s,g});
  }

  root.rotation.z=-.32;
  root.rotation.y=-.18;
  root.position.y=-.20;

  return {
   root,
   kind:'scissors',
   animated:true,
   frame(now){ this._t=(now||0)*0.001; },
   update(p){
    const t=this._t||0;
    root.position.y=-.20+Math.sin(t*1.6)*.03;
    root.rotation.y=-.18+Math.sin(p*Math.PI)*.22+Math.sin(t*1.4)*.02;
    root.rotation.z=-.32+p*.18;
    arms.forEach(({s,a})=>{
     const snip=p<0.3?Math.sin(p/0.3*Math.PI)*0.18:0;
     const cut=Math.min(1,Math.max(0,(p-0.22)/0.55));
     a.rotation.z=s*(.46-snip-cut*.42+Math.sin(t*3)*0.012);
    });
    halves.forEach(({s,g})=>{
     g.position.x=s*p*.32;
     g.position.y=-p*(s>0?.58:.12);
     g.rotation.z=s*p*.15;
    });
   }
  };
}
