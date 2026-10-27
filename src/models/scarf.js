import {T,texMat,surface,morph,part} from './shared.js';

export function createScarf(){
  const root=new T.Group();

  const clothMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#f2efe6');
   g.addColorStop(.35,'#e2ddd0');
   g.addColorStop(.68,'#cfc8b6');
   g.addColorStop(1,'#b6ae9c');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='rgba(120,112,96,0.30)';
   c.lineWidth=3;
   for(let i=0;i<26;i++){
    c.beginPath();
    c.moveTo((i/26)*w,0);
    c.quadraticCurveTo(w*.5,h*.55,w*.5+((i-13)*14),h);
    c.stroke();
   }
  },{roughness:.72,metalness:.04},512,512);

  const shadeMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#e8e3d6');
   g.addColorStop(.5,'#c6bfae');
   g.addColorStop(1,'#8e8879');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.76,metalness:.03},256,256);

  const knotMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.36,h*.34,6,w*.5,h*.5,w*.62);
   g.addColorStop(0,'#f6f2e7');
   g.addColorStop(.6,'#d6cfbe');
   g.addColorStop(1,'#9c9584');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.7,metalness:.05},128,128);

  const knot=part(root,new T.SphereGeometry(.15,20,16),knotMat,[0,-.18,.34]);
  knot.scale.set(1.4,.8,1.2);

  const nu=40,nv=36;
  const cloth=surface(root,nu,nv,()=>[0,0,0],clothMat);

  const A=[0,.56,0],B=[-.68,-.42,.04],C=[.68,-.42,.04];

  const tri=(u,v)=>[
   A[0]*(1-v)+(B[0]*(1-u)+C[0]*u)*v,
   A[1]*(1-v)+(B[1]*(1-u)+C[1]*u)*v,
   A[2]*(1-v)+(B[2]*(1-u)+C[2]*u)*v
  ];

  const hood=(u,v)=>{
   const a=v*Math.PI*.55;
   const y=-.25+v*.77;
   const r=.48*(1-.6*v);
   const phi=-2.1+u*4.2;
   return [Math.sin(phi)*r,y,.08+Math.cos(phi)*r*.4];
  };

  const tails=[];
  for(const s of [-1,1]){
   tails.push({s,m:surface(root,18,22,()=>[0,0,0],shadeMat)});
  }

  const tail=(u,v,s)=>{
   const w=(.07+v*.08)*(1-.4*Math.pow(v,6));
   const side=(u-.5)*2;
   return [
    s*(.12+v*.38)+side*w,
    -.18-v*.44,
    .32-v*.15+side*w*.2
   ];
  };

  return {
   root,
   kind:'scarf',
   update(p){
    const open=p;
    const knotT=1-open;

    morph(cloth,nu,nv,(u,v)=>{
     const t=tri(u,v);
     const bow=.18*Math.sin(Math.PI*u);
     const ripple=.03*Math.sin(u*9+v*4);
     const open3=[t[0],t[1],t[2]+bow+ripple+.06];
     const h=hood(u,v);
     return [
      h[0]+(open3[0]-h[0])*open,
      h[1]+(open3[1]-h[1])*open,
      h[2]+(open3[2]-h[2])*open
     ];
    });

    tails.forEach(({s,m})=>{
     morph(m,18,22,(u,v)=>{
      const t=tail(u,v,s);
      const gx=s*0.1;
      const gy=-0.35;
      const gz=0.25;
      return [
       t[0]+(gx-t[0])*open,
       t[1]+(gy-t[1])*open,
       t[2]+(gz-t[2])*open
      ];
     });
    });

    const vis=knotT>.12;
    knot.visible=vis;
    knot.scale.set(1.4*knotT,.8*knotT,1.2*knotT);
   }
  };
}
