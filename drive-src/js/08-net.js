/* ======================= multiplayer: phones as throttles =======================
   The projector page is the authoritative host. Phones connect peer-to-peer via
   PeerJS (free public broker, no account) and send tap counts; the host runs the
   race. If there's no internet, no PeerJS, or nobody joins, the scripted race
   runs untouched — multiplayer is additive, never load-bearing. */
const NET={peer:null,ready:false,conns:{},all:new Set(),claimed:Array(8).fill(false),live:false,phase:'idle',
  taps:Array(8).fill(0),rate:Array(8).fill(0),prog:Array(8).fill(0),spd:Array(8).fill(0),
  lat:Array(8).fill(0),st:Array(8).fill(0),slip:Array(8).fill(0),slipDir:Array(8).fill(0),hitCd:Array(8).fill(0),
  haz:[],hazMeshes:[],trac:null,done:[],greenT0:0,camProg:0,lastLap:0,lastPlaceT:0,
  prevLat:Array(8).fill(0),wl:Array(8).fill(null),wr:Array(8).fill(null),dustT:Array(8).fill(0)};
const lobbyEl=document.getElementById('lobby'),chipsEl=document.getElementById('chips'),qrBox=document.getElementById('qr'),towerEl=document.getElementById('tower');

function netInit(){if(NET.peer||location.protocol==='file:'||typeof Peer==='undefined')return;
  const id='r08-'+Math.random().toString(36).slice(2,7);
  try{NET.peer=new Peer(id)}catch(e){return}
  NET.peer.on('open',()=>{NET.ready=true;drawLobby(id);updateLobby();if(beats[b]&&(beats[b].name==='grid500'||beats[b].name==='roam'))showLobby(true)});
  NET.peer.on('connection',c=>{NET.all.add(c);
    c.on('open',()=>{try{if(RM.on)c.send({type:'roam',on:true})}catch(e){}});
    c.on('data',d=>onMsg(c,d));
    c.on('close',()=>{NET.all.delete(c);dropConn(c)})});
  NET.peer.on('error',()=>{})}
function drawLobby(id){const url=location.origin+location.pathname.replace(/[^/]*$/,'')+'play/#'+id;
  const q=qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount();
  const cv=document.createElement('canvas');cv.width=cv.height=n*4+16;
  const x=cv.getContext('2d');x.fillStyle='#F3E7CF';x.fillRect(0,0,cv.width,cv.height);
  x.fillStyle='#0E1230';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))x.fillRect(8+c*4,8+r*4,4,4);
  qrBox.innerHTML='';qrBox.appendChild(cv);
  document.getElementById('joinurl').textContent=url.replace(/^https?:\/\//,'')}
function updateLobby(){chipsEl.innerHTML=people.map((p,i)=>`<span class="chip${NET.claimed[i]?' in':''}" style="--c:${p[3]}">${p[0]} ${p[1].split(' ')[0]}</span>`).join('')}
let lobbyHideT=null;
function showLobby(on){const vis=!!on&&NET.ready;clearTimeout(lobbyHideT);
  if(vis){lobbyEl.style.display='';requestAnimationFrame(()=>lobbyEl.classList.add('on'))}
  else{lobbyEl.classList.remove('on');lobbyHideT=setTimeout(()=>{lobbyEl.style.display='none'},750)}}
function playersCount(){return Object.keys(NET.conns).length}
function broadcast(m){Object.values(NET.conns).forEach(c=>{try{c.send(m)}catch(e){}})}
function onMsg(c,d){
  if(d.type==='join'){const i=d.i,cur=NET.conns[i];
    if(i>=0&&i<8&&(!NET.claimed[i]||!cur||!cur.open)){ /* fresh claim, or reclaiming a dead slot */
      NET.claimed[i]=true;NET.conns[i]=c;c._idx=i;
      c.send({type:'assigned',i,phase:NET.phase});broadcast({type:'roster',claimed:NET.claimed});updateLobby();
      if(RM.on&&RM.c[i]&&RM.c[i].ai)rmStage(RM.c[i],i)}
    else c.send({type:'roster',claimed:NET.claimed})}
  else if(d.type==='taps'){const i=c._idx;if(i!==undefined&&NET.phase==='green')NET.taps[i]+=d.n;
    if(RM.on&&i!==undefined)RM.taps[i]+=d.n}
  else if(d.type==='steer'){const v=Math.max(-1,Math.min(1,+d.v||0));c._st=v;
    const i=c._idx;if(i!==undefined)NET.st[i]=v}
  else if(d.type==='rev'){const i=c._idx;if(i!==undefined)RM.rev[i]=d.v?1:0}
  else if(d.type==='gas'){const i=c._idx;if(i!==undefined)RM.gas[i]=d.v?1:0}}
function dropConn(c){const i=c._idx;if(i===undefined||NET.conns[i]!==c)return;delete NET.conns[i];NET.st[i]=0;RM.rev[i]=0;RM.gas[i]=0;
  if(!NET.live){NET.claimed[i]=false;broadcast({type:'roster',claimed:NET.claimed});updateLobby()}}

/* the race is always real: humans drive claimed cars by tapping, AI drives the
   rest. TRACK.LAPS laps of the oval from the grid to the start/finish line. */
const gridProg=i=>20-Math.floor(i/2)*4.5;
const finishProg=()=>TRACK.SF+TRACK.LAPS*TRACK.L;
/* track furniture: cones and oil slicks laid out fresh every race — steer
   around them or lose real speed. fixed on the track, so lap one teaches
   the layout for lap two */
function clearHazards(){NET.hazMeshes.forEach(m=>scene.remove(m));NET.hazMeshes=[];NET.haz=[]}
const _hz_p={};
function buildHazards(){clearHazards();
  const L=TRACK.L,used=[];
  for(let k=0;k<14;k++){
    let p=null;
    for(let t=0;t<40;t++){const q=45+Math.random()*(L-80);
      if(used.every(u=>Math.abs(u-q)>14)){p=q;used.push(q);break}}
    if(p===null)break;
    NET.haz.push({p,lat:Math.random()*5.4-2.7,type:k<9?'cone':'oil'})}
  NET.haz.forEach(h=>{trackPos(h.p,_hz_p);const nx=-_hz_p.hz,nz=_hz_p.hx;
    let m;
    if(h.type==='cone')m=new THREE.Mesh(new THREE.ConeGeometry(.4,.8,10),new THREE.MeshLambertMaterial({color:0xF5B335}));
    else{m=new THREE.Mesh(new THREE.CircleGeometry(.95,16),new THREE.MeshBasicMaterial({color:0x0a0c18,transparent:true,opacity:.8}));m.rotation.x=-Math.PI/2}
    m.position.set(_hz_p.x+nx*h.lat,h.type==='cone'?.4:.05,_hz_p.z+nz*h.lat);
    scene.add(m);NET.hazMeshes.push(m)})}

function netStartRace(){NET.live=true;NET.phase='set';NET.done=[];NET.lastLap=1;
  for(let i=0;i<8;i++){NET.prog[i]=gridProg(i);NET.spd[i]=0;NET.taps[i]=0;NET.rate[i]=0;
    NET.lat[i]=i%2?1.9:-1.9;NET.st[i]=0;NET.slip[i]=0;NET.hitCd[i]=0;
    setCarO(cars[i],1);carAt(cars[i],i,NET.prog[i],NET.lat[i])}
  buildHazards();
  if(!RM.skid)rmBuildSkid();if(!RM.dust.length)rmBuildDust();rmClearSkid();
  NET.prevLat=NET.lat.slice();NET.wl.fill(null);NET.wr.fill(null);
  /* the tractor waits in the infield until the final lap */
  NET.trac={on:false,done:false,lat:-7.2,prog:TRACK.S+Math.PI*TRACK.R+TRACK.S*.55};
  trackTractor.visible=false;
  NET.camProg=-12; /* trackPos(-12) is the grid-beat camera spot, so the cut to the race is seamless */
  cap.textContent='Drivers, ready…';
  broadcast({type:'state',phase:'set'});
  townTimers.push(setTimeout(()=>{NET.phase='green';NET.greenT0=performance.now();
    broadcast({type:'state',phase:'green'});cap.textContent='GREEN. GREEN. GREEN.';sndFanfare()},2600))}
function netEndRace(){NET.live=false;NET.phase='idle';clearHazards();trackTractor.visible=false;
  cars.forEach(c=>c.rotation.z=0);RM.dust.forEach(d=>d.s.visible=false);
  broadcast({type:'state',phase:'idle'})}

/* AI steering: hunt the inside line through the turns, weave around the
   hazards on the straights — with per-car reaction range, so somebody
   still clips a cone now and then */
function aiLat(i,u){const S=TRACK.S,R=TRACK.R,L=TRACK.L;
  const nearTurn=(u>S-14&&u<S+Math.PI*R+6)||(u>2*S+Math.PI*R-14);
  let t=nearTurn?2.4:((i%3)-1)*1.2;
  const look=14+((i*5)%3)*6;
  for(const h of NET.haz){let d=h.p-u;if(d<-L/2)d+=L;if(d<0)continue;
    if(d<look&&Math.abs(t-h.lat)<1.5){t=h.lat>0?h.lat-2.2:h.lat+2.2;break}}
  if(NET.trac&&NET.trac.on){let d=NET.trac.prog-u;if(d<-L/2)d+=L;
    if(d>0&&d<look+6&&Math.abs(t-NET.trac.lat)<2.2)t=NET.trac.lat>0?NET.trac.lat-2.8:NET.trac.lat+2.8}
  return Math.max(-3.2,Math.min(3.2,t))}

const _tr_p={};
function netTick(dt,now){if(!NET.live||(NET.phase!=='green'&&NET.phase!=='finished'))return;
  const F=finishProg(),L=TRACK.L,S=TRACK.S,R=TRACK.R,lead=Math.max(...NET.prog);
  /* the tractor ambles across the back straight on the final lap, timed so
     it's mid-crossing when the leaders arrive */
  if(NET.trac&&!NET.trac.done&&!NET.trac.on&&NET.phase==='green'&&lead>=(TRACK.LAPS-1)*L+NET.trac.prog-110){
    NET.trac.on=true;sndPutt(5.5,.12);
    townTimers.push(setTimeout(()=>{if(NET.live&&NET.trac&&NET.trac.on)cap.textContent='Tractor on the back straight.'},1800))}
  if(NET.trac&&NET.trac.on){NET.trac.lat+=dt*1.5;
    if(NET.trac.lat>7.2){NET.trac.on=false;NET.trac.done=true;trackTractor.visible=false}
    else{trackPos(NET.trac.prog,_tr_p);const nx=-_tr_p.hz,nz=_tr_p.hx;
      trackTractor.visible=true;
      trackTractor.position.set(_tr_p.x+nx*NET.trac.lat,0,_tr_p.z+nz*NET.trac.lat);
      trackTractor.rotation.y=Math.atan2(-nx,-nz)}}
  for(let i=0;i<8;i++){
    const u=((NET.prog[i]%L)+L)%L;
    if(NET.phase==='green'){
      /* impulse-smoothed taps per second: steady mashing at T/s settles rate at T */
      if(NET.conns[i]){NET.rate[i]=Math.min(14,NET.rate[i]*(1-Math.min(1,dt*1.5))+NET.taps[i]*1.5);NET.taps[i]=0}
      else NET.rate[i]+=((8+3*Math.sin(now/700+i*2.1)+(i*13)%3)-NET.rate[i])*Math.min(1,dt*2); /* unclaimed cars race themselves */
      const behind=lead-NET.prog[i],target=(12+NET.rate[i]*1.9)*(1+Math.min(.3,behind*.02))*(NET.slip[i]>0?.72:1);
      NET.spd[i]+=(target-NET.spd[i])*Math.min(1,dt*1.8)}
    /* steering: phones hold left/right, oil overrides the wheel, AI hunts the line */
    if(NET.slip[i]>0){NET.slip[i]-=dt;NET.lat[i]+=NET.slipDir[i]*2.6*dt}
    else if(NET.conns[i]){NET.lat[i]+=NET.st[i]*4.6*dt;
      if(!NET.st[i])NET.lat[i]+=(0-NET.lat[i])*Math.min(1,dt*.3)}
    else NET.lat[i]+=(aiLat(i,u)-NET.lat[i])*Math.min(1,dt*(1.6+((i*7)%3)*.5));
    NET.lat[i]=Math.max(-3.4,Math.min(3.4,NET.lat[i]));
    /* hazard hits: cones scrub speed hard, oil sends you sliding */
    if(now-NET.hitCd[i]>2500){
      for(const h of NET.haz){const d=Math.abs(u-h.p),dd=Math.min(d,L-d);
        if(dd<1.7&&Math.abs(NET.lat[i]-h.lat)<1.15){NET.hitCd[i]=now;
          if(h.type==='cone'){NET.spd[i]*=.4;sndThud();const c=cars[i];for(let k=0;k<3;k++)rmPuff({x:c.position.x,z:c.position.z,h:c.rotation.y},30)}
          else{NET.slip[i]=.9;NET.slipDir[i]=NET.lat[i]>=h.lat?1:-1}
          break}}
      if(NET.trac&&NET.trac.on&&now-NET.hitCd[i]>2500){const d=Math.abs(u-NET.trac.prog),dd=Math.min(d,L-d);
        if(dd<2&&Math.abs(NET.lat[i]-NET.trac.lat)<1.6){NET.hitCd[i]=now;NET.spd[i]*=.35}}}
    /* real corner geometry: the inside line (+lat) is genuinely shorter */
    const inTurn=(u>S&&u<S+Math.PI*R)||(u>2*S+Math.PI*R);
    const cf=inTurn?R/(R-NET.lat[i]):1;
    const crossed=NET.done.includes(i);
    NET.prog[i]+=NET.spd[i]*dt*cf*(crossed?.4:1);
    if(!crossed&&NET.prog[i]>=F){NET.done.push(i);
      if(NET.conns[i])NET.conns[i].send({type:'state',phase:'done',place:NET.done.length})}}
  /* 120-second cap so a dead phone can't stall the show */
  if(NET.phase==='green'&&now-NET.greenT0>120000){[...Array(8).keys()].filter(i=>!NET.done.includes(i))
    .sort((a,c)=>NET.prog[c]-NET.prog[a]).forEach(i=>{NET.done.push(i);
      if(NET.conns[i])NET.conns[i].send({type:'state',phase:'done',place:NET.done.length})})}
  /* bumping: two cars can't share a piece of road. the one behind loses a touch */
  for(let a=0;a<8;a++)for(let c2=a+1;c2<8;c2++){const dp=NET.prog[a]-NET.prog[c2];if(Math.abs(dp)>3.2)continue;
    const dl=NET.lat[a]-NET.lat[c2];if(Math.abs(dl)>=1.9)continue;
    const sg=dl>0?1:dl<0?-1:(a%2?1:-1),ov=(1.9-Math.abs(dl))/2;
    NET.lat[a]=Math.max(-3.4,Math.min(3.4,NET.lat[a]+sg*ov));NET.lat[c2]=Math.max(-3.4,Math.min(3.4,NET.lat[c2]-sg*ov));
    if(dp<0)NET.spd[a]*=.985;else NET.spd[c2]*=.985}
  cars.forEach((c,i)=>carAt(c,i,NET.prog[i],NET.lat[i]+Math.sin(now/300+i*2.3)*.12));
  /* the look of speed: lean into the turns, rubber on the corners, sand off the edge */
  for(let i=0;i<8;i++){const c=cars[i],u=((NET.prog[i]%L)+L)%L,sp=Math.min(1,NET.spd[i]/38);
    const inTurn=(u>S&&u<S+Math.PI*R)||(u>2*S+Math.PI*R);
    const dl=dt>0?(NET.lat[i]-NET.prevLat[i])/dt:0;NET.prevLat[i]=NET.lat[i];
    c.rotation.z=(inTurn?.045*sp:0)+Math.max(-.05,Math.min(.05,dl*.006));
    const ry=c.rotation.y,fx=-Math.sin(ry),fz=-Math.cos(ry),rx=Math.cos(ry),rz=-Math.sin(ry);
    if((inTurn&&NET.spd[i]>22)||NET.slip[i]>0){const bx=c.position.x-fx*1.05,bz=c.position.z-fz*1.05,
        lx=bx-rx*.86,lz=bz-rz*.86,rxw=bx+rx*.86,rzw=bz+rz*.86;
      if(NET.wl[i]){rmMark(NET.wl[i][0],NET.wl[i][1],lx,lz);rmMark(NET.wr[i][0],NET.wr[i][1],rxw,rzw)}
      NET.wl[i]=[lx,lz];NET.wr[i]=[rxw,rzw]}
    else NET.wl[i]=NET.wr[i]=null;
    if(NET.slip[i]>0||(Math.abs(NET.lat[i])>3.1&&NET.spd[i]>15)){NET.dustT[i]+=dt*NET.spd[i];
      if(NET.dustT[i]>3){NET.dustT[i]=0;rmPuff({x:c.position.x,z:c.position.z,h:ry},NET.spd[i])}}}
  rmDustTick(dt);
  /* lap board on the caption */
  if(NET.phase==='green'){const lap=Math.min(TRACK.LAPS,Math.floor((lead-TRACK.SF)/TRACK.L)+1);
    if(lap>NET.lastLap){NET.lastLap=lap;cap.textContent=lap===TRACK.LAPS?'FINAL LAP':`LAP ${lap} OF ${TRACK.LAPS}`}}
  /* standings: position tower on screen, live place on each phone, once a second */
  if(now-NET.lastPlaceT>1000){NET.lastPlaceT=now;
    const order=[...NET.done,...[...Array(8).keys()].filter(i=>!NET.done.includes(i)).sort((a,c)=>NET.prog[c]-NET.prog[a])];
    towerEl.innerHTML=order.map((idx,pl)=>{const p=people[idx];
      return `<div class="row${NET.done.includes(idx)?' fin':''}"><b>${pl+1}</b><i style="background:${p[3]}"></i>${p[1].split(' ')[0]}</div>`}).join('');
    if(NET.phase==='green')order.forEach((idx,pl)=>{const c=NET.conns[idx];
      if(c&&c.open&&!NET.done.includes(idx))try{c.send({type:'state',phase:'green',place:pl+1})}catch(e){}})}
  /* camera rides the track just behind the last car, so every racer stays in view */
  const trail=Math.min(...NET.prog);
  NET.camProg+=(Math.min(trail-8,F+16)-NET.camProg)*Math.min(1,dt*1.4);
  if(NET.phase==='green'&&NET.done.length>=8){NET.phase='finished';
    const w=people[NET.done[0]];cap.textContent=`${w[1]} takes the August 500!`;sndFanfare();
    broadcast({type:'state',phase:'over',order:NET.done});updateFin(NET.done)}}

function updateFin(order){document.getElementById('fin').innerHTML=order.map((idx,pl)=>{const p=people[idx];
  return `<div class="p"><span class="n" style="background:${p[3]}">${p[0]}</span><span class="who">${pl+1}. ${p[1]}<small>${p[2]}</small></span></div>`}).join('')}
