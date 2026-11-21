// The tyres land on y=0; the chassis continues into a damped spring compression.
export const DROP_HEIGHT=.38;
export const DROP_GRAVITY=6;
export const IMPACT_TIME=Math.sqrt(2*DROP_HEIGHT/DROP_GRAVITY);
export function suspensionAt(seconds,reducedMotion=false){
  if(reducedMotion||seconds<0)return{drop:0,compression:0,impact:0};
  if(seconds<IMPACT_TIME)return{drop:DROP_HEIGHT-.5*DROP_GRAVITY*seconds*seconds,compression:0,impact:0};
  const t=seconds-IMPACT_TIME;
  if(t>1.8)return{drop:0,compression:0,impact:0};
  return{drop:0,compression:-.085*Math.exp(-4.8*t)*Math.sin(15*t),impact:Math.exp(-9*t)};
}
