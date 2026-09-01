/* ======================= loop ======================= */
let last=performance.now(),lastZ=0,lastProg=0;
const _camP={};
function frame(now){const dtRaw=Math.min(1,(now-last)/1000),dt=Math.min(.05,dtRaw);last=now;
  runTweens(now);netTick(dtRaw,now); /* the race integrates true elapsed time, so lag can't slow it */
  const racing=NET.live&&NET.phase!=='idle';
  let v;
  if(racing){v=dt>0?Math.max(0,NET.camProg-lastProg)/dt:0;lastProg=NET.camProg}
  else{v=dt>0?Math.abs(carZ-lastZ)/dt:0;lastZ=carZ;lastProg=NET.camProg}
  vel+=(v-vel)*Math.min(1,dt*6);
  const t=now/1000,sp=Math.min(1,vel/40);
  let camZ=carZ;
  if(racing){ /* the cockpit drives the oval, chasing the pack */
    trackPos(NET.camProg,_camP);camZ=_camP.z;
    camera.position.set(_camP.x+Math.sin(t*1.7)*.02*sp,1.25+Math.sin(t*9.3)*.014*sp,_camP.z);
    camera.rotation.set(-.055+Math.sin(t*7.1)*.002*sp,Math.atan2(-_camP.hx,-_camP.hz),Math.sin(t*2.3)*.004*sp);
    head.position.set(_camP.x,.75,_camP.z);head.target.position.set(_camP.x+_camP.hx*38,-.2,_camP.z+_camP.hz*38)}
  else{
    camera.position.set(Math.sin(t*1.7)*.02*sp,1.25+Math.sin(t*9.3)*.014*sp,carZ);
    camera.rotation.set(-.055+Math.sin(t*7.1)*.002*sp,camYaw,Math.sin(t*2.3)*.004*sp);
    head.position.set(camera.position.x,.75,carZ+.4);head.target.position.set(0,-.2,carZ-38)}
  const fv=58+sp*8;if(Math.abs(fv-camera.fov)>.05){camera.fov=fv;camera.updateProjectionMatrix()}
  sky.position.z=camZ;mesaFar.position.z=camZ-540;mesaNear.position.z=camZ-450;
  /* the arrival drive: neon ignites as the car passes each sign, then the board */
  if(beats[b]&&beats[b].name==='arrive'){signs.forEach(s=>{if(!s.lit&&carZ<s.z+26)lightSign(s)});
    if(!arriveBoardOn&&carZ<-522){arriveBoardOn=true;
      tween(v=>setBoard(v),0,1,1600,ease.inout,null,'board');tween(v=>boardLight.intensity=v*2,0,1,1600,ease.inout,null,'bl')}}
  const target=-120+Math.min(1,vel/72)*240;needleDeg+=(target-needleDeg)*Math.min(1,dt*4);needle.style.transform=`rotate(${needleDeg}deg)`;
  renderer.render(scene,camera);requestAnimationFrame(frame)}
