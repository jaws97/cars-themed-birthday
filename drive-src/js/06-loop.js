/* ======================= loop ======================= */
let last=performance.now(),lastZ=0,lastProg=0;
let lastYaw=0,wheelDeg=0,tempDeg=-38; /* cockpit life: steering lock and the temp needle warming up */
const _camP={},_camL={};
function frame(now){const dtRaw=Math.min(1,(now-last)/1000),dt=Math.min(.05,dtRaw);last=now;
  runTweens(now);netTick(dtRaw,now);ttTick(dtRaw,now); /* the race integrates true elapsed time, so lag can't slow it */
  const racing=NET.live&&NET.phase!=='idle';
  let v;
  if(racing){v=dt>0?Math.max(0,NET.camProg-lastProg)/dt:0;lastProg=NET.camProg}
  else if(TT.on){v=dt>0?Math.max(0,TT.camProg-lastProg)/dt:0;lastProg=TT.camProg}
  else{v=dt>0?Math.abs(carZ-lastZ)/dt:0;lastZ=carZ;lastProg=NET.camProg}
  vel+=(v-vel)*Math.min(1,dt*6);
  const t=now/1000,sp=Math.min(1,vel/40);
  let camZ=carZ;
  if(racing){ /* the cockpit drives the oval, chasing the pack */
    trackPos(NET.camProg,_camP);camZ=_camP.z;
    camera.position.set(_camP.x+Math.sin(t*1.7)*.02*sp,1.25+Math.sin(t*9.3)*.014*sp,_camP.z);
    camera.rotation.set(-.055+Math.sin(t*7.1)*.002*sp,Math.atan2(-_camP.hx,-_camP.hz),Math.sin(t*2.3)*.004*sp);
    head.position.set(_camP.x,.75,_camP.z);head.target.position.set(_camP.x+_camP.hx*38,-.2,_camP.z+_camP.hz*38)}
  else if(TT.on){ /* the time trial rides the midnight circuit */
    circuitPos(TT.camProg,_camP);camZ=_camP.z;
    if(TT.driver){ /* chase cam: raised behind the car, aimed through it at the
         road ahead, drifting with the car's line so it stays centred */
      const nx=-_camP.hz,nz=_camP.hx,lat=TT.lat*.55;
      camera.position.set(_camP.x+nx*lat+Math.sin(t*1.7)*.03,3.4+Math.sin(t*9.3)*.02,_camP.z+nz*lat);
      circuitPos(TT.prog+7,_camL);
      camera.lookAt(_camL.x+(-_camL.hz)*TT.lat*.4,.9,_camL.z+_camL.hx*TT.lat*.4)}
    else{ /* empty track: the low cruising flyover */
      camera.position.set(_camP.x+Math.sin(t*1.7)*.02*sp,1.25+Math.sin(t*9.3)*.014*sp,_camP.z);
      camera.rotation.set(-.055+Math.sin(t*7.1)*.002*sp,Math.atan2(-_camP.hx,-_camP.hz),Math.sin(t*2.3)*.004*sp)}
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
  /* the wheel steers with the road: heading rate becomes steering lock,
     with a whisper of road jitter so hands are never frozen still */
  let dyw=camera.rotation.y-lastYaw;lastYaw=camera.rotation.y;
  if(dyw>Math.PI)dyw-=Math.PI*2;else if(dyw<-Math.PI)dyw+=Math.PI*2;
  if(Math.abs(dyw)>.5)dyw=0; /* a beat jump is a teleport, not a corner */
  const lock=Math.max(-1,Math.min(1,(dt>0?-dyw/dt:0)*1.6));
  wheelDeg+=(lock*34+Math.sin(t*1.3)*1.4+Math.sin(t*5.1)*.7*sp-wheelDeg)*Math.min(1,dt*5);
  wheel.style.setProperty('--steer',wheelDeg.toFixed(2)+'deg');
  /* fuel burns down as the route rolls by; temp settles warm and breathes with speed */
  fneedle.style.transform=`rotate(${(40-62*Math.min(1,Math.max(0,-carZ/730))).toFixed(1)}deg)`;
  tempDeg+=((-6+sp*9+Math.sin(t*.7)*2)-tempDeg)*Math.min(1,dt*.4);
  tneedle.style.transform=`rotate(${tempDeg.toFixed(1)}deg)`;
  renderer.render(scene,camera);requestAnimationFrame(frame)}
