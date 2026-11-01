import {T,mat,texMat,box,part,tube} from './shared.js';

const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};

export function createTv(){
 const root=new T.Group();

 const bodyMat=texMat((c,w,h)=>{
 const g=c.createLinearGradient(0,0,w,h);
 g.addColorStop(0,'#e4dccf');g.addColorStop(.55,'#b4ac9e');g.addColorStop(1,'#7e7769');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 },{roughness:.5,metalness:.15});
 const trimMat=mat('#ffffff',{roughness:.25,metalness:.5});
 const darkMat=mat('#544f45',{roughness:.65,metalness:.2});
 const knobMat=mat('#ffffff',{roughness:.2,metalness:.5});

 // Pantalla codificada para estatica (nieve ASCII)
 const screenMat=mat('#384468',{roughness:.2,metalness:.0});
 screenMat.userData={fixedColor:'#384468'};

 // Gabinete y tubo catodico trasero
 box(root,[3.2,2.4,1.6],bodyMat,[0,0,0]);
 box(root,[2.3,1.7,1.0],bodyMat,[-.1,0,-1.25]);
 box(root,[1.3,1.0,.75],bodyMat,[-.1,0,-2.0]);
 for(const sx of [-1.25,1.25])for(const sz of [-.55,.55]){
 part(root,new T.CylinderGeometry(.13,.17,.26,10),darkMat,[sx,-1.32,sz]);
 }

 // Marco biselado de la pantalla
 const SX=-.42,SY=.06,SW=2.12,SH=1.72;
 box(root,[SW+.28,.16,.16],trimMat,[SX,SY+SH/2+.08,.82]);
 box(root,[SW+.28,.16,.16],trimMat,[SX,SY-SH/2-.08,.82]);
 box(root,[.16,SH+.32,.16],trimMat,[SX-SW/2-.08,SY,.82]);
 box(root,[.16,SH+.32,.16],trimMat,[SX+SW/2+.08,SY,.82]);

 // Pantalla CRT abombada al frente (+Z)
 const sg=new T.PlaneGeometry(SW,SH,20,16);
 const sp=sg.attributes.position;
 for(let i=0;i<sp.count;i++){
 const nx=sp.getX(i)/(SW/2),ny=sp.getY(i)/(SH/2);
 sp.setZ(i,.24*(1-(nx*nx+ny*ny)*.46));
 }
 sg.computeVertexNormals();
 part(root,sg,screenMat,[SX,SY,.78]);

 // Panel lateral de controles
 const PX=1.14;
 box(root,[.78,1.92,.08],darkMat,[PX,.05,.8]);
 for(let i=0;i<7;i++)box(root,[.54,.04,.06],trimMat,[PX,.72-i*.11,.85]);
 const knobs=[];
 for(const y of [-.26,-.72]){
 const k=new T.Group();
 k.position.set(PX,y,.88);
 root.add(k);
 part(k,new T.CylinderGeometry(.21,.23,.16,14),knobMat,[0,0,0],[Math.PI/2,0,0]);
 box(k,[.055,.22,.06],darkMat,[0,.08,.09]);
 knobs.push(k);
 }

 // Antena
 part(root,new T.SphereGeometry(.34,12,8),darkMat,[0,1.22,0]).scale.set(1,.45,1);
 const ants=[];
 for(const s of [-1,1]){
 const g=new T.Group();
 g.position.set(0,1.28,0);
 root.add(g);
 tube(g,[[0,0,0],[s*.52,.88,0],[s*1.04,1.58,0]],.032,trimMat,10,6);
 part(g,new T.SphereGeometry(.075,8,6),trimMat,[s*1.04,1.6,0]);
 ants.push({g,s});
 }

 // Pesa inicial orientada de frente a la camara
 root.rotation.set(.05, Math.PI, 0);

 return {
 root,
 kind:'tv',
 animated:true,
 tvStatic(p){return sm(.04,.4,p);},
 update(p){
 // Comienza perfectamente de frente con la pantalla apagada
 root.rotation.y = Math.PI + Math.sin(p * Math.PI) * 0.22;
 root.rotation.x = 0.05 + Math.sin(p * Math.PI) * 0.06;
 knobs.forEach((k,i)=>{k.rotation.z=(i?-1:1)*p*5.5;});
 ants.forEach(({g,s})=>{g.rotation.z=-s*(.06+p*.3)+Math.sin(p*20+s)*.03;});
 }
 };
}