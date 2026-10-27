import {T,texMat,shape,part} from './shared.js';

export function createSilhouette(){
  const root=new T.Group();

  const outerStencilMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.5,h*.38,16,w*.5,h*.5,w*.68);
   g.addColorStop(0,'#8e8678');
   g.addColorStop(.45,'#c4bcae');
   g.addColorStop(.82,'#e6dfd1');
   g.addColorStop(1,'#ebe4d6');
   c.fillStyle=g;c.fillRect(0,0,w,h);
   for(let i=0;i<120;i++){
    const x=(Math.sin(i*23.1)*.5+.5)*w,y=(Math.cos(i*41.7)*.5+.5)*h,r=6+(i%6)*8;
    c.fillStyle=i%2===0?'rgba(235,228,214,0.3)':'rgba(142,134,120,0.25)';
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
   }
  },{roughness:.68,metalness:.06},256,512);

  const midReliefMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#d4ccb8');
   g.addColorStop(.35,'#9e9688');
   g.addColorStop(.7,'#beb6a6');
   g.addColorStop(1,'#8e8678');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.62,metalness:.1},256,512);

  const innerShadowMat=texMat((c,w,h)=>{
   const g=c.createRadialGradient(w*.5,h*.4,8,w*.5,h*.45,w*.55);
   g.addColorStop(0,'#ebe4d6');
   g.addColorStop(.4,'#a49c8e');
   g.addColorStop(1,'#8e8678');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.74,metalness:.08},256,256);

  const outline=[
   [-.18,1.14],[-.28,1.28],[-.31,1.52],[-.24,1.74],[-.08,1.86],[.08,1.86],[.24,1.74],[.31,1.52],[.28,1.28],[.18,1.14],
   [.26,1.03],[.58,.92],[.74,.68],[.83,.18],[.88,-.42],[.82,-.68],[.66,-.72],[.58,-.38],[.51,.18],[.44,.52],
   [.38,-.12],[.44,-.64],[.58,-1.48],[.68,-1.72],[.36,-1.76],[.22,-1.32],[.08,-.58],
   [-.08,-.58],[-.22,-1.32],[-.36,-1.76],[-.68,-1.72],[-.58,-1.48],[-.44,-.64],[-.38,-.12],
   [-.44,.52],[-.51,.18],[-.58,-.38],[-.66,-.72],[-.82,-.68],[-.88,-.42],[-.83,.18],[-.74,.68],[-.58,.92],[-.26,1.03]
  ];
  const stencil=shape(root,outline,.11,outerStencilMat);

  const innerOutline=outline.map(([x,y])=>[x*.82,y*.94]);
  const innerMesh=shape(root,innerOutline,.17,midReliefMat);
  innerMesh.position.z=0;

  const headRelief=part(root,new T.SphereGeometry(.22,20,16),innerShadowMat,[0,1.48,0]);
  headRelief.scale.set(.85,1.18,.55);
  const chestRelief=part(root,new T.CylinderGeometry(.28,.22,.88,20),innerShadowMat,[0,.38,0]);
  chestRelief.scale.set(1.1,1,.45);

  root.rotation.y=.08;

  return {
   root,
   kind:'silhouette',
   update(p){
    const gone=p*p*(3-2*p);
    root.scale.set(1-gone*.58,1-gone*.68,1-gone*.55);
    const reliefs=p<.68;
    headRelief.visible=reliefs;
    chestRelief.visible=reliefs;
    innerMesh.visible=p<.88;
    stencil.visible=true;
   }
  };
}
