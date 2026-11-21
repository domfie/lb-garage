import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
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
  if(id==='rs6'){for(const name of ['wheel_front_right','wheel_rear_right'])assert(root.listNodes().some(n=>n.getName()===name));}
  console.log(`PASS ${id}: ${bytes} bytes, ${triangles} triangles, ${root.listTextures().length} embedded textures`);
}
const audio=await readFile('public/assets/audio/lb-i-do.mp3');assert(audio.length>1000000);
console.log(`PASS MP3: ${audio.length} bytes; SHA256 ${createHash('sha256').update(audio).digest('hex')}`);
console.log(`PASS all models: ${(total/1024/1024).toFixed(2)} MiB`);
