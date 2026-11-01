import {T,shape,part,mat} from './shared.js';

const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};

export function createSilhouette(){
 const root=new T.Group();

 const outerStencilMat=mat('#ffffff',{roughness:.35,metalness:.15});
 const midReliefMat=mat('#dfd8c8',{roughness:.4,metalness:.2});
 const innerShadowMat=mat('#b8b0a0',{roughness:.5,metalness:.1});

 const outline=[
 [-.18,1.14],[-.28,1.28],[-.31,1.52],[-.24,1.74],[-.08,1.86],[.08,1.86],[.24,1.74],[.31,1.52],[.28,1.28],[.18,1.14],
 [.26,1.03],[.58,.92],[.74,.68],[.83,.18],[.88,-.42],[.82,-.68],[.66,-.72],[.58,-.38],[.51,.18],[.44,.52],
 [.38,-.12],[.44,-.64],[.58,-1.48],[.68,-1.72],[.36,-1.76],[.22,-1.32],[.08,-.58],
 [-.08,-.58],[-.22,-1.32],[-.36,-1.76],[-.68,-1.72],[-.58,-1.48],[-.44,-.64],[-.38,-.12],
 [-.44,.52],[-.51,.18],[-.58,-.38],[-.66,-.72],[-.82,-.68],[-.88,-.42],[-.83,.18],[-.74,.68],[-.58,.92],[-.26,1.03]
 ];
 const stencil=shape(root,outline,.14,outerStencilMat);

 const innerOutline=outline.map(([x,y])=>[x*.82,y*.94]);
 const innerMesh=shape(root,innerOutline,.20,midReliefMat);

 const headRelief=part(root,new T.SphereGeometry(.22,20,16),innerShadowMat,[0,1.48,0]);
 headRelief.scale.set(.85,1.18,.55);
 const chestRelief=part(root,new T.CylinderGeometry(.28,.22,.88,20),innerShadowMat,[0,.38,0]);
 chestRelief.scale.set(1.1,1,.45);

 root.rotation.y=.08;

 return {
 root,
 kind:'silhouette',
 isSilhouette:true,
 update(p){
 const gone=sm(0.25, 0.95, p);
 root.position.y=gone * 0.45;
 root.rotation.y=.08 + gone * 0.25;
 headRelief.visible=gone < 0.7;
 chestRelief.visible=gone < 0.7;
 innerMesh.visible=gone < 0.85;
 stencil.visible=true;
 }
 };
}