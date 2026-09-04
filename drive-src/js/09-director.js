/* ======================= the race broadcast =======================
   every phone watches its own car, so the projector is free to be the
   television: a director cuts between trackside cameras in the turns, an
   onboard behind the leader, a helicopter over the pack, the trailing
   shot that keeps the whole field in frame, and a finish-line camera for
   the flag. cuts come on a rhythm and on events: a cone, the tractor, the
   final lap, the winner. */
const RD={shot:'chase',tgt:0,until:0,cutT:0,fov:58,pos:new THREE.Vector3(),look:new THREE.Vector3(),snap:true,n:0};
const RD_FIXED=['turn1','turn2','finish','tractor'];
function rdCut(shot,tgt,dur,now){
  if(shot===RD.shot&&RD_FIXED.includes(shot)){RD.until=now+dur;return} /* a fixed camera just keeps rolling */
  RD.shot=shot;RD.tgt=tgt|0;RD.until=now+dur;RD.cutT=now;RD.snap=true;RD.n++}
function rdLeader(){let best=-1,bp=-1e9;
  for(let i=0;i<8;i++){if(NET.done.includes(i))continue;if(NET.prog[i]>bp){bp=NET.prog[i];best=i}}
  return best<0?NET.done[0]:best}
function rdNearest(cx,cz){const lead=rdLeader(),c=cars[lead];
  if(Math.hypot(c.position.x-cx,c.position.z-cz)<75)return lead;
  let best=lead,bd=1e9;cars.forEach((q,i)=>{const d=Math.hypot(q.position.x-cx,q.position.z-cz);if(d<bd){bd=d;best=i}});return best}
const _rd_c={x:0,z:0};
function rdCentroid(){ /* the front of the pack: the four cars furthest round */
  const top=[...Array(8).keys()].sort((a,b)=>NET.prog[b]-NET.prog[a]).slice(0,4);
  _rd_c.x=0;_rd_c.z=0;top.forEach(i=>{_rd_c.x+=cars[i].position.x/4;_rd_c.z+=cars[i].position.z/4});return _rd_c}
function rdEvent(kind,i){const now=performance.now();
  if(kind==='green')rdCut('chase',0,5500,now);
  else if(kind==='hit'){if(now-RD.cutT>2500&&RD.shot!=='finish')rdCut('follow',i,3200,now)}
  else if(kind==='tractor')rdCut('tractor',0,6000,now);
  else if(kind==='final')rdCut('follow',rdLeader(),5000,now);
  else if(kind==='winner')rdCut('finish',i,6500,now)}
/* the rhythm: the start and the flag from fixed ideas, the turns from
   trackside, and in between onboard, helicopter, trailing */
function rdPick(now){const L=TRACK.L,S=TRACK.S,R=TRACK.R,lead=rdLeader(),u=((NET.prog[lead]%L)+L)%L;
  if(NET.phase==='set'||NET.prog[lead]<45){rdCut('chase',0,1500,now);return}
  if(NET.phase==='finished'){rdCut(RD.n%2?'heli':'finish',NET.done[0],5000,now);return}
  if(NET.prog[lead]>finishProg()-70){rdCut('finish',lead,4000,now);return}
  if(u>S-40&&u<S+Math.PI*R-10){rdCut('turn1',lead,5000,now);return}
  if(u>2*S+Math.PI*R-40||u<8){rdCut('turn2',lead,5000,now);return}
  const seq=['follow','heli','chase','follow'],s=seq[RD.n%seq.length];rdCut(s,lead,s==='heli'?7000:5500,now)}
const _rd_p={};
function rdInTurn(){const L=TRACK.L,S=TRACK.S,R=TRACK.R,u=((NET.prog[rdLeader()]%L)+L)%L;
  return (u>S-30&&u<S+Math.PI*R-10)||(u>2*S+Math.PI*R-30||u<8)}
function rdCam(t,dt,now){
  /* the leader reaching a turn is worth a cut to trackside, once the current shot has had its moment */
  if(now>RD.until||(NET.phase==='green'&&!RD_FIXED.includes(RD.shot)&&now-RD.cutT>2500&&rdInTurn()&&NET.prog[rdLeader()]<finishProg()-70))rdPick(now);
  let px,py,pz,lx,ly,lz,fov=58,k=6,kl=8;const R=TRACK.R;
  if(RD.shot==='chase'){trackPos(NET.camProg,_rd_p);px=_rd_p.x;py=1.7;pz=_rd_p.z;lx=_rd_p.x+_rd_p.hx*38;ly=.3;lz=_rd_p.z+_rd_p.hz*38;fov=60;k=10;kl=10}
  else if(RD.shot==='follow'){const c=cars[RD.tgt],fx=-Math.sin(c.rotation.y),fz=-Math.cos(c.rotation.y);
    px=c.position.x-fx*7.5;py=2.6;pz=c.position.z-fz*7.5;lx=c.position.x+fx*6;ly=.8;lz=c.position.z+fz*6;fov=62;k=7;kl=9}
  else if(RD.shot==='turn1'||RD.shot==='turn2'){const cz=RD.shot==='turn1'?-760-TRACK.S:-760,c=cars[rdNearest(R,cz)];
    px=R;py=5;pz=cz+(RD.shot==='turn1'?18:-18);lx=c.position.x;ly=.8;lz=c.position.z;fov=38;k=100;kl=3}
  else if(RD.shot==='heli'){const cen=rdCentroid();px=cen.x+18;py=34;pz=cen.z+26;lx=cen.x;ly=0;lz=cen.z;fov=50;k=1.6;kl=2}
  else if(RD.shot==='finish'){const c=cars[RD.tgt];px=-11;py=3.2;pz=-838;lx=c.position.x;ly=.7;lz=c.position.z;fov=40;k=100;kl=4}
  else{const tz=trackTractor.position.z;px=2*R+13;py=4;pz=tz+12;lx=trackTractor.position.x;ly=.8;lz=tz;fov=42;k=100;kl=4}
  if(RD.snap){RD.snap=false;RD.pos.set(px,py,pz);RD.look.set(lx,ly,lz)}
  else{const a=Math.min(1,dt*k),b=Math.min(1,dt*kl);
    RD.pos.x+=(px-RD.pos.x)*a;RD.pos.y+=(py-RD.pos.y)*a;RD.pos.z+=(pz-RD.pos.z)*a;
    RD.look.x+=(lx-RD.look.x)*b;RD.look.y+=(ly-RD.look.y)*b;RD.look.z+=(lz-RD.look.z)*b}
  RD.fov=fov;
  camera.position.copy(RD.pos);camera.position.y+=Math.sin(t*9.3)*.01;camera.lookAt(RD.look);
  /* the real headlight rides with the leader */
  const l=cars[rdLeader()];head.position.set(l.position.x,.75,l.position.z);
  head.target.position.set(l.position.x-Math.sin(l.rotation.y)*38,-.2,l.position.z-Math.cos(l.rotation.y)*38);
  return RD.pos.z}
