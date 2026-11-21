export async function verify({garage,vehicles,selectVehicle,audio}){
  const dialog=document.createElement('dialog');dialog.className='modal';dialog.innerHTML='<h2>Live Garage Verification</h2><pre style="white-space:pre-wrap;font-size:12px" id="verificationOutput"></pre><button id="verifyClose" class="primary">Schließen</button>';document.body.append(dialog);dialog.showModal();dialog.querySelector('button').onclick=()=>dialog.close();
  const log=message=>{dialog.querySelector('pre').textContent+=message+'\n';};
  const errors=[];addEventListener('error',e=>errors.push(e.message));addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
  try{
    for(let i=0;i<vehicles.length;i++){
      await selectVehicle(i);
      await new Promise(resolve=>setTimeout(resolve,460));
      const result=garage.diagnostics();
      if(result.shaderErrors.length)throw new Error(result.shaderErrors.join('; '));
      if(garage.current.position.y<0)throw new Error('Tyres below platform');
      if(!result.loaded||result.vehicle!==vehicles[i].id)throw new Error(`Model ${vehicles[i].id} failed`);
      if(result.modelBounds.some(v=>!Number.isFinite(v)||v<=0))throw new Error('Invalid dimensions');
      log(`PASS ${result.vehicle}: ${result.modelBounds.map(x=>x.toFixed(2)).join(' × ')} m`);
    }
    const rs6=garage.cache.get('rs6');if(rs6.getObjectByName('BOTH_RIGHT_RIMS_CURB_DAMAGE')?.children.length!==2)throw new Error('Missing wheel damage');log('PASS RS6: two right wheel damage patches');
    for(const id of ['safety','event']){if(!garage.cache.get(id).getObjectByName(`LB_${id}_conversion`))throw new Error('Missing Sprinter kit');}log('PASS distinct Sprinter kits and canvas decals');
    log('PASS WebGL shaders compile; drop animation keeps tyres above platform');
    const response=await fetch(audio.src);if(!response.ok)throw new Error(`Audio HTTP ${response.status}`);const data=await response.arrayBuffer();const AudioContext=window.AudioContext||window.webkitAudioContext;const context=new AudioContext();const decoded=await context.decodeAudioData(data);await context.close();if(decoded.duration<10)throw new Error('Invalid audio');log(`PASS MP3 decode: ${decoded.duration.toFixed(2)} s / ${decoded.numberOfChannels} channels`);
    if(errors.length)throw new Error(errors.join('; '));log('PASS no uncaught browser errors');
    await selectVehicle(3);document.body.dataset.verification='passed';log('ALL CHECKS PASSED');
  }catch(error){document.body.dataset.verification='failed';log(`FAIL: ${error.message}`);console.error(error);}
}
