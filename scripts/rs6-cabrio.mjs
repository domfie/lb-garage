import { BoxGeometry } from 'three';
// Original CC BY RS6 Avant geometry is edited into the requested custom cabrio.
// Coordinates here are the upstream body's metres, before the normalization root.
function clip(polygon, distance){
  const result=[];
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a.POSITION),db=distance(b.POSITION);
    if(da>=0)result.push(a);
    if((da>=0)!==(db>=0)){
      const t=da/(da-db),v={};
      for(const name of Object.keys(a))v[name]=a[name].map((value,k)=>value+(b[name][k]-value)*t);
      result.push(v);
    }
  }
  return result;
}
export function makeRs6Cabrio(doc){
  const scene=doc.getRoot().listScenes()[0],buffer=doc.getRoot().listBuffers()[0];
  let removed=0;
  for(const mesh of [...doc.getRoot().listMeshes()])for(const primitive of [...mesh.listPrimitives()]){
    const semantics=primitive.listSemantics(),attributes=Object.fromEntries(semantics.map(name=>[name,primitive.getAttribute(name)]));
    const indices=primitive.getIndices(),count=indices?.getCount()||attributes.POSITION.getCount(),arrays=Object.fromEntries(semantics.map(name=>[name,[]]));
    const interior=primitive.getMaterial()?.getName().startsWith('interior');
    const vertex=i=>Object.fromEntries(semantics.map(name=>[name,attributes[name].getElement(i,[])]));
    const emit=polygon=>{for(let k=1;k<polygon.length-1;k++)for(const v of [polygon[0],polygon[k],polygon[k+1]])for(const name of semantics)arrays[name].push(...v[name]);};
    for(let i=0;i<count;i+=3){
      const triangle=[0,1,2].map(k=>vertex(indices?indices.getScalar(i+k):i+k));
      if(interior){emit(clip(triangle,([,y])=>1.275-y));continue;}
      // Keep everything below the belt. Above it, preserve the windshield/A-frame only.
      const belt=1.015;
      emit(clip(triangle,([,y])=>belt-y));
      const upper=clip(triangle,([,y])=>y-belt);
      const windshield=clip(upper,([,y,z])=>z-(.81-2.65*(y-1.02)));
      emit(windshield);
      if(upper.length&&windshield.length<upper.length)removed++;
    }
    if(!arrays.POSITION.length){mesh.removePrimitive(primitive);primitive.dispose();continue;}
    primitive.setIndices(null);
    for(const name of semantics){
      if(name==='NORMAL')for(let i=0;i<arrays[name].length;i+=3){const length=Math.hypot(...arrays[name].slice(i,i+3))||1;for(let j=0;j<3;j++)arrays[name][i+j]/=length;}
      primitive.setAttribute(name,doc.createAccessor(`cabrio_${name}`).setType(attributes[name].getType()).setArray(new Float32Array(arrays[name])).setBuffer(buffer));
    }
    primitive.setExtras({...primitive.getExtras(),lbCabrioCut:true});
  }
  const body=doc.getRoot().listMaterials().find(m=>m.getName()==='body');
  const leather=doc.getRoot().listMaterials().find(m=>m.getName()==='interior:2s');
  const addBox=(name,dimensions,position,material)=>{
    const geometry=new BoxGeometry(...dimensions),primitive=doc.createPrimitive().setMaterial(material);
    for(const [semantic,key] of [['POSITION','position'],['NORMAL','normal'],['TEXCOORD_0','uv']]){
      const attribute=geometry.attributes[key];primitive.setAttribute(semantic,doc.createAccessor().setType(attribute.itemSize===3?'VEC3':'VEC2').setArray(attribute.array).setBuffer(buffer));
    }
    primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geometry.index.array)).setBuffer(buffer));
    const node=doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive)).setTranslation(position);scene.addChild(node);geometry.dispose();
  };
  addBox('LB_CABRIO_REAR_DECK',[1.50,.045,.94],[0,1.008,-2.025],body);
  addBox('LB_CABRIO_TONNEAU',[1.42,.036,.22],[0,1.035,-1.51],leather);
  for(const side of [-1,1])addBox(`LB_CABRIO_BELT_${side}`,[.045,.025,1.92],[side*.79,1.018,-.53],body);
  doc.getRoot().setExtras({...doc.getRoot().getExtras(),lbBodyStyle:'custom-cabrio',cabrioConversion:{source:'CC BY Audi RS6 Avant C8',roofRemoved:true,rearGlassRemoved:true,windshieldRetained:true,removedUpperTriangles:removed}});
}
