import {T,mat,texMat,part,shape,tube} from "./shared.js";
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const rnd=(i,k)=>{const s=Math.sin(i*127.1+k*311.7)*43758.5453;return s-Math.floor(s);};
const lerpAngle=(a,b,t)=>{const d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t;};
export function createBirds(){
  const root=new T.Group();
  const N=18;
  const bodyMat=texMat((c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#ffffff");g.addColorStop(.7,"#f5f2ea");g.addColorStop(1,"#dfd8c8");
    c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.2,metalness:.02});
  const wingMat=texMat((c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#ffffff");g.addColorStop(.65,"#f8f6f0");g.addColorStop(1,"#d8d0c0");
    c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.18,metalness:.02});
  const beakMat=mat("#ffffff",{roughness:.2,metalness:.05});
  const cageBarMat=mat("#f4f0e6",{roughness:.22,metalness:.05});
  const cageRingMat=mat("#ffffff",{roughness:.18,metalness:.08});
  const birds=[];
  for(let i=0;i<N;i++){
    const b=new T.Group();
    b.rotation.order="YXZ";
    root.add(b);
    const body=part(b,new T.SphereGeometry(.125,8,6),bodyMat);
    body.scale.set(1.08,.96,2.15);
    part(b,new T.SphereGeometry(.092,7,6),bodyMat,[0,.065,.20]);
    part(b,new T.ConeGeometry(.052,.17,5),beakMat,[0,.055,.33],[Math.PI/2,0,0]);
    shape(b,[[-.04,0],[.04,0],[.19,-.30],[-.19,-.30]],.026,wingMat).rotation.x=Math.PI*.48;
    const wings=[];
    for(const s of [-1,1]){
      const pivot=new T.Group();
      b.add(pivot);
      shape(pivot,[[0,0],[s*.66,.28],[s*.98,.14],[s*.62,-.08],[s*.22,-.14]],.028,wingMat);
      wings.push({s,pivot});
    }
    const a=i*2.39996323;
    const rr=.22+.88*Math.sqrt((i+.5)/N);
    const dirX=(i%2===0?1:-1)*(.8+rnd(i,6)*1.4);
    birds.push({b,wings,a,dirX,start:[Math.cos(a)*rr,-1.05+rnd(i,1)*1.65,Math.sin(a)*rr]});
  }
  const cage=new T.Group();
  root.add(cage);
  const bars=[];
  const nBars=12;
  for(let i=0;i<nBars;i++){
    const a=i/nBars*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
    const g=new T.Group();
    g.position.set(x*1.58,-1.45,z*1.58);
    cage.add(g);
    tube(g,[[0,0,0],[0,1.95,0],[-x*.45,2.72,-z*.45],[-x*1.12,3.22,-z*1.12],[-x*1.58,3.40,-z*1.58]],.046,cageBarMat,16,6);
    bars.push({g,tan:new T.Vector3(-z,0,x)});
  }
  const rings=new T.Group();
  cage.add(rings);
  for(const y of [-1.45,-.62,.24,1.08]){
    part(rings,new T.TorusGeometry(1.58,.058,8,36),cageRingMat,[0,y,0],[Math.PI/2,0,0]);
  }
  part(rings,new T.CylinderGeometry(1.62,1.62,.08,28),cageBarMat,[0,-1.49,0]);
  const crown=part(cage,new T.TorusGeometry(.24,.052,8,18),cageRingMat,[0,1.95,0],[Math.PI/2,0,0]);
  const hook=part(cage,new T.TorusGeometry(.18,.042,8,16),cageRingMat,[0,2.22,0]);
  let curP=0, curT=0;
  function applyState(){
    const p=curP;
    const open=sm(.04,.58,p);
    cage.rotation.y=Math.sin(p*Math.PI*.6)*.18+Math.sin(curT*1.2)*.03;
    bars.forEach(({g,tan},idx)=>{
      const stagger=sm(idx*0.015,0.52+idx*0.015,p);
      g.quaternion.setFromAxisAngle(tan,-stagger*1.18);
    });
    rings.visible=open<.78;
    rings.scale.set(1+open*.45,1-open*.15,1+open*.45);
    crown.visible=open<.62;
    hook.visible=open<.62;
    birds.forEach(({b,wings,a,dirX,start},i)=>{
      const ti=.05+.36*rnd(i,2);
      const s=sm(ti,.98,p);
      const phi=a+(rnd(i,5)-.5)*.9;
      const hd=5.8+rnd(i,3)*4.8;
      const end=[dirX*(3.2+rnd(i,7)*4.2)+Math.cos(phi)*hd*.5, -0.6+rnd(i,4)*4.6, Math.sin(phi)*hd*.85];
      const e=Math.pow(s,1.15);
      const waveY=Math.sin(s*Math.PI*2.2+i)*.38*sm(0,.2,s);
      const waveX=Math.cos(s*Math.PI*1.6+i)*.28*sm(0,.2,s);
      const px=start[0]+(end[0]-start[0])*e+waveX;
      const py=start[1]+(end[1]-start[1])*e+Math.sin(s*Math.PI)*.65+waveY;
      const pz=start[2]+(end[2]-start[2])*e;
      b.position.set(px,py,pz);
      const dx=end[0]-start[0],dy=end[1]-start[1],dz=end[2]-start[2];
      const yawFly=Math.atan2(dx,dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
      const turn=sm(0,.14,s);
      b.rotation.set(-pitch*turn*.75,lerpAngle(-a,yawFly,turn),Math.sin(curT*3+i)*.12*turn);
      b.scale.setScalar(1.05-.12*s);
      const amp=.18+.68*sm(0,.08,s);
      const beat=Math.sin(curT*14+p*38+i*1.3)*amp;
      wings.forEach(({s:sg,pivot})=>{pivot.rotation.z=sg*(.16+beat);});
    });
  }
  return {
    root,
    kind:"birds",
    animated:true,
    fitStates:[0, 0.12],
    frame(now){ curT=(now||0)*0.001; applyState(); },
    update(p){ curP=p; applyState(); }
  };
}
