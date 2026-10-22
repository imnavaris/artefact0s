import * as T from 'three';
export {T};
export const mat=(color='#dfdbc8',extra={})=>new T.MeshStandardMaterial({color,roughness:.62,metalness:.12,side:T.DoubleSide,...extra});
export function texMat(drawFn,extra={},w=256,h=256){
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;
 const ctx=cv.getContext('2d');drawFn(ctx,w,h);
 const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;
 return new T.MeshStandardMaterial({map:tex,roughness:.6,metalness:.1,side:T.DoubleSide,...extra});
}
export function part(root,geo,material,pos=[0,0,0],rot=[0,0,0]){const m=new T.Mesh(geo,material);m.position.set(...pos);m.rotation.set(...rot);root.add(m);return m;}
export const box=(r,size,m,p=[0,0,0],rot=[0,0,0])=>part(r,new T.BoxGeometry(...size),m,p,rot);
export function tube(root,points,r,m){return part(root,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,10,false),m);}
export function shape(root,points,depth,m){const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025});g.translate(0,0,-depth/2);return part(root,g,m);}
export function surface(root,nu,nv,fn,m,flip=false){
 const p=[],uvs=[],idx=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...fn(i/nu,j/nv));uvs.push(i/nu,1-j/nv);}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
  const a=j*(nu+1)+i,b=a+nu+1;
  if(flip)idx.push(a,a+1,b,b,a+1,b+1);
  else idx.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 g.setIndex(idx);
 g.computeVertexNormals();
 return part(root,g,m);
}
export function morph(mesh,nu,nv,fn){
 const p=mesh.geometry.attributes.position;let k=0;
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const xyz=fn(i/nu,j/nv);p.setXYZ(k++,...xyz);}
 p.needsUpdate=true;mesh.geometry.computeVertexNormals();
}
export const approach=(a,b,dt,rate=5)=>a+(b-a)*(1-Math.exp(-dt*rate));
