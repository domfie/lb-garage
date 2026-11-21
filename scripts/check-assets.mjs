import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { Matrix4, Vector3, Ray } from 'three';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
let total=0;
for(const id of ['a1','a3','q7','rs6','sprinter']){
  const path=`public/assets/models/${id}.glb`,bytes=(await stat(path)).size;total+=bytes;
  const doc=await io.read(path),root=doc.getRoot(),scenes=root.listScenes();assert.equal(scenes.length,1);
  const bounds=getBounds(scenes[0]),dimensions=bounds.max.map((n,i)=>n-bounds.min[i]);
  assert(dimensions.every(n=>Number.isFinite(n)&&n>0));assert(dimensions[2]>3&&dimensions[2]<7);assert(Math.abs(bounds.min[1])<.002);
  for(const texture of root.listTextures()){assert(texture.getImage()?.byteLength>0,'Texture must be embedded');assert(!texture.getURI()?.startsWith('http'),'No remote texture');}
  const triangles=root.listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);
  assert(triangles<100000,`${id} exceeds mobile geometry budget`);assert(bytes<1500000,`${id} exceeds download budget`);
  if(id==='rs6'){
    for(const name of ['wheel_front_right','wheel_rear_right'])assert(root.listNodes().some(n=>n.getName()===name));
    assert.equal(root.getExtras().lbBodyStyle,'custom-cabrio');
    // Probe the actual exported geometry: open cockpit, retained windshield and closed rear deck.
    const probes=[{z:-.25,max:-Infinity},{z:-.8,max:-Infinity},{z:.6,max:-Infinity},{z:-1.8,max:-Infinity}];
    const a=new Vector3(),b=new Vector3(),c=new Vector3(),hit=new Vector3(),down=new Vector3(0,-1,0);
    for(const node of root.listNodes()){
      if(!node.getMesh())continue;const matrix=new Matrix4().fromArray(node.getWorldMatrix());
      for(const primitive of node.getMesh().listPrimitives()){
        const position=primitive.getAttribute('POSITION'),index=primitive.getIndices(),count=index?.getCount()||position.getCount();
        for(let i=0;i<count;i+=3){
          for(const [offset,point] of [[0,a],[1,b],[2,c]])point.fromArray(position.getElement(index?index.getScalar(i+offset):i+offset,[])).applyMatrix4(matrix);
          for(const probe of probes)if(new Ray(new Vector3(0,2,probe.z),down).intersectTriangle(a,b,c,false,hit))probe.max=Math.max(probe.max,hit.y);
        }
      }
    }
    assert(probes[0].max<1.29&&probes[1].max<1.29,'Cockpit must be open above the seats');
    assert(probes[2].max>1.15,'Windshield must remain');
    assert(probes[3].max>1&&probes[3].max<1.1,'Rear deck must cap the former estate cargo opening');
    console.log('PASS RS6 cabrio geometry: open cockpit, windshield and rear deck');
  }
  console.log(`PASS ${id}: ${bytes} bytes, ${triangles} triangles, ${root.listTextures().length} embedded textures`);
}
for(const badge of ['a1','a3','q7','rs6','sprinter'])assert((await readFile(`public/assets/badges/${badge}.svg`,'utf8')).includes('<svg'));
console.log('PASS all five local model emblems');
const audio=await readFile('public/assets/audio/lb-i-do.mp3');assert(audio.length>1000000);
console.log(`PASS MP3: ${audio.length} bytes; SHA256 ${createHash('sha256').update(audio).digest('hex')}`);
console.log(`PASS all models: ${(total/1024/1024).toFixed(2)} MiB`);
