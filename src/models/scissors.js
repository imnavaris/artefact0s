import {T,mat,texMat,shape,part,box} from './shared.js';

export function createScissors(){
  const root=new T.Group();

  // Multi-tone cold silver-blue steel blades with bright specular edge
  const bladeMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#f0f7ff');
   g.addColorStop(.3,'#9ec0db');
   g.addColorStop(.65,'#5e82a3');
   g.addColorStop(1,'#c7dff2');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.32,metalness:.78});

  const bladeBevelMat=mat('#d8ecfa',{roughness:.25,metalness:.85});

  // Deep lacquered crimson-burgundy & copper-bronze handles
  const handleMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,w,h);
   g.addColorStop(0,'#f06449');
   g.addColorStop(.45,'#c42f34');
   g.addColorStop(1,'#6e141b');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.42,metalness:.35});

  // Golden-brass pivot bolt
  const brassMat=mat('#f5c445',{roughness:.28,metalness:.82});

  // Warm amber celluloid film strip + vibrant multi-colored cinema frames
  const filmBaseMat=texMat((c,w,h)=>{
   const g=c.createLinearGradient(0,0,0,h);
   g.addColorStop(0,'#7a3e12');
   g.addColorStop(.2,'#d98a36');
   g.addColorStop(.8,'#c47425');
   g.addColorStop(1,'#6b330d');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  },{roughness:.5,metalness:.15});

  const frameMats=[
   mat('#e64833',{roughness:.4,emissive:'#591208',emissiveIntensity:.35}), // Crimson frame
   mat('#38b2ac',{roughness:.4,emissive:'#0d4240',emissiveIntensity:.35}), // Cyan-teal frame
   mat('#f4a261',{roughness:.4,emissive:'#5e320d',emissiveIntensity:.35}), // Golden-amber frame
   mat('#68d391',{roughness:.4,emissive:'#144726',emissiveIntensity:.35}), // Emerald frame
   mat('#d56aa0',{roughness:.4,emissive:'#4f1433',emissiveIntensity:.35})  // Magenta-rose frame
  ];
  const holeMat=mat('#1f1a17',{roughness:.9});

  const arms=[];

  for(const s of [-1,1]){
   const a=new T.Group();
   // Offset the two blades slightly in Z so they have true 3D scissor thickness from side/back views
   a.position.z=s*.048;
   root.add(a);
   // Main blade body + sharpened bevel ridge
   shape(a,[[-.11,-.12],[.09,-.12],[.22,1.44],[.04,1.88],[-.08,1.40]],.09,bladeMat);
   shape(a,[[-.03,-.05],[.07,-.05],[.17,1.40],[.04,1.82],[.01,1.38]],.115,bladeBevelMat);
   // Ergonomic handle shaft & finger ring with thicker 3D volume
   const ring=part(a,new T.TorusGeometry(.31,.088,16,56),handleMat,[s*.21,-.72,0]);
   ring.scale.set(1.05,1.38,1.35);
   box(a,[.15,.52,.12],handleMat,[s*.11,-.35,0],[0,0,s*.14]);
   arms.push({s,a});
  }

  // Central brass pivot screw + washer
  part(root,new T.CylinderGeometry(.145,.145,.22,28),brassMat,[0,0,0],[Math.PI/2,0,0]);
  part(root,new T.CylinderGeometry(.085,.085,.26,20),bladeBevelMat,[0,0,0],[Math.PI/2,0,0]);

  // 35mm Celluloid Film Strip with 3D wave depth and colorful frames
  const halves=[];
  for(const s of [-1,1]){
   const g=new T.Group();
   root.add(g);
   for(let j=0;j<8;j++){
    const x=s*(.13+j*.21);
    const zWave=Math.sin(x*1.6)*(.16)+s*.04;
    const rotY=Math.cos(x*1.6)*.22;
    // Celluloid base segment
    box(g,[.205,.58,.055],filmBaseMat,[x,.72,zWave],[0,rotY,0]);
    // Colorful movie frame window on both front and back faces
    const fMat=frameMats[(j+(s>0?2:0))%frameMats.length];
    box(g,[.145,.34,.072],fMat,[x,.72,zWave],[0,rotY,0]);
    // Sprocket perforations
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
   // p=0: tijeras abiertas. p=1: cerradas y la pelicula cortada en dos.
   update(p){
    arms.forEach(({s,a})=>{
     a.rotation.z=s*(.42-p*.37);
    });
    halves.forEach(({s,g})=>{
     g.position.x=s*p*.32;
     g.position.y=-p*(s>0?.58:.12);
     g.rotation.z=s*p*.15;
    });
   }
  };
}
