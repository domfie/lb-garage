/** Reproducible preparation of licensed vehicle assets. See docs/ASSET-LICENSES.md. */
import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, weld, simplify, meshopt, getBounds, mergeDocuments, unpartition, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
const cache = '.asset-work';
const output = 'public/assets/models';
await mkdir(output, { recursive: true });
await mkdir(cache, { recursive: true });
// Fetch immutable, openly licensed upstream files only when not already cached.
const carRepo = 'https://raw.githubusercontent.com/nutricionistaalmeidavh-spec/assetscarros3d/3eb0f1afac277d81bca7b7f643de81915ea76965';
const rsRepo = 'https://raw.githubusercontent.com/DeniSpasovski/mini-games/47369ee8cc2b61a57f5b15cb70f627a8d1b94208';
async function obtain(file, url) {
  try { await stat(`${cache}/${file}`); return; } catch {}
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset download failed: ${response.status} ${url}`);
  await writeFile(`${cache}/${file}`, new Uint8Array(await response.arrayBuffer()));
}
for (const [file, url] of [
  ['a1.glb', `${carRepo}/assets/audi-a1.glb`],
  ['a3.glb', `${carRepo}/assets/audi-a3.glb`],
  ['rs6-body.glb', `${rsRepo}/public/models/cars/audi_rs6.glb`],
  ['rs6-wheel.glb', `${rsRepo}/public/models/cars/audi_rs6_wheel.glb`],
  ['audi_rs6_lamps.png', `${rsRepo}/public/models/cars/audi_rs6_lamps.png`],
]) await obtain(file, url);
try { await stat(`${cache}/openx/audi_q7_2015.glb`); await stat(`${cache}/openx/mercedes_sprinter_2006.glb`); }
catch {
  await obtain('openx-assets-glb.zip', 'https://github.com/vevalabs/openx-assets/releases/download/20261015/openx-assets-glb.zip');
  await mkdir(`${cache}/openx`, { recursive: true });
  execFileSync('unzip', ['-jo', `${cache}/openx-assets-glb.zip`, 'vehicles/audi_q7_2015/*', 'vehicles/mercedes_sprinter_2006/*', '-d', `${cache}/openx`]);
}
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const inventory = [];
const triangles = (d) => d.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((a, p) => a + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0), 0);
function wrap(d, name) {
  const scene = d.getRoot().listScenes()[0];
  const wrapper = d.createNode(name);
  for (const node of scene.listChildren()) wrapper.addChild(node);
  scene.addChild(wrapper);
  return wrapper;
}
async function normalize(d, id, length, rotation = 0) {
  // Root wrapper preserves material and semantic child names for customization.
  const node = wrap(d, `${id}_normalization`);
  node.setRotation([0, Math.sin(rotation / 2), 0, Math.cos(rotation / 2)]);
  let b = getBounds(node);
  const scale = length / (b.max[2] - b.min[2]);
  node.setScale([scale, scale, scale]);
  b = getBounds(node);
  node.setTranslation([-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2]);
  return node;
}
async function save(d, id, source) {
  await d.transform(unpartition(), dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  d.getRoot().setExtras({ ...d.getRoot().getExtras(), lbGarage: { source, orientation: '+Y up, +Z forward, right side -X', modified: 'Normalized to metres, centered on ground; deduplicated and Meshopt compressed. See docs/ASSET-LICENSES.md.' } });
  await io.write(`${output}/${id}.glb`, d);
  const verify = await io.read(`${output}/${id}.glb`);
  const b = getBounds(verify.getRoot().listScenes()[0]);
  inventory.push({ id, bytes: (await stat(`${output}/${id}.glb`)).size, triangles: triangles(verify), bounds: b, dimensions: b.max.map((v, i) => v - b.min[i]), materials: verify.getRoot().listMaterials().map((m) => m.getName()) });
}
for (const [id, file, length, rotation, ratio] of [
  ['a1', 'a1.glb', 3.95, 0, .5],
  ['a3', 'a3.glb', 4.21, 0, 1],
  ['q7', 'openx/audi_q7_2015.glb', 5.0384, -Math.PI / 2, 1],
  ['sprinter', 'openx/mercedes_sprinter_2006.glb', 6.07946, -Math.PI / 2, 1],
]) {
  const d = await io.read(`${cache}/${file}`);
  // Decode previous compression before changing geometry.
  for (const e of d.getRoot().listExtensionsUsed()) if (e.extensionName === 'EXT_meshopt_compression') e.dispose();
  // SketchUp A1 exports contain tens of thousands of construction/outline lines.
  // Remove non-surface primitives; lit PBR surfaces provide the visible detail.
  if (id === 'a1') for (const mesh of d.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) if (p.getMode() !== 4) { mesh.removePrimitive(p); p.dispose(); }
  await d.transform(flatten(), dedup(), join());
  if (ratio < 1) await d.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: .006, lockBorder: false }));
  await normalize(d, id, length, rotation);
  await save(d, id, file);
}
// Assemble the original CC BY body, original rims and tyres into one self-contained RS6.
const rs6 = await io.read(`${cache}/rs6-body.glb`);
const rsScene = rs6.getRoot().listScenes()[0];
const texture = rs6.createTexture('RS6 original lamp sheet').setImage(await readFile(`${cache}/audi_rs6_lamps.png`)).setMimeType('image/png');
for (const material of rs6.getRoot().listMaterials()) {
  const name = material.getName();
  if (name.startsWith('src:')) material.setBaseColorTexture(texture).setRoughnessFactor(.3);
  // Upstream conversion intentionally leaves all materials white; restore sensible PBR defaults.
  else if (name === 'body') material.setBaseColorFactor([.23, .27, .30, 1]).setMetallicFactor(.65).setRoughnessFactor(.26);
  else if (name === 'glass') material.setBaseColorFactor([.025, .045, .065, .8]).setAlphaMode('BLEND').setRoughnessFactor(.12).setMetallicFactor(.3);
  else if (name === 'satin') material.setBaseColorFactor([.55, .58, .62, 1]).setMetallicFactor(.8).setRoughnessFactor(.24);
  else if (name === 'brakestrip') material.setBaseColorFactor([.65, .015, .01, 1]).setEmissiveFactor([.3, .001, 0]);
  else if (name === 'reverselamp') material.setBaseColorFactor([.8, .85, .9, 1]);
  else material.setBaseColorFactor([.025, .03, .035, 1]).setRoughnessFactor(name.includes('interior') ? .9 : .45).setDoubleSided(name.includes(':2s'));
}
const wheels = await io.read(`${cache}/rs6-wheel.glb`);
// Reduce wheel geometry before instancing it four times.
await wheels.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: .55, error: .0015 }));
const rimMaterial = wheels.createMaterial('RS6_Rim').setBaseColorFactor([.6, .63, .68, 1]).setMetallicFactor(.9).setRoughnessFactor(.25);
const tyreMaterial = wheels.createMaterial('RS6_Tire').setBaseColorFactor([.012, .014, .017, 1]).setRoughnessFactor(.95);
for (const n of wheels.getRoot().listNodes()) if (n.getMesh()) for (const p of n.getMesh().listPrimitives()) p.setMaterial(n.getName() === 'rim' ? rimMaterial : tyreMaterial);
const map = mergeDocuments(rs6, wheels);
const wheelScene = map.get(wheels.getRoot().listScenes()[0]);
const wheelParts = wheelScene.listChildren();
for (const [side, sign] of [['left', 1], ['right', -1]]) {
  for (const [axle, z, x] of [['front', 1.26, .823], ['rear', -1.668, .813]]) {
    const wheel = rs6.createNode(`wheel_${axle}_${side}`)
      .setTranslation([x * sign, .3665, z])
      .setScale([.285, .3665 / .765895, .3665 / .765895]);
    if (sign < 0) wheel.setRotation([0, 1, 0, 0]);
    for (const part of wheelParts) wheel.addChild(rs6.createNode(`${part.getName()}_${axle}_${side}`).setMesh(part.getMesh()));
    rsScene.addChild(wheel);
  }
}
wheelScene.dispose();
for (const n of wheelParts) n.dispose();
await normalize(rs6, 'rs6', 4.99);
await save(rs6, 'rs6', 'Mona x Supercars / DeniSpasovski mini-games');
await mkdir('public/assets/textures', { recursive: true });
await copyFile(`${cache}/audi_rs6_lamps.png`, 'public/assets/textures/rs6-lamps.png');
await mkdir('docs', { recursive: true });
await writeFile('docs/model-inventory.json', JSON.stringify(inventory, null, 2) + '\n');
console.log(JSON.stringify(inventory.map(({ id, bytes, triangles, dimensions }) => ({ id, bytes, triangles, dimensions })), null, 2));
