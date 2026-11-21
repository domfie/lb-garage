import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { suspensionAt } from './suspension.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const BASE=import.meta.env.BASE_URL;
const standard=(color,metalness=0,roughness=.7)=>new T.MeshStandardMaterial({color,metalness,roughness});
const emissive=(color,intensity=2)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity});
const basic=color=>new T.MeshBasicMaterial({color});
const v3=(x,y,z)=>new T.Vector3(x,y,z);
function box(parent,x,y,z,w,h,d,material){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function canvasTexture(width,height,paint){const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),width,height);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function textTexture(text,fg='#d5ff46',bg=null){return canvasTexture(1024,256,(ctx,w,h)=>{if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}ctx.fillStyle=fg;ctx.font='700 96px Poppins';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h*.52);});}

export class Garage {
  constructor(container,onStatus){
    this.container=container;this.onStatus=onStatus;this.cache=new Map();this.sequence=0;this.current=null;this.car=null;this.active=true;this.mode='orbit';this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mobile=innerWidth<701;
    this.renderer=new T.WebGLRenderer({antialias:!this.mobile,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.5:1.8));
    this.shaderErrors=[];
    this.renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{const error=gl.getProgramInfoLog(program)||gl.getShaderInfoLog(vertex)||gl.getShaderInfoLog(fragment)||'Unknown shader error';this.shaderErrors.push(error);console.error('Garage shader',error);};
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.25;
    container.append(this.renderer.domElement);
    this.scene=new T.Scene();this.scene.background=new T.Color('#0d1929');this.scene.fog=new T.Fog('#0d1929',17,45);
    this.camera=new T.PerspectiveCamera(35,1,.1,100);
    this.angle=-.65;this.elevation=.20;this.distance=9.8;
    this.target={angle:-.65,elevation:.20,distance:9.8,lookY:.75};this.lookY=.75;
    this.loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const pmrem=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();
    this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;room.dispose();pmrem.dispose();
    this.scene.environmentIntensity=.65;
    this.buildRoom();this.events();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.lastFrame=0;this.clock=0;
    this.renderer.setAnimationLoop(t=>this.frame(t));
    document.addEventListener('visibilitychange',()=>{this.active=!document.hidden;});
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.active=false;onStatus('Die 3D-Verbindung wurde unterbrochen. Bitte Garage neu laden.',true);});
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  }
  buildRoom(){
    const s=this.scene;
    s.add(new T.HemisphereLight(0xc4d8ed,0x162c47,1.1));
    const key=new T.DirectionalLight(0xf3f7ff,3.2);key.position.set(-4,7,5);s.add(key);
    const rim=new T.DirectionalLight(0xaad2dd,2);rim.position.set(4,4,-5);s.add(rim);
    const limeLight=new T.PointLight(0x348cc0,38,14,2);limeLight.position.set(-4,2,-2);s.add(limeLight);
    const blueLight=new T.PointLight(0xff6148,26,14,2);blueLight.position.set(5,2,-3);s.add(blueLight);
    // A lower resolution planar reflection retains the wet-floor look on phones.
    this.reflector=new Reflector(new T.PlaneGeometry(55,55),{color:0x1d2d40,textureWidth:this.mobile?256:768,textureHeight:this.mobile?256:768,multisample:0,clipBias:.003});
    this.reflector.rotation.x=-Math.PI/2;this.reflector.position.y=-.022;s.add(this.reflector);
    const concrete=canvasTexture(256,256,(ctx,w,h)=>{let seed=17;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const image=ctx.createImageData(w,h);for(let i=0;i<image.data.length;i+=4){const c=24+rand()*15;image.data[i]=c*.78;image.data[i+1]=c*.92;image.data[i+2]=c;image.data[i+3]=255;}ctx.putImageData(image,0,0);});concrete.wrapS=concrete.wrapT=T.RepeatWrapping;concrete.repeat.set(35,35);
    const floorMat=new T.MeshStandardMaterial({map:concrete,roughness:.82,metalness:.08,transparent:true,opacity:.91,depthWrite:false});
    const floor=new T.Mesh(new T.PlaneGeometry(55,55),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.012;s.add(floor);
    // Soft contact shadow is cheap and stable while the camera moves.
    const shadowTexture=canvasTexture(128,128,(ctx,w,h)=>{const grad=ctx.createRadialGradient(w/2,h/2,12,w/2,h/2,w/2);grad.addColorStop(0,'rgba(0,0,0,.88)');grad.addColorStop(.5,'rgba(0,0,0,.62)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);});
    this.shadow=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.85}));this.shadow.rotation.x=-Math.PI/2;this.shadow.position.y=.002;s.add(this.shadow);
    const concreteMat=standard('#263448',.1,.9),dark=standard('#111f33',.2,.7),rail=standard('#3c5067',.5,.5),neon=emissive('#6db5e4',3),cool=emissive('#d5e5f8',2);
    box(s,0,3.6,-9,32,7.3,.35,dark);
    for(const x of [-11,-5.5,5.5,11]){
      box(s,x,3.3,-6.5,.45,6.6,.55,concreteMat);box(s,x,1.05,-6.18,.48,.12,.035,neon);
      box(s,x,3.3,6,.45,6.6,.55,concreteMat);
    }
    for(const z of [-7,-3,1,5]){
      box(s,0,5.7,z,25,.15,.16,rail);
      for(const x of [-7,0,7])box(s,x,5.58,z,3.9,.045,.09,cool);
    }
    // Roller shutters, cable conduits and a neon frame give the room depth.
    for(const x of [-8,0,8]){
      box(s,x,2.7,-8.75,6.6,5.1,.1,standard('#1b2e45',.5,.6));
      for(let i=0;i<24;i++)box(s,x,.35+i*.21,-8.64,6.5,.018,.025,rail);
      box(s,x-3.38,2.7,-8.6,.08,5.3,.08,rail);box(s,x+3.38,2.7,-8.6,.08,5.3,.08,rail);
    }
    box(s,-3.8,2.6,-8.42,.055,4.6,.09,neon);box(s,3.8,2.6,-8.42,.055,4.6,.09,neon);box(s,0,4.9,-8.42,7.65,.055,.09,neon);
    // The official diamond sign replaces the long, cropped wall lettering.
    box(s,5,3.45,-6.10,1.72,2.50,.07,standard('#f4f4f4',0,.65));
    const wallMark=new T.Group();wallMark.name='LB_OFFICIAL_WALL_LOGO';
    const logoPolygons=[[[0,12.1],[10.3,0],[20.6,12.1],[10.3,24.2]],[[0,36.3],[10.3,24.2],[20.6,36.3],[10.3,48.4]],[[0,60.5],[10.3,48.4],[20.6,60.5],[10.3,72.6]],[[20.6,36.3],[30.9,24.2],[41.1,36.3],[30.9,48.4]],[[20.6,60.5],[30.9,48.4],[41.1,60.5],[30.9,72.6]]];
    for(const polygon of logoPolygons){const shape=new T.Shape();polygon.forEach(([x,y],i)=>{const px=(x/41.1-.5)*1.15,py=(.5-y/72.6)*2.03;if(i===0)shape.moveTo(px,py);else shape.lineTo(px,py);});shape.closePath();wallMark.add(new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:'#135379',side:T.DoubleSide})));}
    wallMark.position.set(5,3.45,-6.04);s.add(wallMark);
    for(const mount of [4.5,5.5])box(s,mount,5.15,-6.1,.035,.9,.035,rail);
    const platform=new T.Mesh(new T.CylinderGeometry(3.72,3.76,.06,80),new T.MeshStandardMaterial({color:'#162c47',metalness:.65,roughness:.4,transparent:true,opacity:.3}));platform.position.y=-.035;s.add(platform);
    this.platformRing=new T.Mesh(new T.TorusGeometry(3.74,.012,5,100),emissive('#135379',1.3));this.platformRing.rotation.x=-Math.PI/2;this.platformRing.position.y=.002;s.add(this.platformRing);
    const stripeMat=basic('#4d7898');
    for(const x of [-3.1,3.1])box(s,x,.005,-.2,.035,.009,7.4,stripeMat);
    for(const z of [-3.9,3.5]){box(s,-2.6,.005,z,1,.009,.035,stripeMat);box(s,2.6,.005,z,1,.009,.035,stripeMat);}
    // Floor service markings and pooled neon light are original procedural textures.
    const pool=canvasTexture(128,128,(ctx,w,h)=>{const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(75,156,210,.13)');g.addColorStop(1,'rgba(75,156,210,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);});
    const glow=new T.Mesh(new T.PlaneGeometry(11,9),new T.MeshBasicMaterial({map:pool,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.set(-2,.01,-2);s.add(glow);
  }
  resize(){
    const {width,height}=this.container.getBoundingClientRect();if(!width||!height)return;
    this.mobile=width<701;this.width=width;this.height=height;
    this.renderer.setSize(width,height,false);
    this.camera.aspect=width/height;this.camera.fov=this.mobile?40:33;
    // Move the scene into the clear area beside/below the vehicle information.
    this.camera.setViewOffset(width,height,-width*(this.mobile?0:.12),-height*(this.mobile?.10:-.05),width,height);
    this.camera.updateProjectionMatrix();
    if(this.car)this.preset(this.mode,true);
  }
  events(){
    const canvas=this.renderer.domElement,pointers=new Map();let lastPinch=0;
    canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);this.interacting=true;this.lastInteraction=performance.now();});
    canvas.addEventListener('pointermove',e=>{
      const previous=pointers.get(e.pointerId);if(!previous)return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const [a,b]=[...pointers.values()];const pinch=Math.hypot(a.x-b.x,a.y-b.y);if(lastPinch)this.target.distance=T.MathUtils.clamp(this.target.distance*lastPinch/pinch,3.1,20);lastPinch=pinch;}
      else{this.target.angle-=(e.clientX-previous.x)*.007;this.target.elevation=T.MathUtils.clamp(this.target.elevation+(e.clientY-previous.y)*.003,.07,.65);}
      this.lastInteraction=performance.now();
    });
    const end=e=>{pointers.delete(e.pointerId);lastPinch=0;this.interacting=pointers.size>0;this.lastInteraction=performance.now();};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.target.distance=T.MathUtils.clamp(this.target.distance+e.deltaY*.008,3.1,20);this.lastInteraction=performance.now();},{passive:false});
  }
  async load(c){
    const sequence=++this.sequence;this.car=c;this.onStatus(`${c.short} wird geladen …`);
    if(this.current)this.current.visible=false;
    try{
      if(!this.cache.has(c.id)){
        const gltf=await this.loader.loadAsync(`${BASE}assets/models/${c.asset}`);
        const model=gltf.scene;
        const cloned=new Map();model.traverse(n=>{if(n.isMesh){n.frustumCulled=true;const remap=m=>{if(!cloned.has(m))cloned.set(m,m.clone());return cloned.get(m)};n.material=Array.isArray(n.material)?n.material.map(remap):remap(n.material);}});
        this.styleMaterials(model,c);
        if(c.id==='safety'||c.id==='event')this.sprinterKit(model,c);
        if(c.id==='rs6')this.curbDamage(model);
        this.companyPlates(model,c);
        this.installSuspension(model,c);
        model.name=c.id;this.cache.set(c.id,model);model.visible=false;this.scene.add(model);
      }
      if(sequence!==this.sequence)return;
      this.current=this.cache.get(c.id);this.current.visible=true;
      this.current.userData.dropStart=performance.now();
      this.current.position.y=this.reduced?0:.38;
      this.shadow.scale.set(c.width*1.4,c.length*1.12,1);
      this.preset('orbit');this.onStatus('',false,{id:c.id,meshes:this.current.children.length});
      // Thumbnail uses the actual loaded vehicle with the same lighting.
      this.container.dataset.vehicle=c.id;
      this.container.dataset.loaded='true';
    }catch(error){
      if(sequence!==this.sequence)return;
      this.container.dataset.loaded='false';
      this.onStatus(`${c.short} konnte nicht geladen werden. Fahrzeug erneut auswählen.`,true);console.error('Vehicle load failed',c.id,error);
    }
  }
  companyPlates(model,c){
    model.traverse(node=>{if(!node.isMesh)return;for(const material of Array.isArray(node.material)?node.material:[node.material])if(/^License_Plate_/.test(material.name))material.visible=false;});
    const texture=canvasTexture(1024,224,(ctx,w,h)=>{
      ctx.fillStyle='#f5f6f1';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='#15202a';ctx.lineWidth=10;ctx.strokeRect(6,6,w-12,h-12);
      ctx.fillStyle='#174b9b';ctx.fillRect(13,13,94,h-26);
      ctx.fillStyle='#f7d650';for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.arc(60+27*Math.cos(a),63+27*Math.sin(a),3,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff';ctx.font='700 63px Arial';ctx.textAlign='center';ctx.fillText('D',60,179);
      ctx.fillStyle='#12171b';ctx.textAlign='left';ctx.textBaseline='middle';
      let size=138;ctx.font=`700 ${size}px Arial`;
      while(ctx.measureText('M- LB XXXX').width>w-150){size--;ctx.font=`700 ${size}px Arial`;}
      ctx.fillText('M- LB XXXX',130,h*.54);
    });
    const group=new T.Group();group.name='LB_COMPANY_PLATES';model.add(group);
    const isVan=c.kind==='safety'||c.kind==='event';
    const frontY=c.id==='q7'?.59:isVan?.44:c.id==='rs6'?.45:.53;
    const rearY=isVan?.66:c.id==='q7'?.76:.65;
    for(const [side,y,z,rotation] of [['front',frontY,c.length/2+.013,0],['rear',rearY,-c.length/2-.013,Math.PI]]){
      const plate=new T.Mesh(new T.PlaneGeometry(.52,.114),new T.MeshStandardMaterial({map:texture,roughness:.56,metalness:.08}));
      plate.name=`plate_${side}_M_LB_XXXX`;plate.position.set(0,y,z);plate.rotation.y=rotation;group.add(plate);
    }
  }
  installSuspension(model,c){
    const uniforms={lbCompression:{value:0},lbDrop:{value:0}};
    const isVan=c.kind==='safety'||c.kind==='event';
    let front=c.length*.31,rear=-c.length*.30,radius=isVan?.374:c.id==='q7'?.394:.325;
    if(isVan){front=2.0419;rear=-1.6232;}
    if(c.id==='q7'){front=1.5542;rear=-1.4384;}
    if(c.id==='rs6'){const f=new T.Box3().setFromObject(model.getObjectByName('wheel_front_right')).getCenter(new T.Vector3()),r=new T.Box3().setFromObject(model.getObjectByName('wheel_rear_right')).getCenter(new T.Vector3());front=f.z;rear=r.z;radius=f.y;}
    const visited=new Set();
    model.traverse(n=>{if(!n.isMesh)return;for(const material of Array.isArray(n.material)?n.material:[n.material]){
      if(visited.has(material))continue;visited.add(material);
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='uniform float lbCompression; uniform float lbDrop;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
          vec3 lbRest=(modelMatrix*vec4(transformed,1.0)).xyz;
          lbRest.y-=lbDrop;
          float lbFront=length(lbRest.yz-vec2(${radius.toFixed(5)},${front.toFixed(5)}));
          float lbRear=length(lbRest.yz-vec2(${radius.toFixed(5)},${rear.toFixed(5)}));
          float lbWheel=1.0-smoothstep(${(radius+.006).toFixed(5)},${(radius+.045).toFixed(5)},min(lbFront,lbRear));
          lbWheel*=smoothstep(${(c.width*.28).toFixed(5)},${(c.width*.34).toFixed(5)},abs(lbRest.x));
          mvPosition+=viewMatrix*vec4(0.0,lbCompression*(1.0-lbWheel),0.0,0.0);
          gl_Position=projectionMatrix*mvPosition;`);
      };
      material.customProgramCacheKey=()=>`lb-suspension-${c.id}`;material.needsUpdate=true;
    }});
    model.userData.suspension=uniforms;
  }
  styleMaterials(model,c){
    const paints=c.id==='a1'?['bodyh']:c.id==='a3'?['paint']:c.id==='rs6'?['body']:['Body'];
    model.traverse(n=>{if(!n.isMesh)return;for(const m of Array.isArray(n.material)?n.material:[n.material]){
      if(paints.includes(m.name)){m.color.set(c.color);m.metalness=.58;m.roughness=.25;if(m.clearcoat!==undefined){m.clearcoat=.8;m.clearcoatRoughness=.15;}}
      if(c.id==='a1'&&m.name==='body1'){m.color.set('#292e2b');m.metalness=.65;m.roughness=.24;}
      if(/tire|tyre/i.test(m.name)){m.color.set('#141714');m.metalness=0;m.roughness=.88;}
      if(c.id==='q7'||c.kind==='safety'||c.kind==='event'){
        if(m.name==='Body_Glass'){m.color.set('#142420');m.opacity=.8;m.transparent=true;m.depthWrite=false;m.roughness=.12;m.metalness=.3;}
        if(m.name==='Lamp_White'){m.emissive.set('#f4ffe1');m.emissiveIntensity=1.4;}
        if(m.name==='Lamp_Red'){m.emissive.set('#e12116');m.emissiveIntensity=.6;}
      }
      if(c.id==='rs6'){
        const palette={trim:'#111715','trim:2s':'#111715',glass:'#192521',carbon:'#151a17',satin:'#8f9992',mesh:'#1b211c',lenscover:'#6d7e75',brakecover:'#8c918b','interior:2s':'#171c19',reverselamp:'#bdcbb5',brakestrip:'#9f1510',rim:'#a0a7a2',tyre:'#151815'};
        if(palette[m.name])m.color.set(palette[m.name]);
        if(m.name==='glass'){m.transparent=true;m.opacity=.72;m.depthWrite=false;m.metalness=.25;m.roughness=.12;}
        if(/trim|carbon|interior|mesh|tyre/.test(m.name)){m.metalness=.15;m.roughness=.65;}
        if(/satin|rim|RS6_Rim|brakecover/.test(m.name)){m.metalness=.85;m.roughness=.28;}
        if(m.name.startsWith('src:')){m.color.set('#ffffff');m.roughness=.3;/* Lamp atlas is embedded at asset build time. */}
        if(m.name==='RS6_Rim'){m.color.set('#69716f');m.metalness=.88;m.roughness=.29;}
        if(m.name==='lenscover'){m.transparent=true;m.opacity=.20;m.depthWrite=false;m.roughness=.08;}
        if(m.name==='brakestrip'){m.emissive.set('#d7130b');m.emissiveIntensity=.6;}
      }
      m.needsUpdate=true;
    }});
  }
  sprinterKit(model,c){
    const kit=new T.Group();kit.name=`LB_${c.id}_conversion`;model.add(kit);
    const safety=c.id==='safety',black=standard('#0d1f37',.3,.45),metal=standard('#60768b',.8,.4),yellow=emissive('#ffb518',.65);
    const graphics=canvasTexture(1024,384,(ctx,w,h)=>{
      ctx.fillStyle='#135379';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#f4f4f4';
      for(const [dx,dy] of [[0,0],[0,1],[0,2],[1,1],[1,2]]){ctx.beginPath();const x=55+dx*60,y=35+dy*60;ctx.moveTo(x+30,y);ctx.lineTo(x+60,y+30);ctx.lineTo(x+30,y+60);ctx.lineTo(x,y+30);ctx.closePath();ctx.fill();}
      ctx.font='700 50px Poppins';ctx.fillText('LB GRUPPE',240,100);ctx.font='600 24px Poppins';ctx.fillText(safety?'VERKEHRSSICHERUNG':'VERANSTALTUNGSTECHNIK',240,151);
      ctx.fillStyle=safety?'#db3021':'#ff6148';ctx.fillRect(40,220,944,18);ctx.font='22px Arial';ctx.fillStyle='#f4f4f4';ctx.fillText(safety?'SICHERHEIT HAT VORFAHRT.':'WE MAKE THE SHOW HAPPEN.',55,293);
      if(safety){ctx.save();ctx.beginPath();ctx.rect(0,330,w,54);ctx.clip();ctx.fillStyle='#d62f22';for(let x=-100;x<w+100;x+=135){ctx.beginPath();ctx.moveTo(x,384);ctx.lineTo(x+60,330);ctx.lineTo(x+110,330);ctx.lineTo(x+50,384);ctx.fill();}ctx.restore();}
    });
    for(const side of [-1,1]){
      const sign=new T.Mesh(new T.PlaneGeometry(2.82,1.06),new T.MeshStandardMaterial({map:graphics,roughness:.6,metalness:.08,polygonOffset:true,polygonOffsetFactor:-1}));
      sign.position.set(side*1.003,1.65,-.92);sign.rotation.y=side*Math.PI/2;kit.add(sign);
      if(safety){const stripes=canvasTexture(512,128,(ctx,w,h)=>{ctx.fillStyle='#e5e1cf';ctx.fillRect(0,0,w,h);ctx.fillStyle='#d42f23';for(let x=-128;x<w+128;x+=128){ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x+128,0);ctx.lineTo(x+192,0);ctx.lineTo(x+64,h);ctx.fill();}});const stripe=new T.Mesh(new T.PlaneGeometry(3.2,.17),new T.MeshStandardMaterial({map:stripes,roughness:.5}));stripe.position.set(side*1.016,.89,-.9);stripe.rotation.y=side*Math.PI/2;kit.add(stripe);}
    }
    if(safety){
      box(kit,0,2.66,.72,1.34,.07,.27,black);box(kit,0,2.76,.72,1.1,.13,.23,yellow);box(kit,0,2.79,.72,.32,.14,.25,black);
      for(const x of [-.48,.48])box(kit,x,2.60,.72,.07,.16,.16,metal);
      // Rear red-white chevrons and a service equipment rack.
      const chevron=canvasTexture(512,256,(ctx,w,h)=>{ctx.fillStyle='#eee6c8';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#cf2d20';ctx.lineWidth=40;for(let y=-200;y<500;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w/2,y+150);ctx.lineTo(w,y);ctx.stroke();}});
      const panel=new T.Mesh(new T.PlaneGeometry(1.7,.52),new T.MeshStandardMaterial({map:chevron,roughness:.5}));panel.position.set(0,.93,-3.045);panel.rotation.y=Math.PI;kit.add(panel);
      for(const x of [-.65,.65])box(kit,x,2.69,-1.05,.04,.06,2.3,metal);
    }else{
      for(const x of [-.68,.68])box(kit,x,2.68,-.65,.045,.07,3.0,black);
      for(const z of [-1.95,-.65,.65])box(kit,0,2.68,z,1.42,.055,.045,metal);
      // Slim touring cargo box distinguishes the event build in silhouette.
      box(kit,0,2.83,-.68,.98,.24,1.8,black);box(kit,0,2.96,-.68,1.0,.025,1.82,metal);
    }
  }
  curbDamage(model){
    // Front +Z, up +Y => vehicle right -X. Atlas-free geometry on both outer rim lips.
    const damage=new T.Group();damage.name='BOTH_RIGHT_RIMS_CURB_DAMAGE';model.add(damage);
    const light=standard('#dbe0d1',.65,.82),dark=standard('#303a31',.2,.94),geometries=[[],[]];
    const line=(a,b,r,which)=>{const va=v3(...a),vb=v3(...b),g=new T.CylinderGeometry(r,r,va.distanceTo(vb),4,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v3(0,1,0),vb.clone().sub(va).normalize()));g.translate(...va.add(vb).multiplyScalar(.5).toArray());geometries[which].push(g);};
    model.updateMatrixWorld(true);
    for(const name of ['wheel_front_right','wheel_rear_right']){
      const wheel=model.getObjectByName(name);
      const rim=wheel.getObjectByName(name.replace('wheel_','rim_'));
      const bounds=new T.Box3().setFromObject(rim||wheel),center=bounds.getCenter(new T.Vector3());
      const x=bounds.min.x-.002,z=center.z,hubY=center.y,r=(bounds.max.y-bounds.min.y)*.485;
      for(let i=0;i<44;i++){
        const a=-.9+i*.048,rr=r+(i%5)*.0015;
        line([x,hubY+Math.cos(a)*rr,z+Math.sin(a)*rr],[x-.002,hubY+Math.cos(a+.035)*(rr-.012-(i%4)*.002),z+Math.sin(a+.035)*(rr-.012)],.0045,i%4===0?1:0);
      }
      for(let i=0;i<13;i++){const a=-.7+i*.14;line([x-.005,hubY+Math.cos(a)*(r*1.015),z+Math.sin(a)*(r*1.015)],[x-.008,hubY+Math.cos(a+.04)*(r*.88),z+Math.sin(a+.04)*(r*.88)],.0035,0);}
    }
    geometries.forEach((gs,i)=>{const merged=mergeGeometries(gs);gs.forEach(g=>g.dispose());damage.add(new T.Mesh(merged,i?dark:light));});
  }
  preset(mode,resize=false){
    this.mode=mode;const c=this.car;if(!c)return;
    // Fit the longest dimension to the available horizontal field of view.
    const fov=T.MathUtils.degToRad(this.camera.fov),aspect=this.width/this.height;
    const horizontalFov=2*Math.atan(Math.tan(fov/2)*aspect);
    const needed=c.length/(2*Math.tan(horizontalFov/2))/(this.mobile?.88:.62);
    const verticalFit=c.height/(2*Math.tan(fov/2))*(this.mobile?1.35:1.35);
    const distance=Math.max(this.mobile?5.2:4.9,needed,verticalFit,c.length*1.05);
    const settings={orbit:{angle:-.65,elevation:.19,distance,lookY:c.height*.45},front:{angle:0,elevation:.14,distance:distance*.83,lookY:c.height*.44},side:{angle:-Math.PI/2,elevation:.12,distance,lookY:c.height*.46},detail:{angle:-1.08,elevation:.16,distance:c.id==='rs6'?(this.mobile?distance*.85:Math.max(4.6,distance*.8)):distance*.78,lookY:c.id==='rs6'?.43:c.height*.5}};
    const next=settings[mode]||settings.orbit;
    // Choose nearest equivalent angle for uninterrupted camera travel.
    next.angle=this.angle+T.MathUtils.euclideanModulo(next.angle-this.angle+Math.PI,Math.PI*2)-Math.PI;
    Object.assign(this.target,next);this.lastInteraction=performance.now();
    if(this.reduced||resize){this.angle=next.angle;this.distance=next.distance;this.elevation=next.elevation;this.lookY=next.lookY;}
  }
  frame(t){
    if(!this.active)return;
    // Cap mobile rendering at 30fps; avoid unnecessary GPU work in background tabs.
    if(this.mobile&&t-this.lastFrame<31)return;
    const dt=Math.min((t-this.lastFrame)/1000,.05)||.016;this.lastFrame=t;
    const factor=this.reduced?1:1-Math.exp(-dt*6);
    if(!this.reduced&&this.mode==='orbit'&&!this.interacting&&t-(this.lastInteraction||0)>6000)this.target.angle+=dt*.045;
    for(const [key,value] of Object.entries(this.target))this[key]=T.MathUtils.lerp(this[key],value,factor);
    this.camera.position.set(Math.sin(this.angle)*this.distance,Math.sin(this.elevation)*this.distance+this.lookY,Math.cos(this.angle)*this.distance);
    this.camera.lookAt(0,this.lookY,0);
    if(this.current){
      const bounce=suspensionAt((t-this.current.userData.dropStart)/1000,this.reduced);
      this.current.position.y=bounce.drop;
      const uniforms=this.current.userData.suspension;
      uniforms.lbCompression.value=bounce.compression;uniforms.lbDrop.value=bounce.drop;
      if(this.platformRing)this.platformRing.material.emissiveIntensity=1.3+bounce.impact*1.6;
    }
    this.renderer.render(this.scene,this.camera);
  }
  diagnostics(){return{shaderErrors:this.shaderErrors,vehicle:this.car?.id,loaded:this.container.dataset.loaded==='true',cached:[...this.cache.keys()],calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,textures:this.renderer.info.memory.textures,camera:this.camera.position.toArray(),modelBounds:this.current?new T.Box3().setFromObject(this.current).getSize(new T.Vector3()).toArray():null};}
}
