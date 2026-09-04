/* ======================= the open desert: free roam =======================
   the second after-party. every phone gets a roster car at once and the
   speedway infield becomes a playground: no rails, no laps. an arcade car
   model (a heading, a forward speed, a little sideways slip that the tyres
   bleed off) on the flat desert floor; circle collisions against cars,
   cones, shopfronts and rocks; dust off the tarmac and skid marks in a
   slide; seven glowing checkpoints scattered from the town to the far turn;
   a director cam that hops between drivers; and a minimap so nobody loses
   their car in the dark. cars nobody has claimed cruise the midnight
   circuit as moving furniture. */
const RM={on:false,c:[],taps:Array(8).fill(0),gas:Array(8).fill(0),rev:Array(8).fill(0),knocks:Array(8).fill(0),
  checks:people.map(()=>new Set()),feat:-1,featT:0,cutT:0,snap:false,cones:[],cps:[],timers:[],walls:null,road:null,keys:{},hostT:0,
  camP:new THREE.Vector3(),camL:new THREE.Vector3(),boardT:0,mapBg:null,dust:[],dustN:0,skid:null,board:[],evT:0,evN:0,train:null};
try{RM.board=JSON.parse(localStorage.getItem('r08-laps')||'[]')}catch(e){}
const rmLapsEl=document.getElementById('rmlaps'),rmClock=document.getElementById('rmclock');
const rmFmt=ms=>{const s=ms/1000,m=Math.floor(s/60);return m+':'+(s-m*60).toFixed(2).padStart(5,'0')};
const rmEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rmPanel=document.getElementById('rmpanel'),rmRows=document.getElementById('rmrows'),rmMap=document.getElementById('rmmap');
/* the playground: from the town's first shopfront to the speedway's far turn */
const RM_B={x0:-100,x1:112,z0:-1062,z1:-412},CAR_R=1.45;
const RM_INVITE='the open desert · scan to join · hold to go · laps start under the arch';
const rmFirst=i=>people[i][1].split(' ')[0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

function rmOpen(){if(RM.on)return;RM.on=true;
  netInit();showLobby(true);lobbyEl.classList.add('roam');
  rmPanel.classList.add('on');
  RM.knocks.fill(0);RM.checks.forEach(s=>s.clear());RM.feat=-1;RM.featT=0;RM.cutT=0;RM.boardT=0;RM.snap=true;
  RM.evT=performance.now()+55000;
  if(!RM.walls)rmBuildWalls();
  if(!RM.road)rmBuildRoad();
  if(!RM.skid)rmBuildSkid();
  if(!RM.dust.length)rmBuildDust();
  rmClearSkid();rmBuildCones();rmBuildCheckpoints();
  /* claimed cars line up on the infield grid; the rest cruise the circuit */
  RM.c=people.map((p,i)=>{const s={x:0,z:0,h:0,vx:0,vz:0,sa:0,rate:0,slip:0,ai:true,prog:i*CIRCUIT.L/8,hit:0,wl:null,wr:null,dustT:0,lean:0,lapT0:null,gates:0,pz:null};
    if(NET.conns[i])rmStage(s,i);
    setCarO(cars[i],1);return s});
  rmDrawMapBg();rmRenderBoard();rmRenderLaps(null);
  cap.textContent=RM_INVITE;cap.classList.add('on');
  RM.camP.set(40,16,-810);RM.camL.set(40,0,-885);
  rmCast({type:'roam',on:true})}
function rmClose(){if(!RM.on)return;RM.on=false;
  RM.timers.forEach(clearTimeout);RM.timers=[];
  RM.cones.forEach(h=>scene.remove(h.mesh));RM.cones=[];
  RM.cps.forEach(c=>scene.remove(c.g));RM.cps=[];
  RM.skid.mesh.visible=false;RM.dust.forEach(d=>d.s.visible=false);
  kill('rmtr');trackTractor.visible=false;kill('rmtrain');if(RM.train)RM.train.visible=false;
  cars.forEach(c=>c.rotation.z=0); /* no lean carried into the next act */
  rmPanel.classList.remove('on');lobbyEl.classList.remove('roam');
  rmCast({type:'roam',on:false})}
function rmCast(m){if(NET.all)NET.all.forEach(c=>{if(c.open)try{c.send(m)}catch(e){}})}
/* a fresh driver starts on the infield grid, facing down the front straight */
function rmStage(s,i){s.ai=false;s.x=22+(i%2)*4.2;s.z=-790-Math.floor(i/2)*6;s.h=0;s.vx=s.vz=0;s.sa=0;s.rate=0;s.wl=s.wr=null;s.lapT0=null;s.gates=0;s.pz=null;
  cars[i].position.set(s.x,0,s.z);cars[i].rotation.set(0,0,0)}

/* ---- the furniture: what a car can't drive through ---- */
function rmBuildWalls(){const W=RM.walls=[];
  const C=(x,z,r)=>W.push({t:'c',x,z,r}),R=(x0,x1,z0,z1)=>W.push({t:'r',x0,x1,z0,z1});
  LOTS.forEach(([z,w,side])=>{const cx=side*(9.5+w/2);R(cx-w/2,cx+w/2,z-4,z+4)});
  /* scenery models: a prop planted on the road is dressing, not a wall */
  const p={};
  (SHOW.props||[]).forEach(q=>{let near=Math.abs(q.x)<9;
    for(let s=0;s<CIRCUIT.L&&!near;s+=6){circuitPos(s,p);if(Math.hypot(p.x-q.x,p.z-q.z)<10)near=true}
    if(!near)C(q.x,q.z,(q.size||10)*.28)});
  desertRocks.forEach(r=>C(r.x,r.z,r.r));
  R(-32,-22,-1005,-765);R(102,112,-1005,-765);  /* speedway stands */
  R(5.85,6.35,-925,-785);                        /* pit wall */
  [[-7.4,-700],[7.4,-700],[-7.6,-560],[7.6,-560],[-6.6,-855],[6.6,-855],
   [-13,-780],[-13,-985],[93,-780],[93,-985]].forEach(([x,z])=>C(x,z,.4));
  [290,905].forEach(s=>{circuitPos(s,p);C(p.x-p.hz*9,p.z+p.hx*9,.4)});
  tractors.forEach(t=>C(t.position.x,t.position.z,1.6))}
/* pavement samples, for the off-road feel: sand drags, tarmac flies */
function rmBuildRoad(){const pts=RM.road=[],p={};
  for(let s=0;s<CIRCUIT.L;s+=3){circuitPos(s,p);pts.push(p.x,p.z)}
  for(let s=0;s<TRACK.L;s+=3){trackPos(s,p);pts.push(p.x,p.z)}}
function rmOnRoad(x,z){if(Math.abs(x)<5.4&&z<10&&z>-1540)return true;
  const r=RM.road;for(let i=0;i<r.length;i+=2){const dx=x-r[i],dz=z-r[i+1];if(dx*dx+dz*dz<30)return true}
  return false}

/* cones and oil on the infield: a slalom, a ring, a bowling triangle */
function rmBuildCones(){RM.cones.forEach(h=>scene.remove(h.mesh));RM.cones=[];
  const spots=[];
  for(let k=0;k<8;k++)spots.push([40,-808-k*18,'cone']);
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;spots.push([22+Math.cos(a)*11,-880+Math.sin(a)*11,'cone'])}
  for(let r=0;r<4;r++)for(let k=0;k<=r;k++)spots.push([60-r*1.5+k*3,-955-r*1.6,'cone']);
  [[56,-815],[28,-940],[66,-880],[40,-985]].forEach(([x,z])=>spots.push([x,z,'oil']));
  spots.forEach(([x,z,type])=>{let m;
    if(type==='cone')m=new THREE.Mesh(new THREE.ConeGeometry(.4,.8,10),new THREE.MeshLambertMaterial({color:0xF5B335}));
    else{m=new THREE.Mesh(new THREE.CircleGeometry(1.3,16),new THREE.MeshBasicMaterial({color:0x0a0c18,transparent:true,opacity:.8}));m.rotation.x=-Math.PI/2}
    m.position.set(x,type==='cone'?.4:.05,z);scene.add(m);
    RM.cones.push({x,z,type,mesh:m,gone:false})})}
/* a struck cone flies the way the car was going, tumbles, and walks back
   home a while later so the playground never runs out of things to hit */
function rmKnock(h,s,i){if(h.gone)return;h.gone=true;const m=h.mesh,spd=Math.hypot(s.vx,s.vz);
  const dx=spd>.1?s.vx/spd:1,dz=spd>.1?s.vz/spd:0,fl=3+Math.min(9,spd*.3),lift=1+Math.min(3,spd*.08);
  const rx=(Math.random()-.5)*7,rz=(Math.random()-.5)*7;
  tween(v=>{m.position.set(h.x+dx*fl*v,.4+Math.sin(v*Math.PI)*lift,h.z+dz*fl*v);m.rotation.set(rx*v,0,rz*v)},0,1,700,ease.out,null,'rmc'+h.x+h.z);
  RM.timers.push(setTimeout(()=>{if(!RM.on)return;
    tween(v=>{m.position.y=.4+Math.sin(v*Math.PI)*.6;m.rotation.set(rx*(1-v),0,rz*(1-v));
      m.position.x=h.x+dx*fl*(1-v);m.position.z=h.z+dz*fl*(1-v)},0,1,900,ease.inout,null,'rmc'+h.x+h.z);
    h.gone=false},9000));
  RM.knocks[i]++;rmFeature(i,performance.now());sndThud();
  const n=RM.knocks[i];rmFlash(rmFirst(i)+(n%10===0?' — '+n+' cones and counting':n===1?' flattens a cone':' · cone '+n))}
function rmFlash(t){cap.textContent=t;cap.classList.add('on');
  RM.timers.push(setTimeout(()=>{if(RM.on&&cap.textContent===t)cap.textContent=RM_INVITE},2200))}
function rmFeature(i,now){if(RM.feat===i||now-RM.cutT<4000)return;RM.feat=i;RM.featT=now;RM.cutT=now;RM.snap=true}

/* ---- checkpoints: one per person, the reason to leave the infield.
   each ring carries a guest's number and colour; finding them all is
   visiting everyone at the party ---- */
const RM_PLACES=['the diner','the gas station','the town hairpin','the back road','the far hairpin','turn two','the infield','the pits'];
function rmBuildCheckpoints(){RM.cps.forEach(c=>scene.remove(c.g));RM.cps=[];
  const p={},at=s=>{circuitPos(s,p);return[p.x,p.z]};
  const spots=[[0,-463],[0,-570],at(290),at(560),at(905),[TRACK.R,-760-TRACK.S-TRACK.R],[70,-880],[12,-855]];
  spots.forEach(([x,z],k)=>{const g=new THREE.Group(),who=people[k],col=new THREE.Color(who[3]);
    const glow=glowTexture(col.getStyle());
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.7,3.4,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.06;g.add(ring);
    const beam=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,opacity:.55,depthWrite:false}));
    beam.scale.set(2.2,26,1);beam.position.y=12;g.add(beam);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,opacity:.5,depthWrite:false}));
    halo.scale.set(9,9,1);halo.position.y=.6;g.add(halo);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTexture(who),transparent:true,depthWrite:false}));
    tag.scale.set(2.6,2.6,1);tag.position.y=4.6;g.add(tag);
    g.position.set(x,0,z);scene.add(g);RM.cps.push({x,z,name:RM_PLACES[k],g,ring,beam,tag,k})})}
function rmCheck(c,s,i,now){const set=RM.checks[i];if(set.has(c.k))return;set.add(c.k);
  tween(v=>{c.ring.scale.setScalar(1+v*1.6);c.ring.material.opacity=.75*(1-v);c.tag.position.y=4.6+Math.sin(v*Math.PI)*2},0,1,900,ease.out,null,'rmcp'+c.k);
  RM.timers.push(setTimeout(()=>{c.ring.scale.setScalar(1);c.ring.material.opacity=.75},950));
  rmFeature(i,now);sndChime(false);
  const n=set.size,me=rmFirst(i),owner=rmFirst(c.k);
  rmFlash(n===RM.cps.length?me+' has seen everyone!':c.k===i?me+' is home · '+n+' of '+RM.cps.length:me+' finds '+owner+"'s "+c.name+' · '+n+' of '+RM.cps.length)}

/* ---- things that happen to the world, for the room that is watching ---- */
function rmEventsTick(now){if(now<RM.evT)return;RM.evT=now+90000;
  const ev=['tractor','flicker','train'][RM.evN++%3];
  if(ev==='tractor')rmTractor();else if(ev==='flicker')rmFlicker();else rmTrain()}
/* a tractor ambles across the infield: it is solid, mind it */
function rmTractor(){const t=trackTractor;t.visible=true;t.rotation.y=-Math.PI/2;
  tween(v=>{t.position.set(4+74*v,0,-905+Math.sin(v*9)*3)},0,1,26000,ease.lin,null,'rmtr');
  RM.timers.push(setTimeout(()=>{t.visible=false},26100));
  rmFlash('tractor on the infield · it happens every august')}
/* the town's power stutters: the neon goes out and reignites sign by sign */
function rmFlicker(){signs.forEach((s,k)=>RM.timers.push(setTimeout(()=>{s.on.material.opacity=0;s.light.intensity=0;s.lit=false;
    RM.timers.push(setTimeout(()=>lightSign(s),900+Math.random()*1100))},k*140)));
  tween(v=>setBoard(v),1,0,260,ease.out,null,'board');
  RM.timers.push(setTimeout(()=>tween(v=>setBoard(v),0,1,1600,ease.inout,ignite,'board'),1300));
  rmFlash('the power flickers…')}
/* a string of birthday lights crosses under the arch */
function rmTrain(){if(!RM.train){const g=RM.train=new THREE.Group();
    for(let i=0;i<12;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:festTex[i%4],transparent:true,depthWrite:false}));
      s.scale.set(1.1,1.1,1);s.position.x=i*3.2;g.add(s)}
    scene.add(g)}
  const g=RM.train;g.visible=true;
  tween(v=>{g.position.set(-90+150*v,2.2,-706);g.children.forEach((s,i)=>s.position.y=Math.sin(v*40+i)*.5)},0,1,14000,ease.lin,null,'rmtrain');
  RM.timers.push(setTimeout(()=>{g.visible=false},14100));
  rmFlash('the birthday train rolls through · happy birthday, august')}

/* ---- last call: the cars come home ---- */
function rmGoodnight(){rmCast({type:'bye'});sndHorn();
  ['cityL','cityR'].forEach(k=>{if(_propReg[k])_propReg[k].visible=false}); /* the skyline blocks would crowd the lens this close */
  const order=[...Array(8).keys()].sort((a,b)=>((RM.c[b]&&!RM.c[b].ai)?1:0)-((RM.c[a]&&!RM.c[a].ai)?1:0));
  cars.forEach((c,i)=>{setCarO(c,1);c.rotation.z=0;
    const k=order.indexOf(i),tx=k%2?3.3:-3.3,tz=-664-Math.floor(k/2)*4.6,yaw=Math.atan2(tx,tz+650); /* between the cockpit and the arch banner, facing home */
    const x0=c.position.x,z0=c.position.z,y0=c.rotation.y,dist=Math.hypot(tx-x0,tz-z0);
    let dy=yaw-y0;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;
    tween(v=>{c.position.set(x0+(tx-x0)*v,0,z0+(tz-z0)*v);c.rotation.y=y0+dy*v},0,1,2400+Math.min(4200,dist*9)+k*200,ease.inout,null,'gn'+i)});
  boardTexture(1,'GOODNIGHT, AUGUST','THANKS FOR DRIVING · SEE YOU NEXT YEAR');archM.material.map=archTexture('GOODNIGHT, AUGUST');
  order.forEach((i,k)=>townTimers.push(setTimeout(()=>{cars[i].userData.lamps.visible=false},7000+k*450)));
  townTimers.push(setTimeout(()=>{creditsEl.classList.add('on');startRoll()},11500))}

/* ---- dust and skid marks ---- */
const RM_DUST_TEX=glowTexture('rgb(214,178,126)');
function rmBuildDust(){for(let k=0;k<48;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:RM_DUST_TEX,transparent:true,opacity:0,depthWrite:false}));
  s.visible=false;scene.add(s);RM.dust.push({s,t:1,life:1,vx:0,vz:0,grow:1})}}
function rmPuff(s,spd){const d=RM.dust[RM.dustN++%RM.dust.length];
  const fx=-Math.sin(s.h),fz=-Math.cos(s.h),rx=Math.cos(s.h),rz=-Math.sin(s.h),o=(Math.random()-.5)*1.6;
  d.s.position.set(s.x-fx*1.4+rx*o,.5,s.z-fz*1.4+rz*o);d.s.visible=true;
  d.t=0;d.life=.7+Math.random()*.5;d.vx=-fx*2+(Math.random()-.5)*2;d.vz=-fz*2+(Math.random()-.5)*2;d.grow=1.4+Math.min(2.6,spd*.06)}
function rmDustTick(dt){RM.dust.forEach(d=>{if(!d.s.visible)return;d.t+=dt;const u=d.t/d.life;
  if(u>=1){d.s.visible=false;return}
  d.s.position.x+=d.vx*dt;d.s.position.z+=d.vz*dt;d.s.position.y+=dt*1.1;
  const sc=.8+u*d.grow*2.2;d.s.scale.set(sc,sc,1);
  const near=Math.min(1,Math.max(0,(d.s.position.distanceTo(camera.position)-3)/6));
  d.s.material.opacity=.42*(1-u)*(1-u)*near})}
/* skid marks: one ring-buffered mesh, a quad per wheel per frame of sliding */
const RM_SK_N=6000;
function rmBuildSkid(){const geo=new THREE.BufferGeometry(),pos=new Float32Array(RM_SK_N*12),idx=[];
  for(let q=0;q<RM_SK_N;q++){const a=q*4;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
  for(let i=1;i<pos.length;i+=3)pos[i]=-5; /* unused quads live under the floor */
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setIndex(idx);
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x0a0a12,transparent:true,opacity:.55,depthWrite:false}));
  mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);RM.skid={mesh,pos,n:0}}
function rmClearSkid(){const S=RM.skid;S.n=0;for(let i=1;i<S.pos.length;i+=3)S.pos[i]=-5;
  S.mesh.geometry.attributes.position.needsUpdate=true;S.mesh.visible=false}
function rmMark(x0,z0,x1,z1){const S=RM.skid,dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz);if(l<.05)return;
  const nx=-dz/l*.17,nz=dx/l*.17,o=(S.n++%RM_SK_N)*12,p=S.pos;
  p[o]=x0+nx;p[o+1]=.055;p[o+2]=z0+nz;p[o+3]=x0-nx;p[o+4]=.055;p[o+5]=z0-nz;
  p[o+6]=x1+nx;p[o+7]=.055;p[o+8]=z1+nz;p[o+9]=x1-nx;p[o+10]=.055;p[o+11]=z1-nz;
  S.mesh.geometry.attributes.position.needsUpdate=true;S.mesh.visible=true}

/* ---- the car model ---- */
function rmDrive(s,i,thr,st,rev,dt){
  const fx=-Math.sin(s.h),fz=-Math.cos(s.h),rx=Math.cos(s.h),rz=-Math.sin(s.h);
  let vf=s.vx*fx+s.vz*fz,vr=s.vx*rx+s.vz*rz;
  const road=rmOnRoad(s.x,s.z),spd=Math.abs(vf);
  /* the wheel eases toward the button, so a tap is a nudge and a hold is a corner */
  s.sa+=(st-s.sa)*Math.min(1,dt*7);
  /* throttle: a held button or a flurry of taps becomes push; reverse is a gentle hold */
  if(rev)vf+=(-7-vf)*Math.min(1,dt*3);
  else vf+=thr*(road?22:19)*dt;
  vf-=vf*(road?.55:.85)*dt;                       /* air and sand */
  if(!thr&&!rev)vf-=Math.sign(vf)*Math.min(spd,2.5*dt); /* rolling to a stop */
  /* the tyres bleed off sideways speed; less so at pace, so a hard corner drifts */
  const grip=(s.slip>0?.8:(road?6.5:4))-2.8*Math.min(1,spd/32);
  vr*=Math.exp(-grip*dt);
  if(s.slip>0)s.slip-=dt;
  s.vx=fx*vf+rx*vr;s.vz=fz*vf+rz*vr;
  /* steering needs rolling wheels; reversing swings the tail the other way */
  s.h-=s.sa*2.5*Math.min(1,spd/8)*(vf<0?-1:1)*dt;
  s.x+=s.vx*dt;s.z+=s.vz*dt;
  /* sand off the tyres when quick on the loose stuff; rubber on the road in a slide */
  const total=Math.hypot(s.vx,s.vz);
  if(!road&&total>7){s.dustT+=dt*total;if(s.dustT>2.2){s.dustT=0;rmPuff(s,total)}}
  const sliding=(Math.abs(vr)>3.2||s.slip>0)&&total>5;
  if(sliding&&road){const bx=s.x-fx*1.05,bz=s.z-fz*1.05,lx=bx-rx*.86,lz=bz-rz*.86,rxw=bx+rx*.86,rzw=bz+rz*.86;
    if(s.wl){rmMark(s.wl[0],s.wl[1],lx,lz);rmMark(s.wr[0],s.wr[1],rxw,rzw)}
    s.wl=[lx,lz];s.wr=[rxw,rzw]}
  else s.wl=s.wr=null;
  s.lean=vr}
function rmPushCircle(s,cx,cz,r){const dx=s.x-cx,dz=s.z-cz,d=Math.hypot(dx,dz),m=r+CAR_R;
  if(d>=m)return false;const nx=d>1e-4?dx/d:1,nz=d>1e-4?dz/d:0;
  s.x=cx+nx*m;s.z=cz+nz*m;const vn=s.vx*nx+s.vz*nz;if(vn<0){s.vx-=vn*nx*1.35;s.vz-=vn*nz*1.35}return true}
function rmPushRect(s,w){const px=clamp(s.x,w.x0,w.x1),pz=clamp(s.z,w.z0,w.z1);
  let dx=s.x-px,dz=s.z-pz,d=Math.hypot(dx,dz);
  if(d>=CAR_R)return false;
  let nx,nz;
  if(d>1e-4){nx=dx/d;nz=dz/d}
  else{ /* inside the box: leave by the nearest face */
    const l=s.x-w.x0,r=w.x1-s.x,b=s.z-w.z0,t=w.z1-s.z,m=Math.min(l,r,b,t);
    nx=m===l?-1:m===r?1:0;nz=m===b?-1:m===t?1:0;d=-m}
  s.x+=nx*(CAR_R-d);s.z+=nz*(CAR_R-d);
  const vn=s.vx*nx+s.vz*nz;if(vn<0){s.vx-=vn*nx*1.35;s.vz-=vn*nz*1.35}return true}
function rmCollide(s,i,now){
  if(s.x<RM_B.x0){s.x=RM_B.x0;s.vx=Math.abs(s.vx)*.3}else if(s.x>RM_B.x1){s.x=RM_B.x1;s.vx=-Math.abs(s.vx)*.3}
  if(s.z<RM_B.z0){s.z=RM_B.z0;s.vz=Math.abs(s.vz)*.3}else if(s.z>RM_B.z1){s.z=RM_B.z1;s.vz=-Math.abs(s.vz)*.3}
  if(trackTractor.visible)rmPushCircle(s,trackTractor.position.x,trackTractor.position.z,1.7);
  for(const w of RM.walls){if(w.t==='c'){if(Math.abs(w.x-s.x)>w.r+3||Math.abs(w.z-s.z)>w.r+3)continue;rmPushCircle(s,w.x,w.z,w.r)}
    else{if(s.x<w.x0-3||s.x>w.x1+3||s.z<w.z0-3||s.z>w.z1+3)continue;rmPushRect(s,w)}}
  for(const h of RM.cones){if(h.gone)continue;const dx=s.x-h.x,dz=s.z-h.z;
    if(dx*dx+dz*dz<(h.type==='cone'?2.6:2.4)){
      if(h.type==='cone'){rmKnock(h,s,i);s.vx*=.94;s.vz*=.94}
      else if(now-s.hit>1500){s.hit=now;s.slip=.9;const rx=Math.cos(s.h),rz=-Math.sin(s.h),k=(i%2?1:-1)*7;
        s.vx+=rx*k;s.vz+=rz*k;rmFlash(rmFirst(i)+' finds the oil')}}}
  for(const c of RM.cps){const dx=s.x-c.x,dz=s.z-c.z;if(dx*dx+dz*dz<11){rmCheck(c,s,i,now);
    if(c.k===2)s.gates|=1;else if(c.k===4)s.gates|=2}}} /* both hairpins make a lap honest */

/* ---- the lap clock: the circuit is still a lap. cross the line under the
   arch heading north to start the clock, touch both hairpins, cross it again ---- */
function rmLine(s,i,now){
  if(s.lapT0!==null&&s.gates===3)rmLapDone(i,Math.round(now-s.lapT0),now);
  s.lapT0=now;s.gates=0}
function rmLapDone(i,ms,now){const e={n:people[i][1],car:i,ms};
  RM.board.push(e);RM.board.sort((a,b)=>a.ms-b.ms);RM.board=RM.board.slice(0,50);
  try{localStorage.setItem('r08-laps',JSON.stringify(RM.board))}catch(x){}
  const rank=RM.board.indexOf(e);
  rmRenderLaps(e);rmFeature(i,now);if(rank===0)sndFanfare();else sndChime(true);
  rmFlash(rank===0?rmFirst(i)+' — '+rmFmt(ms)+' — TRACK RECORD!':rmFirst(i)+' — '+rmFmt(ms));
  const c=NET.conns[i];if(c&&c.open)try{c.send({type:'lap',ms,rank:rank+1,of:RM.board.length})}catch(x){}}
function rmRenderLaps(hl){rmLapsEl.innerHTML='<div class="label">fastest laps tonight</div>'+(RM.board.slice(0,5).map((e,k)=>
  `<div class="row${e===hl?' me':''}"><b>${k+1}</b><i style="background:${people[e.car][3]}"></i>${rmEsc(e.n.split(' ')[0])}<span>${rmFmt(e.ms)}</span></div>`).join('')
  ||'<div class="row">no laps yet — be the first</div>')}
function rmClockTick(now){const f=RM.feat>=0?RM.c[RM.feat]:null;
  rmClock.textContent=f&&f.lapT0!==null?rmFmt(now-f.lapT0)+(f.gates===3?' ·':f.gates?' · far hairpin':' · town hairpin'):(f?'lap: cross the arch':'')}

function rmTick(dt,now){if(!RM.on)return;
  const K=RM.keys,keyed=K.w||K.a||K.s||K.d;
  let host=-1;for(let i=0;i<8;i++)if(!NET.conns[i]){host=i;break}
  if(keyed)RM.hostT=now;
  for(let i=0;i<8;i++){const s=RM.c[i],c=cars[i],phone=NET.conns[i];
    const human=phone||(i===host&&keyed);
    if(human&&s.ai){ /* a cruiser gets claimed: it becomes a real car where it is */
      s.ai=false;s.x=c.position.x;s.z=c.position.z;s.h=c.rotation.y;
      s.vx=-Math.sin(s.h)*15;s.vz=-Math.cos(s.h)*15}
    if(s.ai){s.prog+=15*dt;carAtC(c,s.prog,((i%3)-1)*1.6);s.x=c.position.x;s.z=c.position.z;continue}
    let thr=0,st=0,rev=0;
    if(phone){s.rate=Math.min(14,s.rate*(1-Math.min(1,dt*1.5))+RM.taps[i]*1.5);RM.taps[i]=0;
      thr=Math.max(s.rate/14,RM.gas[i]);st=NET.st[i];rev=RM.rev[i]}
    else if(i===host){thr=K.w?1:0;rev=K.s?1:0;st=(K.d?1:0)-(K.a?1:0);s.rate=0}
    else s.rate=0; /* a lost phone: the car rolls to a stop where it is */
    rmDrive(s,i,thr,st,rev,dt);
    rmCollide(s,i,now);
    if(s.pz!==null&&s.pz<-700&&s.z>=-700&&Math.abs(s.x)<5.2)rmLine(s,i,now);
    s.pz=s.z}
  /* car on car: equal weights, a bit of bounce; cruisers are immovable */
  for(let a=0;a<8;a++){const p=RM.c[a];if(p.ai)continue;
    for(let b=0;b<8;b++){if(b===a)continue;const q=RM.c[b];if(q.ai){rmPushCircle(p,q.x,q.z,CAR_R);continue}
      if(b<a)continue;
      const dx=p.x-q.x,dz=p.z-q.z,d=Math.hypot(dx,dz);if(d>=CAR_R*2||d<1e-4)continue;
      const nx=dx/d,nz=dz/d,ov=(CAR_R*2-d)/2;p.x+=nx*ov;p.z+=nz*ov;q.x-=nx*ov;q.z-=nz*ov;
      const vn=(p.vx-q.vx)*nx+(p.vz-q.vz)*nz;
      if(vn<0){const j=-(1+.45)*vn/2;p.vx+=j*nx;p.vz+=j*nz;q.vx-=j*nx;q.vz-=j*nz;
        if(-vn>10&&now-RM.cutT>2500){rmFeature(a,now);sndCrunch();rmFlash(rmFirst(a)+' and '+rmFirst(b)+' — PILE-UP!')}}}}
  RM.c.forEach((s,i)=>{if(s.ai)return;const c=cars[i];c.position.set(s.x,0,s.z);c.rotation.y=s.h;
    c.rotation.z=s.lean*.004}); /* lean into the slide */
  rmDustTick(dt);rmClockTick(now);rmEventsTick(now);
  RM.cps.forEach((c,k)=>{c.beam.material.opacity=.45+Math.sin(now/500+k)*.12});
  if(now-RM.boardT>500){RM.boardT=now;rmRenderBoard()}
  rmDrawMap()}

/* the director: follow one driver at a time, hop to the next every few
   seconds or straight to whoever just made a mess. a long hop is a hard
   cut, a short one glides. nobody driving yet: a slow circle over the infield */
const _rm_hum=[];
function rmHumans(){_rm_hum.length=0;for(let i=0;i<8;i++){const s=RM.c[i];if(!s||s.ai)continue;
  if(NET.conns[i]||(performance.now()-RM.hostT<30000))_rm_hum.push(i)}return _rm_hum}
function rmCam(t,dt,now){const hum=rmHumans();
  let tx,ty,tz,lx,ly,lz;
  if(!hum.length){RM.feat=-1;const a=t*.07;tx=40+Math.cos(a)*78;ty=15;tz=-885+Math.sin(a)*78;lx=40;ly=0;lz=-885}
  else{if(!hum.includes(RM.feat)||now-RM.featT>11000){RM.feat=hum[(hum.indexOf(RM.feat)+1)%hum.length];RM.featT=now;RM.snap=true}
    const s=RM.c[RM.feat],spd=Math.hypot(s.vx,s.vz);
    /* look where the car is going, not only where it points, so a slide reads */
    let fx=-Math.sin(s.h),fz=-Math.cos(s.h);
    if(spd>4){const k=Math.min(.6,spd/40),vf=s.vx*fx+s.vz*fz;if(vf>0){fx=fx*(1-k)+s.vx/spd*k;fz=fz*(1-k)+s.vz/spd*k;const n=Math.hypot(fx,fz);fx/=n;fz/=n}}
    const back=7+spd*.06;
    tx=s.x-fx*back;ty=2.9+spd*.02;tz=s.z-fz*back;lx=s.x+fx*7;ly=.8;lz=s.z+fz*7}
  if(RM.snap){RM.snap=false;
    if(Math.hypot(tx-RM.camP.x,tz-RM.camP.z)>60){RM.camP.set(tx,ty,tz);RM.camL.set(lx,ly,lz)}}
  const k=Math.min(1,dt*(hum.length?5:1.2)),kl=Math.min(1,dt*(hum.length?8:1.5));
  RM.camP.x+=(tx-RM.camP.x)*k;RM.camP.y+=(ty-RM.camP.y)*k;RM.camP.z+=(tz-RM.camP.z)*k;
  RM.camL.x+=(lx-RM.camL.x)*kl;RM.camL.y+=(ly-RM.camL.y)*kl;RM.camL.z+=(lz-RM.camL.z)*kl;
  camera.position.copy(RM.camP);camera.position.x+=Math.sin(t*1.7)*.03;camera.position.y+=Math.sin(t*9.3)*.02;
  camera.lookAt(RM.camL);
  /* the real headlight rides with the featured car */
  const f=RM.feat>=0?RM.c[RM.feat]:null;
  if(f){head.position.set(f.x,.75,f.z);head.target.position.set(f.x-Math.sin(f.h)*38,-.2,f.z-Math.cos(f.h)*38)}
  else{head.position.copy(RM.camP);head.target.position.copy(RM.camL)}
  return RM.camP.z}
function rmSpeed(){const f=RM.feat>=0?RM.c[RM.feat]:null;return f?Math.hypot(f.vx,f.vz):18}

/* ---- on screen: the board and the map ---- */
function rmRenderBoard(){const hum=rmHumans().slice().sort((a,b)=>(RM.knocks[b]+RM.checks[b].size*3)-(RM.knocks[a]+RM.checks[a].size*3));
  rmRows.innerHTML=hum.map((i,k)=>`<div class="row${i===RM.feat?' me':''}"><b>${k+1}</b><i style="background:${people[i][3]}"></i>${rmFirst(i)}<span>${RM.knocks[i]} · ${RM.checks[i].size}/${RM.cps.length}</span></div>`).join('')
    ||'<div class="row">nobody on the sand yet — scan the code</div>'}
const RM_MW=360,RM_MH=124;
const rmMX=z=>(RM_B.z1-z)/(RM_B.z1-RM_B.z0)*RM_MW,rmMY=x=>(x-RM_B.x0)/(RM_B.x1-RM_B.x0)*RM_MH;
function rmDrawMapBg(){const c=document.createElement('canvas');c.width=RM_MW;c.height=RM_MH;const x=c.getContext('2d');
  x.fillStyle='rgba(4,5,16,.78)';x.fillRect(0,0,RM_MW,RM_MH);
  x.strokeStyle='rgba(243,231,207,.55)';x.lineWidth=2.2;x.lineCap='round';x.lineJoin='round';
  const path=(fn,L)=>{x.beginPath();const p={};for(let s=0;s<=L;s+=4){fn(s,p);const px=rmMX(p.z),py=rmMY(p.x);s?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()};
  x.beginPath();x.moveTo(rmMX(RM_B.z1),rmMY(0));x.lineTo(rmMX(RM_B.z0),rmMY(0));x.stroke();
  path(circuitPos,CIRCUIT.L);path(trackPos,TRACK.L);
  x.fillStyle='rgba(243,231,207,.22)';
  LOTS.forEach(([z,w,side])=>{const cx=side*(9.5+w/2);x.fillRect(rmMX(z+4),rmMY(cx-w/2),Math.max(1.5,rmMX(z-4)-rmMX(z+4)),Math.max(1.5,rmMY(cx+w/2)-rmMY(cx-w/2)))});
  x.fillStyle='rgba(245,179,53,.7)';
  RM.cones.forEach(h=>{if(h.type==='cone'){x.fillRect(rmMX(h.z)-1,rmMY(h.x)-1,2,2)}});
  x.lineWidth=1.8;
  RM.cps.forEach(c=>{x.strokeStyle=people[c.k][3];x.beginPath();x.arc(rmMX(c.z),rmMY(c.x),4,0,7);x.stroke()});
  RM.mapBg=c;rmMap.width=RM_MW;rmMap.height=RM_MH}
function rmDrawMap(){const x=rmMap.getContext('2d');x.clearRect(0,0,RM_MW,RM_MH);x.drawImage(RM.mapBg,0,0);
  RM.c.forEach((s,i)=>{const px=rmMX(s.z),py=rmMY(s.x);
    x.fillStyle=people[i][3];x.globalAlpha=s.ai?.45:1;
    x.beginPath();x.arc(px,py,s.ai?2.6:4,0,7);x.fill();
    if(i===RM.feat){x.strokeStyle='#F3E7CF';x.lineWidth=1.6;x.beginPath();x.arc(px,py,6.5,0,7);x.stroke()}});
  x.globalAlpha=1}
