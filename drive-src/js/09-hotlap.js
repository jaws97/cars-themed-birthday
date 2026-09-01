/* ======================= midnight time trial =======================
   the post-credits playground: one driver at a time takes the big
   circuit, the host times the lap, and the leaderboard remembers the
   night's legends. phones queue with a typed name — nobody claims a
   roster car, they just borrow a paint job for one lap. */
const TT={on:false,phase:'idle',queue:[],driver:null,timers:[],
  prog:0,spd:0,rate:0,taps:0,lat:0,slip:0,slipDir:0,stun:0,hitCd:0,t0:0,camProg:0,
  cones:[],coneMeshes:[],board:[]};
const ttPanel=document.getElementById('ttpanel'),ttRows=document.getElementById('ttrows'),
  ttClock=document.getElementById('ttclock'),ttDriver=document.getElementById('ttdriver');
try{TT.board=JSON.parse(localStorage.getItem('r08-laps')||'[]')}catch(e){}
const ttEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ttFmt=ms=>{const s=ms/1000,m=Math.floor(s/60);return m+':'+(s-m*60).toFixed(2).padStart(5,'0')};
function ttSave(){try{localStorage.setItem('r08-laps',JSON.stringify(TT.board.slice(0,50)))}catch(e){}}
function ttCast(m){if(NET.all)NET.all.forEach(c=>{if(c.open)try{c.send(m)}catch(e){}})}
function ttSetCap(t){cap.textContent=t||'';cap.classList.toggle('on',!!t)}
const TT_INVITE='scan the code · one lap · fastest tonight wins';

function ttRenderBoard(hl){ttRows.innerHTML=TT.board.slice(0,8).map((e,i)=>
  `<div class="row${e===hl?' me':''}"><b>${i+1}</b><i style="background:${people[e.car][3]}"></i>${ttEsc(e.n)}<span>${ttFmt(e.ms)}</span></div>`).join('')
  ||'<div class="row">no laps yet — be the first</div>'}
function ttStatus(){
  if(TT.driver)ttDriver.textContent='at the wheel — '+TT.driver.name;
  else if(TT.queue.length)ttDriver.textContent='next up: '+TT.queue[0].name+(TT.queue.length>1?' · '+(TT.queue.length-1)+' more in line':'');
  else ttDriver.textContent='the track is open';
  if(TT.phase!=='run')ttClock.textContent=TT.board[0]?'★ '+ttFmt(TT.board[0].ms):'--:--.--'}

function ttOpen(){if(TT.on)return;TT.on=true;TT.phase='idle';TT.camProg=0;
  netInit();showLobby(true);lobbyEl.classList.add('tt');
  ttPanel.classList.add('on');ttBuildCones();ttRenderBoard(null);ttStatus();
  ttSetCap(TT_INVITE);
  ttCast({type:'tt',on:true})}
function ttClose(){if(!TT.on)return;TT.on=false;
  TT.timers.forEach(clearTimeout);TT.timers=[];
  if(TT.driver&&TT.driver.conn.open)try{TT.driver.conn.send({type:'tt-dnf'})}catch(e){}
  if(TT.driver)setCarO(cars[TT.driver.car],0);
  TT.driver=null;TT.queue=[];TT.phase='idle';
  TT.coneMeshes.forEach(m=>scene.remove(m));TT.coneMeshes=[];TT.cones=[];
  ttPanel.classList.remove('on');lobbyEl.classList.remove('tt');
  ttCast({type:'tt',on:false})}

/* track furniture: one fixed layout per session, so every lap is the same test */
function ttBuildCones(){TT.coneMeshes.forEach(m=>scene.remove(m));TT.coneMeshes=[];TT.cones=[];
  const used=[],p={};
  for(let k=0;k<11;k++){let s=null;
    for(let t=0;t<40;t++){const q=130+Math.random()*(CIRCUIT.L-190);
      if(used.every(u=>Math.abs(u-q)>26)){s=q;used.push(q);break}}
    if(s===null)break;
    TT.cones.push({p:s,lat:Math.random()*5.4-2.7,type:k<8?'cone':'oil'})}
  TT.cones.forEach(h=>{circuitPos(h.p,p);const nx=-p.hz,nz=p.hx;let m;
    if(h.type==='cone')m=new THREE.Mesh(new THREE.ConeGeometry(.4,.8,10),new THREE.MeshLambertMaterial({color:0xF5B335}));
    else{m=new THREE.Mesh(new THREE.CircleGeometry(.95,16),new THREE.MeshBasicMaterial({color:0x0a0c18,transparent:true,opacity:.8}));m.rotation.x=-Math.PI/2}
    m.position.set(p.x+nx*h.lat,h.type==='cone'?.4:.05,p.z+nz*h.lat);
    h.mesh=m;h.x0=m.position.x;h.z0=m.position.z;h.nx=nx;h.nz=nz;h.gone=false;
    scene.add(m);TT.coneMeshes.push(m)})}
/* a struck cone gets punted off the racing line, then walks back for the
   next driver — the layout stays identical for everyone */
function ttThump(h,side){if(h.gone)return;h.gone=true;const m=h.mesh;
  tween(v=>{m.position.y=.4+Math.sin(v*Math.PI)*1.8;
    m.position.x=h.x0+h.nx*side*2.4*v;m.position.z=h.z0+h.nz*side*2.4*v;
    m.rotation.z=v*6.5},0,1,650,ease.out,null,'cone'+h.p);
  TT.timers.push(setTimeout(()=>{h.gone=false;m.position.set(h.x0,.4,h.z0);m.rotation.z=0},3200))}
function ttFlash(t){if(TT.phase!=='run')return;ttSetCap(t);
  TT.timers.push(setTimeout(()=>{if(TT.phase==='run')ttSetCap('')},1400))}

/* the queue: phones ask in with a name, the host stages them one by one */
function ttJoin(c,name,car){if(!TT.on)return;
  name=String(name||'').replace(/\s+/g,' ').trim().slice(0,14)||'mystery driver';
  car=Math.abs(car|0)%8;
  if(TT.driver&&TT.driver.conn===c)return;
  const q=TT.queue.find(e=>e.conn===c);
  if(q){q.name=name;q.car=car}else TT.queue.push({conn:c,name,car});
  ttQPos();ttStatus();
  if(!TT.driver)ttNext()}
function ttQPos(){TT.queue.forEach((e,i)=>{if(e.conn.open)try{e.conn.send({type:'tt-q',pos:i+1})}catch(x){}})}
function ttDrop(c){if(!TT.on)return;
  const n=TT.queue.length;TT.queue=TT.queue.filter(e=>e.conn!==c);
  if(TT.queue.length!==n){ttQPos();ttStatus()}
  if(TT.driver&&TT.driver.conn===c){ttSetCap(TT.driver.name+' lost the pits — next driver');ttAbort(1800)}}
function ttAbort(delay){TT.timers.forEach(clearTimeout);TT.timers=[];TT.phase='idle';
  if(TT.driver)setCarO(cars[TT.driver.car],0);TT.driver=null;ttStatus();
  TT.timers.push(setTimeout(ttNext,delay||0))}

function ttNext(){if(!TT.on||TT.driver)return;
  let d=null;while(TT.queue.length&&!d){const e=TT.queue.shift();if(e.conn.open)d=e}
  ttQPos();
  if(!d){TT.phase='idle';ttStatus();ttSetCap(TT_INVITE);return}
  TT.driver=d;TT.phase='staged';
  TT.prog=0;TT.spd=0;TT.rate=0;TT.taps=0;TT.lat=0;TT.slip=0;TT.stun=0;TT.hitCd=0;TT.camProg=-16;
  cars.forEach(c=>setCarO(c,0));setCarO(cars[d.car],1);carAtC(cars[d.car],0,0);
  try{d.conn.send({type:'tt-stage'})}catch(e){}
  ttStatus();ttSetCap(d.name+' to the line…');
  [['READY…',1600],['3',2600],['2',3400],['1',4200]].forEach(([t,ms])=>TT.timers.push(setTimeout(()=>ttSetCap(t),ms)));
  TT.timers.push(setTimeout(()=>{if(TT.driver!==d)return;
    TT.phase='run';TT.t0=performance.now();
    ttSetCap('GO!');try{d.conn.send({type:'tt-go'})}catch(e){}
    TT.timers.push(setTimeout(()=>{if(TT.phase==='run')ttSetCap('')},2200))},5000))}

function ttFinish(ms){const d=TT.driver;TT.phase='cool';
  const entry={n:d.name,car:d.car,ms:Math.round(ms)};
  TT.board.push(entry);TT.board.sort((a,b)=>a.ms-b.ms);ttSave();
  const rank=TT.board.indexOf(entry);
  ttRenderBoard(entry);ttClock.textContent=ttFmt(ms);
  ttSetCap(rank===0?d.name+' — '+ttFmt(ms)+' — TRACK RECORD!':d.name+' — '+ttFmt(ms));
  try{d.conn.send({type:'tt-done',ms:entry.ms,rank:rank+1,of:TT.board.length})}catch(e){}
  TT.timers.push(setTimeout(()=>{if(TT.driver!==d)return;
    setCarO(cars[d.car],0);TT.driver=null;TT.phase='idle';ttStatus();
    if(TT.queue.length)ttNext();else ttSetCap(TT_INVITE)},4500))}

const _tt_p={};
function ttTick(dt,now){if(!TT.on)return;
  if(TT.phase==='idle'){TT.camProg+=dt*16;return} /* empty track: a slow flying tour */
  if(TT.phase==='staged'){TT.camProg+=(-16-TT.camProg)*Math.min(1,dt*3);return}
  const d=TT.driver;if(!d)return;
  const L=CIRCUIT.L,u=((TT.prog%L)+L)%L;
  if(TT.phase==='run'){
    TT.rate=Math.min(14,TT.rate*(1-Math.min(1,dt*1.5))+TT.taps*1.5);TT.taps=0;
    if(TT.stun>0)TT.stun-=dt; /* a hit kills the throttle until the car recovers */
    const target=TT.stun>0?0:(12+TT.rate*1.9)*(TT.slip>0?.72:1);
    TT.spd+=(target-TT.spd)*Math.min(1,dt*(TT.stun>0?4:1.8));
    ttClock.textContent=ttFmt(now-TT.t0)}
  else TT.spd+=(0-TT.spd)*Math.min(1,dt*1.2); /* cool: roll it out past the line */
  const st=(d.conn&&d.conn._st)||0;
  if(TT.slip>0){TT.slip-=dt;TT.lat+=TT.slipDir*2.6*dt}
  else{TT.lat+=st*4.6*dt;if(!st)TT.lat+=(0-TT.lat)*Math.min(1,dt*.3)}
  TT.lat=Math.max(-3.4,Math.min(3.4,TT.lat));
  if(TT.phase==='run'&&now-TT.hitCd>2000){
    for(const h of TT.cones){if(h.gone)continue;
      const d0=Math.abs(u-h.p),dd=Math.min(d0,L-d0);
      if(dd<1.7&&Math.abs(TT.lat-h.lat)<1.15){TT.hitCd=now;
        if(h.type==='cone'){TT.spd*=.1;TT.stun=.6;ttThump(h,TT.lat>=h.lat?-1:1);ttFlash('CONE!')}
        else{TT.slip=.9;TT.slipDir=TT.lat>=h.lat?1:-1;ttFlash('OIL SLICK!')}
        break}}}
  /* real corner geometry, same as the race: the inside line is shorter */
  circuitPos(u,_tt_p);
  const cf=_tt_p.R?_tt_p.R/(_tt_p.R-_tt_p.dir*TT.lat):1;
  TT.prog+=TT.spd*dt*cf;
  if(TT.phase==='run'&&TT.prog>=L)ttFinish(now-TT.t0);
  else if(TT.phase==='run'&&now-TT.t0>150000){ /* a dead phone can't hold the track */
    ttSetCap(d.name+' ran out of night');
    if(d.conn.open)try{d.conn.send({type:'tt-dnf'})}catch(e){}
    ttAbort(1800);return}
  carAtC(cars[d.car],TT.prog,TT.lat+Math.sin(now/300)*.1);
  /* tight chase: a slow lerp lags by spd/rate, so keep the rate high and the
     gap reads as a steady car-and-a-half even at full song */
  TT.camProg+=(TT.prog-8-TT.camProg)*Math.min(1,dt*7)}
