/* ======================= beats: one press per beat ======================= */
/* night: 0 = cars-country daylight, 1 = full dark. the show runs day, into
   dusk on the wrong turn, night for the neon and the town, sunrise for the race */
const beats=[
  {name:'walkin',z:0,mile:0,night:.08},
  /* one press, one drive: dusk falls on the highway, the neon ignites as you
     pass each sign, and you roll to a stop under the lit welcome board */
  {name:'arrive',z:-538,mile:1,dur:16000,night:1,nightDur:9000},
  /* the cockpit rolls one parking slot (4.2) per press, so every newly
     introduced car parks at the same close, readable distance */
  {name:'town',z:-554.5,mile:2,town:1,intro:1,night:1},{name:'town',z:-558.7,mile:2,town:1,intro:2,night:1},{name:'town',z:-562.9,mile:2,town:1,intro:3,night:1},{name:'town',z:-567.1,mile:2,town:1,intro:4,night:1},
  {name:'tractors',z:-567.1,mile:2,town:1,night:1,cap:'Tractors. It happens every August.'},
  {name:'town',z:-571.3,mile:2,town:1,intro:5,night:1},{name:'town',z:-575.5,mile:2,town:1,intro:6,night:1},{name:'town',z:-579.7,mile:2,town:1,intro:7,night:1},{name:'town',z:-583.9,mile:2,town:1,intro:8,night:1},
  {name:'grid500',z:-748,mile:3,night:.45,cap:'Eight cars. Two laps. One cake.'},
  {name:'race',z:-730,mile:3,night:.12},
  {name:'photo',z:-730,mile:4,dark:true,night:.12},
  {name:'trophy',z:-730,mile:4,dark:true,night:.12},
  {name:'credits',z:-730,mile:5,dark:true,night:.5}];

let b=-1,carZ=0,vel=0,camYaw=0,wiperRight=false,walkTimer=null,walkIdx=0,walkTos=[],townTimers=[],tractorsOn=false,arriveBoardOn=false;
const stageEl=document.getElementById('stage'),hud=document.getElementById('hud'),mirror=document.getElementById('mirror'),
  needle=document.getElementById('needle'),cap=document.getElementById('cap'),
  photoEl=document.getElementById('photo'),trophyEl=document.getElementById('trophy'),creditsEl=document.getElementById('credits'),
  flashEl=document.getElementById('flash'),rollEl=document.getElementById('roll');

/* attract cinema: the landing video takes over the loop; the roster walk-in
   is the fallback when no video is configured or it fails to load */
const attractEl=document.getElementById('attract'),avid=document.getElementById('avid');
document.getElementById('atitleTxt').textContent=SHOW.attractTitle||'';
document.getElementById('asubTxt').textContent=SHOW.attractSub||'';
document.getElementById('finTitle').textContent=(SHOW.race||'')+' · FINISH';
document.querySelector('#photo .scrawl').textContent=SHOW.scrawl||'';
let attractOK=false;
/* play with sound; if the browser blocks unmuted autoplay, run muted and
   unmute at the first gesture (pressing F for fullscreen does it) */
function playAttract(){avid.muted=false;
  const p=avid.play();
  if(p)p.catch(()=>{avid.muted=true;avid.play().catch(()=>{});
    const unmute=()=>{if(beats[b]&&beats[b].name==='walkin')avid.muted=false;
      document.removeEventListener('pointerdown',unmute);document.removeEventListener('keydown',unmute)};
    document.addEventListener('pointerdown',unmute);document.addEventListener('keydown',unmute)})}
if(SHOW.video){PRELOAD.ready.then(()=>{avid.src=PRELOAD.videoURL||encodeURI('assets/'+SHOW.video)});
  avid.addEventListener('canplay',()=>{if(!attractOK){attractOK=true;
    if(beats[b]&&beats[b].name==='walkin'){stopWalk();attractEl.classList.add('on');playAttract()}}});
  avid.addEventListener('error',()=>{attractOK=false});
  /* if the browser suspends the video (focus loss, power saving), pick it back up */
  avid.addEventListener('pause',()=>{if(attractOK&&beats[b]&&beats[b].name==='walkin')avid.play().catch(()=>{})})}

const slot=i=>({x:i%2?3.3:-3.3,z:-565-i*4.2});
/* parked cars turn to face the cockpit, so their windshield eyes meet the
   audience during the introductions (a car at yaw 0 faces away, down -z) */
const faceCam=(s,camZ)=>Math.atan2(s.x,s.z-camZ);
function showPerson(i){const p=people[i];lname.textContent=p[1];lteam.textContent=p[2];lnum.textContent=p[0];
  /* the card sits on whichever side the car parked: odd slots are +x, the right lane */
  hud.classList.toggle('right',i%2===1);hud.classList.add('on')}

/* attract loop: the roster cycles while people walk in */
function showWalk(n){walkIdx=n;hud.classList.remove('on');mirror.classList.add('flash');
  walkTos.push(setTimeout(()=>mirror.classList.remove('flash'),3200));
  walkTos.push(setTimeout(()=>{cars.forEach((c,i)=>{if(i<n&&carO(c)<1)tween(v=>setCarO(c,v),0,1,900,ease.out);if(i>=n)setCarO(c,0)});
    showPerson(n-1)},3400))}
function startWalk(){showWalk(1);walkTimer=setInterval(()=>showWalk(walkIdx%8+1),8000)}
function stopWalk(){clearInterval(walkTimer);walkTimer=null;walkTos.forEach(clearTimeout);walkTos=[];hud.classList.remove('on');mirror.classList.remove('flash')}

function lightSign(s){if(s.lit)return;s.lit=true;tween(v=>s.on.material.opacity=v,0,1,1500,null,ignite);tween(v=>s.light.intensity=v*2.6,0,1,1500,null,ignite)}
function darkenSign(s){if(!s.lit)return;s.lit=false;s.on.material.opacity=0;s.light.intensity=0}
let boardAlpha=0;
function setBoard(a){if(Math.abs(a-boardAlpha)<.03&&a!==0&&a!==1)return;boardAlpha=a;boardTexture(a)}

/* car and tractor placement per beat; correct after jumps in either direction */
function layout(nx,dir){
  kill('park');
  if(nx.name==='walkin'){cars.forEach((c,i)=>{c.position.set(i%2?1.9:-1.9,0,-6-i*3.6);c.rotation.y=0;setCarO(c,0)})}
  else if(nx.town){
    const shown=nx.intro||4;
    const parked=dir>0&&nx.intro?shown-1:shown;
    cars.forEach((c,i)=>{const s=slot(i);
      if(i<parked){c.position.set(s.x,0,s.z);c.rotation.y=faceCam(s,nx.z);setCarO(c,1)}
      else if(i>=shown){setCarO(c,0);c.rotation.y=0}});
    if(nx.intro){
      if(dir>0){const i=shown-1,c=cars[i],s=slot(i),lane=i%2?2:-2,yaw=faceCam(s,nx.z);
        mirror.classList.add('flash');townTimers.push(setTimeout(()=>mirror.classList.remove('flash'),1600));
        townTimers.push(setTimeout(()=>{setCarO(c,1);c.rotation.y=0;
          /* drive in facing forward, then swing around on the final approach */
          tween(v=>{c.position.z=carZ+9+(s.z-(carZ+9))*v;c.position.x=lane+(s.x-lane)*Math.min(1,v*1.5);c.position.y=0;
            c.rotation.y=yaw*Math.max(0,(v-.68)/.32)},0,1,2600,ease.inout,null,'park')},600));
        townTimers.push(setTimeout(()=>showPerson(i),2900))}
      else showPerson(shown-1)}
    else hud.classList.remove('on')}
  else if(nx.name==='grid500'){hud.classList.remove('on');cars.forEach((c,i)=>{setCarO(c,1);carAt(c,i,gridProg(i))})}
  else if(nx.name==='race'){hud.classList.remove('on')} /* netStartRace/netTick own the cars */
  else hud.classList.remove('on');
  /* tractors cross the road mid-introductions */
  if(nx.name==='tractors'){tractorsOn=true;
    tween(v=>tractors[0].position.x=v,-34,-2.4,3400,ease.inout,null,'t0');
    townTimers.push(setTimeout(()=>tween(v=>tractors[1].position.x=v,tractors[1].position.x,2.8,3600,ease.inout,null,'t1'),500))}
  else if(tractorsOn){tractorsOn=false;
    tween(v=>tractors[0].position.x=v,tractors[0].position.x,34,2600,ease.inout,null,'t0');
    tween(v=>tractors[1].position.x=v,tractors[1].position.x,34,3000,ease.inout,null,'t1')}
}

function go(i,dir){
  if(i<0||i>=beats.length)return;const prev=beats[b],nx=beats[i];b=i;
  townTimers.forEach(clearTimeout);townTimers=[];
  if(prev&&prev.name==='walkin'&&nx.name!=='walkin')stopWalk();
  if(nx.name==='walkin'){
    if(attractOK){attractEl.classList.add('on');playAttract()}
    else if(!walkTimer)startWalk()}
  else{attractEl.classList.remove('on');if(!avid.paused)avid.pause()}
  photoEl.classList.toggle('on',nx.name==='photo');
  trophyEl.classList.toggle('on',nx.name==='trophy');
  creditsEl.classList.toggle('on',nx.name==='credits');
  if(nx.name==='photo'&&dir>0){flashEl.classList.remove('pop');void flashEl.offsetWidth;flashEl.classList.add('pop')}
  if(nx.name==='credits')startRoll();else kill('roll');
  stageEl.classList.toggle('dark',!!nx.dark);
  cap.textContent=nx.cap||'';cap.classList.toggle('on',!!nx.cap);
  /* the race is always live: phones drive claimed cars, AI drives the rest */
  if(nx.name==='grid500'){netInit();showLobby(true)}else showLobby(false);
  const onTrack=nx.name==='grid500'||nx.name==='race';
  cars.forEach(c=>{if(c.userData.tag)c.userData.tag.visible=onTrack});
  document.getElementById('tower').classList.toggle('on',nx.name==='race');
  if(NET.live&&nx.name!=='race')netEndRace();
  if(nx.name==='race')netStartRace();
  /* drive to the waypoint (the live race steers the camera itself) */
  const from=carZ,dist=Math.abs(nx.z-from);
  if(NET.live&&nx.name==='race')kill('z');
  else if(dist>0)tween(v=>carZ=v,from,nx.z,nx.dur||Math.max(1800,Math.min(4200,dist*14)),ease.inout,null,'z');else kill('z');
  tween(v=>camYaw=v,camYaw,nx.yaw||0,1800,ease.inout,null,'yaw');
  /* time of day rolls with the beat */
  tween(v=>setNight(v),nightT,nx.night,nx.nightDur||3200,ease.inout,null,'night');
  /* headlights: off in the dark beats, dipped while parked in town */
  const off=['walkin','photo','trophy','credits'].includes(nx.name);
  tween(v=>head.intensity=v,head.intensity,off?0:nx.town?1:2.4,1400,ease.out,null,'head');
  /* town glow on the horizon: swells during the arrival drive, fades as you pull in */
  if(nx.name==='arrive'&&dir>=0){tween(v=>townGlow.material.opacity=v,townGlow.material.opacity,1,8000,ease.inout,null,'glow');
    townTimers.push(setTimeout(()=>tween(v=>townGlow.material.opacity=v,1,0,5000,ease.inout,null,'glow'),9500))}
  else tween(v=>townGlow.material.opacity=v,townGlow.material.opacity,nx.glow||0,1400,ease.inout,null,'glow');
  /* neon signs and the welcome board: during the arrival the frame loop ignites
     each sign as you pass it; they stay lit through the town acts */
  if(nx.name==='arrive'){kill('board');kill('bl');
    if(dir>=0){arriveBoardOn=false;signs.forEach(darkenSign);setBoard(0);boardLight.intensity=0}
    else{arriveBoardOn=true;signs.forEach(lightSign);setBoard(1);boardLight.intensity=2}}
  else if(nx.town){signs.forEach(lightSign);kill('board');kill('bl');setBoard(1);boardLight.intensity=1.1}
  else{signs.forEach(darkenSign);kill('board');kill('bl');setBoard(0);boardLight.intensity=0}
  layout(nx,dir);
  odo(nx.mile);
  if(dir!==0){wiperRight=!wiperRight;document.getElementById('wiper').classList.toggle('right',wiperRight)}
}
/* clickers double-fire; a stray second press mid-race would end the August 500 */
let advT=-1e9;
function advance(){const n=performance.now();if(n-advT<450)return;advT=n;
  if(b>=beats.length-1){kill('z');carZ=0;lastZ=0;go(0,0)}else go(b+1,1)}
function jumpMile(m){const i=beats.findIndex(x=>x.mile===m);if(i<0)return;kill('z');carZ=beats[i].z;lastZ=carZ;go(i,0)}
