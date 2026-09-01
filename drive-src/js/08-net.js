/* ======================= multiplayer: phones as throttles =======================
   The projector page is the authoritative host. Phones connect peer-to-peer via
   PeerJS (free public broker, no account) and send tap counts; the host runs the
   race. If there's no internet, no PeerJS, or nobody joins, the scripted race
   runs untouched — multiplayer is additive, never load-bearing. */
const NET={peer:null,ready:false,conns:{},claimed:Array(8).fill(false),live:false,phase:'idle',
  taps:Array(8).fill(0),rate:Array(8).fill(0),prog:Array(8).fill(0),spd:Array(8).fill(0),done:[],greenT0:0,camProg:0,lastLap:0,lastPlaceT:0};
const lobbyEl=document.getElementById('lobby'),chipsEl=document.getElementById('chips'),qrBox=document.getElementById('qr'),towerEl=document.getElementById('tower');

function netInit(){if(NET.peer||location.protocol==='file:'||typeof Peer==='undefined')return;
  const id='r08-'+Math.random().toString(36).slice(2,7);
  try{NET.peer=new Peer(id)}catch(e){return}
  NET.peer.on('open',()=>{NET.ready=true;drawLobby(id);updateLobby();if(beats[b]&&beats[b].name==='grid500')showLobby(true)});
  NET.peer.on('connection',c=>{c.on('data',d=>onMsg(c,d));c.on('close',()=>dropConn(c))});
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
      c.send({type:'assigned',i,phase:NET.phase});broadcast({type:'roster',claimed:NET.claimed});updateLobby()}
    else c.send({type:'roster',claimed:NET.claimed})}
  else if(d.type==='taps'){const i=c._idx;if(i!==undefined&&NET.phase==='green')NET.taps[i]+=d.n}}
function dropConn(c){const i=c._idx;if(i===undefined||NET.conns[i]!==c)return;delete NET.conns[i];
  if(!NET.live){NET.claimed[i]=false;broadcast({type:'roster',claimed:NET.claimed});updateLobby()}}

/* the race is always real: humans drive claimed cars by tapping, AI drives the
   rest. TRACK.LAPS laps of the oval from the grid to the start/finish line. */
const gridProg=i=>20-Math.floor(i/2)*4.5;
const finishProg=()=>TRACK.SF+TRACK.LAPS*TRACK.L;
function netStartRace(){NET.live=true;NET.phase='set';NET.done=[];NET.lastLap=1;
  for(let i=0;i<8;i++){NET.prog[i]=gridProg(i);NET.spd[i]=0;NET.taps[i]=0;NET.rate[i]=0;
    setCarO(cars[i],1);carAt(cars[i],i,NET.prog[i])}
  NET.camProg=-12; /* trackPos(-12) is the grid-beat camera spot, so the cut to the race is seamless */
  cap.textContent='Drivers, ready…';
  broadcast({type:'state',phase:'set'});
  townTimers.push(setTimeout(()=>{NET.phase='green';NET.greenT0=performance.now();
    broadcast({type:'state',phase:'green'});cap.textContent='GREEN. GREEN. GREEN.'},2600))}
function netEndRace(){NET.live=false;NET.phase='idle';broadcast({type:'state',phase:'idle'})}

function netTick(dt,now){if(!NET.live||(NET.phase!=='green'&&NET.phase!=='finished'))return;
  const F=finishProg(),lead=Math.max(...NET.prog);
  for(let i=0;i<8;i++){
    if(NET.phase==='green'){
      /* impulse-smoothed taps per second: steady mashing at T/s settles rate at T */
      if(NET.conns[i]){NET.rate[i]=Math.min(14,NET.rate[i]*(1-Math.min(1,dt*1.5))+NET.taps[i]*1.5);NET.taps[i]=0}
      else NET.rate[i]+=((8+3*Math.sin(now/700+i*2.1)+(i*13)%3)-NET.rate[i])*Math.min(1,dt*2); /* unclaimed cars race themselves */
      const behind=lead-NET.prog[i],target=(12+NET.rate[i]*1.9)*(1+Math.min(.3,behind*.02));
      NET.spd[i]+=(target-NET.spd[i])*Math.min(1,dt*1.8)}
    const crossed=NET.done.includes(i);
    NET.prog[i]+=NET.spd[i]*dt*(crossed?.4:1);
    if(!crossed&&NET.prog[i]>=F){NET.done.push(i);
      if(NET.conns[i])NET.conns[i].send({type:'state',phase:'done',place:NET.done.length})}}
  /* 90-second cap so a dead phone can't stall the show */
  if(NET.phase==='green'&&now-NET.greenT0>90000){[...Array(8).keys()].filter(i=>!NET.done.includes(i))
    .sort((a,c)=>NET.prog[c]-NET.prog[a]).forEach(i=>{NET.done.push(i);
      if(NET.conns[i])NET.conns[i].send({type:'state',phase:'done',place:NET.done.length})})}
  cars.forEach((c,i)=>carAt(c,i,NET.prog[i],Math.sin(now/300+i*2.3)*.3));
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
    const w=people[NET.done[0]];cap.textContent=`${w[1]} takes the August 500!`;
    broadcast({type:'state',phase:'over',order:NET.done});updateFin(NET.done)}}

function updateFin(order){document.getElementById('fin').innerHTML=order.map((idx,pl)=>{const p=people[idx];
  return `<div class="p"><span class="n" style="background:${p[3]}">${p[0]}</span><span class="who">${pl+1}. ${p[1]}<small>${p[2]}</small></span></div>`}).join('')}
