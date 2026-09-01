/* ======================= world ======================= */
const stage=document.getElementById('stage'),canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();
const HORIZON=0x0a0d24;scene.fog=new THREE.Fog(HORIZON,25,230);scene.background=new THREE.Color(HORIZON);
const camera=new THREE.PerspectiveCamera(58,2.35,.1,1400);camera.position.set(0,1.25,0);
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

/* sky dome, follows the car */
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,fog:false,depthWrite:false,
  uniforms:{h:{value:new THREE.Color(HORIZON)},z:{value:new THREE.Color(0x04051a)}},
  vertexShader:'varying float vy;void main(){vy=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 h;uniform vec3 z;varying float vy;void main(){float t=smoothstep(-40.,260.,vy);gl_FragColor=vec4(mix(h,z,t),1.);}'}));
scene.add(sky);
/* stars */
let starsM;
{const n=900,a=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()*.8+.1);a[i*3]=800*Math.sin(ph)*Math.cos(th);a[i*3+1]=800*Math.cos(ph);a[i*3+2]=800*Math.sin(ph)*Math.sin(th)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xF3E7CF,size:2.2,sizeAttenuation:false,transparent:true,opacity:.7,fog:false}));starsM=stars.material;sky.add(stars)}
/* the sun, rides with the sky dome */
const sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTexture(),transparent:true,opacity:0,fog:false,depthWrite:false}));
sunSprite.scale.set(200,200,1);sunSprite.position.set(330,250,-640);sky.add(sunSprite);
const sunL=new THREE.DirectionalLight(0xffe9c4,0);sunL.position.set(40,70,20);scene.add(sunL);
/* mesa skyline layers on the horizon, following the car. they render only
   when assets/mesa-far.png / assets/mesa-near.png are supplied — the GLB
   scenery dresses the desert on its own otherwise */
const mesaFarT=assetTex('mesa-far'),mesaNearT=assetTex('mesa-near');
const mesaFar=new THREE.Mesh(new THREE.PlaneGeometry(1600,200),new THREE.MeshBasicMaterial({map:mesaFarT,transparent:true,fog:false,depthWrite:false}));
mesaFar.visible=!!mesaFarT;mesaFar.position.set(0,82,-540);scene.add(mesaFar);
const mesaNear=new THREE.Mesh(new THREE.PlaneGeometry(1300,162),new THREE.MeshBasicMaterial({map:mesaNearT,transparent:true,fog:false,depthWrite:false}));
mesaNear.visible=!!mesaNearT;mesaNear.position.set(0,64,-450);scene.add(mesaNear);
/* painted clouds, ride with the sky dome */
const cloudTex=assetTex('cloud')||cloudTexture();
const dayClouds=[[-620,300,-520,300],[-260,340,-620,360],[90,310,-660,320],[430,280,-560,380],[700,250,-420,300],[-450,220,-380,240],[260,370,-700,420]].map(([x,y,z,w])=>{
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:0,fog:false,depthWrite:false}));
  s.scale.set(w,w*.42,1);s.position.set(x,y,z);sky.add(s);return s});

/* ground + road, long enough to reach past the speedway finish */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,1900),new THREE.MeshLambertMaterial({color:0x3a2f2a}));ground.rotation.x=-Math.PI/2;ground.position.z=-780;scene.add(ground);
const roadTex=roadTexture();roadTex.repeat.set(1,142);
const road=new THREE.Mesh(new THREE.PlaneGeometry(9.5,1700),new THREE.MeshLambertMaterial({map:roadTex}));road.rotation.x=-Math.PI/2;road.position.set(0,.02,-690);scene.add(road);
const grid=new THREE.Mesh(new THREE.PlaneGeometry(9.5,38),new THREE.MeshBasicMaterial({map:gridTexture(),transparent:true}));grid.rotation.x=-Math.PI/2;grid.position.set(0,.04,-22);scene.add(grid);

/* lighting */
const amb=new THREE.AmbientLight(0x2a2f55,.35);scene.add(amb);
const head=new THREE.SpotLight(0xffe4b8,0,110,.55,.75,1);head.position.set(0,.7,.5);scene.add(head);scene.add(head.target);
const dark=new THREE.MeshLambertMaterial({color:0x0b0c16});

/* everything that only glows after dark registers here; setNight() scales it */
const nightGlows=[],nightLights=[];
const glowAtNight=(s,base)=>{s.userData.base=base;nightGlows.push(s);return s};
const lightAtNight=(l,base)=>{l.userData.base=base;nightLights.push(l);return l};

/* speedway dressing at the start grid */
const floodTex=glowTexture('rgb(243,231,207)');
[[-13,-10],[13,-10],[-13,-44],[13,-44]].forEach(([x,z],i)=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,18,8),dark);p.position.set(x,9,z);scene.add(p);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:floodTex,transparent:true,opacity:.95,depthWrite:false}));s.scale.set(7,7,1);s.position.set(x,18.3,z);scene.add(glowAtNight(s,.95));
  if(i<2){const l=new THREE.PointLight(0xf3e7cf,1.3,80,1);l.position.set(x*.6,16,z);scene.add(lightAtNight(l,1.3))}});
const standM=new THREE.MeshLambertMaterial({map:standTexture()});
[-30,30].forEach(x=>{const st=new THREE.Mesh(new THREE.BoxGeometry(8,5,60),standM);st.position.set(x,2.5,-25);scene.add(st)});

/* the eight cars: low-poly 3D models built from boxes, one per person.
   drop assets/car-<number>.png (rear view, transparent or magenta background)
   to use a drawn cutout instead — or later, swap buildCar for a Meshy GLB */
function setCarO(g,v){g.userData.mats.forEach(m=>m.opacity=v);g.visible=v>.01}
function carO(g){return g.visible?g.userData.mats[0].opacity:0}
function buildCar(color,num){const g=new THREE.Group(),mats=[];
  const M=c=>{const m=new THREE.MeshLambertMaterial({color:c,transparent:true});mats.push(m);return m};
  const B=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o};
  const body=M(color),darkM=M(0x10131f),glass=M(0x1a2340);
  B(1.7,.5,3.1,body,0,.62,0);
  B(1.75,.22,3.15,darkM,0,.32,0);
  B(1.36,.5,1.6,body,0,1.06,.15);
  B(1.38,.34,1.7,glass,0,1.08,.15);
  const wg=new THREE.CylinderGeometry(.4,.4,.32,14);
  [[-.86,-1.05],[.86,-1.05],[-.86,1.05],[.86,1.05]].forEach(([wx,wz])=>{const w=new THREE.Mesh(wg,darkM);w.rotation.z=Math.PI/2;w.position.set(wx,.4,wz);g.add(w)});
  const tl=M(0xE23A2E);B(.34,.13,.06,tl,-.55,.72,1.58);B(.34,.13,.06,tl,.55,.72,1.58);
  const pm=new THREE.MeshBasicMaterial({map:plateTexture(num),transparent:true});mats.push(pm);
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(.62,.62),pm);plate.position.set(0,1.02,1.62);g.add(plate);
  g.userData.mats=mats;g.userData.redraw=()=>{pm.map=plateTexture(num)};
  return g}
const carAssets=people.map(p=>assetTex('car-'+p[0]));
const cars=people.map((p,i)=>{let g;
  if(carAssets[i]){g=new THREE.Group();const s=new THREE.Sprite(new THREE.SpriteMaterial({map:carAssets[i],transparent:true}));
    s.scale.set(2.5,1.76,1);s.position.y=.9;g.add(s);g.userData.mats=[s.material]}
  else g=buildCar(p[3],p[0]);
  setCarO(g,0);g.position.set(i%2?1.9:-1.9,0,-6-i*3.6);scene.add(g);return g});

/* floating number tags so everyone can find their car on track */
function tagTexture(p){const[c,x]=cv(128,128);x.fillStyle=p[3];x.beginPath();x.arc(64,64,54,0,7);x.fill();
  x.lineWidth=8;x.strokeStyle='#F3E7CF';x.stroke();
  x.fillStyle='#0E1230';x.textAlign='center';x.textBaseline='middle';x.font='54px "Racing Sans One"';x.fillText(p[0],64,68);return tex(c)}
cars.forEach((g,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTexture(people[i]),transparent:true,depthWrite:false}));
  s.scale.set(.85,.85,1);s.position.y=2.7;s.visible=false;s.userData.isTag=true;g.add(s);g.userData.tag=s});

/* real 3D car models: any .glb named in the roster replaces the box car once
   it loads — normalized to the same footprint, box car kept on any failure */
function loadCarModel(g,file,yaw){
  loadGLB(file,gltf=>{
    const m=gltf.scene;
    m.updateMatrixWorld(true);
    const s0=new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
    if(s0.x>s0.z)m.rotation.y=Math.PI/2;         /* long axis becomes length */
    m.rotation.y+=(yaw||0)*Math.PI/2;
    m.updateMatrixWorld(true);
    const b1=new THREE.Box3().setFromObject(m);
    m.scale.setScalar(3.1/Math.max(b1.getSize(new THREE.Vector3()).z,.001));
    m.updateMatrixWorld(true);
    const b2=new THREE.Box3().setFromObject(m),c=b2.getCenter(new THREE.Vector3());
    m.position.set(-c.x,-b2.min.y,-c.z);
    const mats=[];m.traverse(o=>{if(o.isMesh)[].concat(o.material).forEach(mm=>{mm.transparent=true;mats.push(mm)})});
    const keep=carO(g);
    [...g.children].forEach(ch=>{if(!ch.userData.isTag)g.remove(ch)});
    g.add(m);g.userData.mats=mats;delete g.userData.redraw;setCarO(g,keep);
  })}
if(typeof THREE.GLTFLoader!=='undefined'&&location.protocol!=='file:')
  people.forEach((p,i)=>{if(p[4])loadCarModel(cars[i],p[4],p[5])});

/* highway dressing: poles, rocks, cacti */
for(let z=-75;z>-440;z-=24){const p=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,7.5,6),dark);p.position.set(6.6,3.75,z);scene.add(p);
  const b=new THREE.Mesh(new THREE.BoxGeometry(1.6,.12,.12),dark);b.position.set(6.6,7,z);scene.add(b)}
const rockG=new THREE.DodecahedronGeometry(1,0),rockM=new THREE.MeshLambertMaterial({color:0x1c1720});
for(let i=0;i<90;i++){const r=new THREE.Mesh(rockG,rockM);const side=Math.random()<.5?-1:1;r.position.set(side*(7+Math.random()*40),0,-50-Math.random()*400);const s=.4+Math.random()*1.6;r.scale.set(s*1.4,s*.7,s);r.rotation.y=Math.random()*3;
  if(r.position.x<0&&r.position.z<-405)r.position.x=-58-Math.random()*18; /* keep the circuit hairpin clear */
  scene.add(r)}
for(let i=0;i<22;i++){const g=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,4,7),rockM);t.position.y=2;g.add(t);
  const a=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,1.8,6),rockM);a.position.set(.6,2.6,0);g.add(a);const a2=a.clone();a2.position.set(-.55,2.2,0);a2.scale.y=.8;g.add(a2);
  const side=Math.random()<.5?-1:1;g.position.set(side*(9+Math.random()*30),0,-80-Math.random()*360);g.rotation.y=Math.random()*3;const s=.7+Math.random()*.8;g.scale.set(s,s,s);
  if(side<0&&g.position.z<-405)g.position.x=-55-Math.random()*15; /* keep the circuit hairpin clear */
  scene.add(g)}

/* exit sign */
{const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,6),dark);post.position.set(6.2,1.5,-150);scene.add(post);
  const b=new THREE.Mesh(new THREE.PlaneGeometry(3,1.5),new THREE.MeshLambertMaterial({map:exitTexture(),emissive:0x333333,emissiveMap:exitTexture()}));b.position.set(6.2,3.6,-150);b.rotation.y=-.35;scene.add(b)}

/* town glow on the horizon */
const townGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('rgb(245,179,53)'),transparent:true,opacity:0,fog:false,depthWrite:false}));townGlow.scale.set(170,60,1);townGlow.position.set(0,4,-540);scene.add(townGlow);

/* town + main street lots: warm 50s facades with glowing windows, drawn in code */
const bldM=new THREE.MeshLambertMaterial({color:0x232848});
const CLEAR=[[-1,-472,-450],[-1,-580,-560]];
const LOTS=[];
[[-455,7],[-465,10],[-477,8],[-487,6],[-498,9],[-510,7],[-520,11],[-532,8],[-545,6]].forEach(([z,w])=>{[-1,1].forEach(side=>{
  if(CLEAR.some(([cs,z0,z1])=>side===cs&&z>z0&&z<z1))return;LOTS.push([z,w,side])})});
[[-566,6],[-576,9],[-588,7],[-600,8],[-612,6],[-624,9],[-636,7]].forEach(([z,w])=>{[-1,1].forEach(side=>LOTS.push([z,w,side]))});
const facadeMats=[];
LOTS.forEach(([z,w,side])=>{
  const[mp,em]=facadeTexture(Math.abs(z)*3+(side>0?1:0));
  const fm=new THREE.MeshLambertMaterial({map:mp,emissive:0xffffff,emissiveMap:em,emissiveIntensity:1});facadeMats.push(fm);
  const h=4.5+((Math.abs(z)*13+(side>0?7:0))%25)/10;
  const bx=new THREE.Mesh(new THREE.BoxGeometry(w,h,8),[side<0?fm:bldM,side>0?fm:bldM,bldM,bldM,bldM,bldM]);
  bx.position.set(side*(9.5+w/2),h/2,z);scene.add(bx)});

/* roadside scenery models from SHOW.props, loaded like the cars */
const _propReg={};
function loadProp(p){
  loadGLB(p.file,g=>{const m=g.scene;
    const key=p.id||p.file;
    if(_propReg[key])scene.remove(_propReg[key]);_propReg[key]=m;
    m.rotation.y=(p.ry||0)*Math.PI/2;m.updateMatrixWorld(true);
    const s=new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
    m.scale.setScalar((p.size||10)/Math.max(s.x,.001));
    m.updateMatrixWorld(true);
    const b2=new THREE.Box3().setFromObject(m),c=b2.getCenter(new THREE.Vector3());
    m.position.set(p.x-c.x,-b2.min.y,p.z-c.z);scene.add(m)})}
(SHOW.props||[]).forEach(loadProp);

/* neon signs: an unlit plane, a lit plane that ignites on top, and a coloured light on the road */
const signs=[
  {t:'DINER',c:'#3EE6D8',x:-9.3,y:6.4,z:-461,font:'"Racing Sans One"',size:230,rot:.55,stage:1},
  {t:'MOTEL',c:'#FF5CA8',x:9.3,y:5.8,z:-482,font:'"Racing Sans One"',size:200,rot:-.55,stage:2},
  {t:'GAS',c:'#F5B335',x:-9.3,y:5.4,z:-503,font:'"Racing Sans One"',size:230,rot:.55,stage:3},
  {t:'GARAGE',c:'#E23A2E',x:9.3,y:4.8,z:-517,font:'"Racing Sans One"',size:170,rot:-.55,stage:3},
].map(s=>{const W=7,H=3.5;
  const off=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:signTexture(s.t,s.c,false,s.font,s.size),transparent:true}));
  const on=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:signTexture(s.t,s.c,true,s.font,s.size),transparent:true,opacity:0,fog:false,depthWrite:false}));
  [off,on].forEach((m,i)=>{m.position.set(s.x,s.y,s.z+i*.03);m.rotation.y=s.rot;scene.add(m)});
  const l=new THREE.PointLight(new THREE.Color(s.c),0,34,1);l.position.set(s.x*.7,s.y-1.5,s.z+1.5);scene.add(l);
  return{...s,off,on,light:l,lit:false}});

/* welcome sign over the road */
const boardMat=new THREE.MeshBasicMaterial({fog:false});
{const bar=new THREE.Mesh(new THREE.BoxGeometry(16,.25,.25),dark);bar.position.set(0,8.8,-560);scene.add(bar);
  [-7.6,7.6].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,9,8),dark);p.position.set(x,4.5,-560);scene.add(p)})}
const board=new THREE.Mesh(new THREE.PlaneGeometry(14.5,3.6),boardMat);boardMat.map=boardTex;board.position.set(0,6.7,-559.8);scene.add(board);
const boardLight=new THREE.PointLight(0xf3e7cf,0,40,1);boardLight.position.set(0,5,-556);scene.add(boardLight);

/* main street past the welcome board: festoon lights over the road */
const festTex=['rgb(245,179,53)','rgb(62,230,216)','rgb(255,92,168)','rgb(243,231,207)'].map(c=>glowTexture(c));
[-563,-574,-585,-618,-630].forEach(z=>{for(let i=0;i<9;i++){const x=-6+i*1.5,y=5.5-.9*(1-(x/6)*(x/6));
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:festTex[i%4],transparent:true,depthWrite:false}));
  s.scale.set(.55,.55,1);s.position.set(x,y,z);scene.add(glowAtNight(s,.95))}});
[[-576],[-606]].forEach(([z])=>{const l=new THREE.PointLight(0xf3e7cf,1.1,26,1);l.position.set(0,4.6,z);scene.add(lightAtNight(l,1.1))});

/* ======================= the speedway: a real stadium oval =======================
   two straights and two 180-degree turns. the front straight lies on the main
   road, so the arch at -700 is the track entrance. everything race-related is
   parameterized by arc length s along the centerline via trackPos(). */
const TRACK={S:250,R:40,SF:95,LAPS:2};TRACK.L=2*TRACK.S+2*Math.PI*TRACK.R;
function trackPos(s,out){out=out||{};const S=TRACK.S,R=TRACK.R,L=TRACK.L;
  const u=s<0?s:((s%L)+L)%L;
  if(u<=S){out.x=0;out.z=-760-u;out.hx=0;out.hz=-1}
  else if(u<=S+Math.PI*R){const f=(u-S)/R;
    out.x=R-R*Math.cos(f);out.z=-760-S-R*Math.sin(f);out.hx=Math.sin(f);out.hz=-Math.cos(f)}
  else if(u<=2*S+Math.PI*R){const d=u-S-Math.PI*R;
    out.x=2*R;out.z=-760-S+d;out.hx=0;out.hz=1}
  else{const f=(u-2*S-Math.PI*R)/R;
    out.x=R+R*Math.cos(f);out.z=-760+R*Math.sin(f);out.hx=-Math.sin(f);out.hz=Math.cos(f)}
  return out}
const _car_p={};
/* lat is the live lateral offset (+ = right of travel, the inside of the
   oval); omitted, it falls back to the staggered grid lanes */
function carAt(c,i,prog,lat){trackPos(prog,_car_p);
  const nx=-_car_p.hz,nz=_car_p.hx,off=lat===undefined?(i%2?1.9:-1.9):lat;
  c.position.set(_car_p.x+nx*off,0,_car_p.z+nz*off);
  c.rotation.y=Math.atan2(-_car_p.hx,-_car_p.hz)}
/* the track ribbon: shared by the oval and the midnight circuit */
function buildRibbon(fn,s0,s1,W,y){const pts=[],uvs=[],idx=[],p={},steps=Math.max(24,Math.round((s1-s0)/2.2));
  for(let i=0;i<=steps;i++){const s=s0+(s1-s0)*i/steps;fn(s,p);
    const nx=-p.hz,nz=p.hx;
    pts.push(p.x+nx*W,y,p.z+nz*W,p.x-nx*W,y,p.z-nz*W);
    const v=s/12;uvs.push(0,v,1,v);
    if(i<steps){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(idx);g.computeVertexNormals();
  const ringTex=roadTex.clone();ringTex.needsUpdate=true;ringTex.repeat.set(1,1);
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:ringTex,side:THREE.DoubleSide}));scene.add(m);return m}
buildRibbon(trackPos,0,TRACK.L,4.75,.035);
/* entrance arch, start/finish line and banner, pit wall, stands, floods */
[-7.4,7.4].forEach(px=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,8.2,8),dark);p.position.set(px,4.1,-700);scene.add(p)});
const archM=new THREE.Mesh(new THREE.PlaneGeometry(14,3.5),new THREE.MeshBasicMaterial({map:archTexture(),transparent:true}));
archM.position.set(0,6.6,-700);scene.add(archM);
{const sf=new THREE.Mesh(new THREE.PlaneGeometry(9.5,2.4),new THREE.MeshBasicMaterial({map:checkerTexture()}));
  sf.rotation.x=-Math.PI/2;sf.position.set(0,.045,-855);scene.add(sf)}
[-6.6,6.6].forEach(px=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,7,8),dark);p.position.set(px,3.5,-855);scene.add(p)});
{const f=new THREE.Mesh(new THREE.PlaneGeometry(12.6,2.1),new THREE.MeshBasicMaterial({map:checkerTexture()}));f.position.set(0,5.6,-855);scene.add(f)}
{const w=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,140),new THREE.MeshLambertMaterial({color:0xd9d2c0}));w.position.set(6.1,.45,-855);scene.add(w)}
[[-27,-885,240],[107,-885,240]].forEach(([sx,sz,ln])=>{const st=new THREE.Mesh(new THREE.BoxGeometry(10,5.5,ln),standM);st.position.set(sx,2.75,sz);scene.add(st);
  const crowd=new THREE.Sprite(new THREE.SpriteMaterial({map:floodTex,transparent:true,opacity:.16,depthWrite:false}));crowd.scale.set(120,14,1);crowd.position.set(sx,8.5,sz);scene.add(glowAtNight(crowd,.16))});
[[-13,-780],[-13,-985],[93,-780],[93,-985]].forEach(([px,pz],i)=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,18,8),dark);p.position.set(px,9,pz);scene.add(p);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:floodTex,transparent:true,opacity:.95,depthWrite:false}));s.scale.set(7,7,1);s.position.set(px,18.3,pz);scene.add(glowAtNight(s,.95));
  if(i%2===0){const l=new THREE.PointLight(0xf3e7cf,1.2,90,1);l.position.set(px*.5,16,pz);scene.add(lightAtNight(l,1.2))}});

/* tractors: 3D, they amble across the road mid-introductions.
   drop assets/tractor.png (side view, facing right) to use a cutout instead */
function buildTractor(){const g=new THREE.Group(),mats=[];
  const M=c=>{const m=new THREE.MeshLambertMaterial({color:c,transparent:true});mats.push(m);return m};
  const B=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o};
  const green=M(0x6CC04A),darkM=M(0x10131f),grey=M(0x333a55);
  B(1.1,.7,2.4,green,0,1.05,.1);
  B(1,.8,1,green,0,1.78,.6);
  B(1.04,.4,.72,M(0x1a2340),0,1.84,.6);
  B(.12,.9,.12,grey,.35,1.9,-.6);B(.2,.1,.2,grey,.35,2.38,-.6);
  const rw=new THREE.CylinderGeometry(.75,.75,.4,14),fw=new THREE.CylinderGeometry(.38,.38,.3,12);
  [[-.66,.8],[.66,.8]].forEach(([wx,wz])=>{const w=new THREE.Mesh(rw,darkM);w.rotation.z=Math.PI/2;w.position.set(wx,.75,wz);g.add(w)});
  [[-.58,-.85],[.58,-.85]].forEach(([wx,wz])=>{const w=new THREE.Mesh(fw,darkM);w.rotation.z=Math.PI/2;w.position.set(wx,.38,wz);g.add(w)});
  g.userData.mats=mats;return g}
const trAsset=assetTex('tractor');
const tractors=[0,1].map(i=>{let g;
  if(trAsset){g=new THREE.Group();const s=new THREE.Sprite(new THREE.SpriteMaterial({map:trAsset,transparent:true}));
    s.scale.set(3.4,2.65,1);s.position.y=1.15;g.add(s);g.userData.mats=[s.material]}
  else{g=buildTractor();g.rotation.y=-Math.PI/2}
  g.position.set(-34,0,-578.5-i*2.2);scene.add(g);return g});
/* a third tractor for the speedway: it wanders across the back straight on
   the final lap (netTick drives it) */
const trackTractor=(()=>{let g;
  if(trAsset){g=new THREE.Group();const s=new THREE.Sprite(new THREE.SpriteMaterial({map:trAsset,transparent:true}));
    s.scale.set(3.4,2.65,1);s.position.y=1.15;g.add(s);g.userData.mats=[s.material]}
  else g=buildTractor();
  g.visible=false;scene.add(g);return g})();

/* ======================= the midnight circuit =======================
   the big lap for the post-credits time trial: north up main street and
   through the town, a hairpin past the last shopfront, a long back road
   behind the west grandstand with a proper chicane each way, then home
   along the speedway front straight to the entrance arch — the lap line.
   built from a segment table (straights and circular arcs) integrated
   into exact start poses, so the loop closes to the millimetre and
   everything is parameterized by arc length via circuitPos(). */
const CIRCUIT={segs:[],L:0};
{const P=Math.PI,defs=[
   ['S',255],            /* main street north, under the welcome board */
   ['A',22, 1,P],        /* town hairpin */
   ['S',195],            /* back road south */
   ['A',20,-1,P/4],['A',20,1,P/4],   /* chicane out */
   ['S',190],            /* behind the west grandstand */
   ['A',20, 1,P/4],['A',20,-1,P/4],  /* chicane back */
   ['S',101.44],
   ['A',22, 1,P],        /* speedway hairpin, onto the front straight */
   ['S',288]];           /* front straight home to the arch */
 let x=0,z=-700,th=0,acc=0; /* heading h=(-sin th, cos th); th 0 points north (+z) */
 CIRCUIT.segs=defs.map(f=>{
   const arc=f[0]==='A',R=arc?f[1]:0,dir=arc?f[2]:0,len=arc?R*f[3]:f[1];
   const hx=-Math.sin(th),hz=Math.cos(th);
   const seg={arc,x,z,th,R,dir,s0:acc,s1:acc+len,cx:x-hz*R*dir,cz:z+hx*R*dir};
   if(arc){const ph=dir*f[3],c=Math.cos(ph),sn=Math.sin(ph),px=x-seg.cx,pz=z-seg.cz;
     x=seg.cx+px*c-pz*sn;z=seg.cz+px*sn+pz*c;th+=ph}
   else{x+=hx*len;z+=hz*len}
   acc+=len;return seg});
 CIRCUIT.L=acc;
 console.assert(Math.hypot(x,z+700)<.01,'circuit does not close',x,z)}
function circuitPos(s,out){out=out||{};const L=CIRCUIT.L,u=((s%L)+L)%L;
  let g=CIRCUIT.segs[CIRCUIT.segs.length-1];
  for(const q of CIRCUIT.segs){if(u<=q.s1+1e-6){g=q;break}}
  const d=u-g.s0;
  if(!g.arc){const hx=-Math.sin(g.th),hz=Math.cos(g.th);
    out.x=g.x+hx*d;out.z=g.z+hz*d;out.hx=hx;out.hz=hz;out.R=0;out.dir=0}
  else{const ph=g.dir*d/g.R,c=Math.cos(ph),sn=Math.sin(ph),px=g.x-g.cx,pz=g.z-g.cz;
    out.x=g.cx+px*c-pz*sn;out.z=g.cz+px*sn+pz*c;
    const th=g.th+ph;out.hx=-Math.sin(th);out.hz=Math.cos(th);out.R=g.R;out.dir=g.dir}
  return out}
const _cc_p={};
function carAtC(c,prog,lat){circuitPos(prog,_cc_p);
  const nx=-_cc_p.hz,nz=_cc_p.hx;
  c.position.set(_cc_p.x+nx*lat,0,_cc_p.z+nz*lat);
  c.rotation.y=Math.atan2(-_cc_p.hx,-_cc_p.hz)}
/* new pavement only where the show has none: the main street and the
   speedway front straight already carry the circuit's first and last legs */
buildRibbon(circuitPos,255,942.51,4.75,.032);
/* the lap line, under the entrance arch */
{const lp=new THREE.Mesh(new THREE.PlaneGeometry(9.5,1.2),new THREE.MeshBasicMaterial({map:checkerTexture()}));
  lp.rotation.x=-Math.PI/2;lp.position.set(0,.045,-700.2);scene.add(lp)}
/* cats-eye posts trace the new pavement through the dark */
{const p={};for(let s=262;s<940;s+=34){circuitPos(s,p);const nx=-p.hz,nz=p.hx;
  [-5.7,5.7].forEach(o=>{const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1,6),dark);
    post.position.set(p.x+nx*o,.5,p.z+nz*o);scene.add(post);
    const dot=new THREE.Sprite(new THREE.SpriteMaterial({map:festTex[3],transparent:true,depthWrite:false}));
    dot.scale.set(.5,.5,1);dot.position.set(p.x+nx*o,1.05,p.z+nz*o);scene.add(glowAtNight(dot,.7))})}}
/* corner floods at the two hairpins, planted on the infield clear of the racing line */
[290,905].forEach(s=>{const q=circuitPos(s,{}),nx=-q.hz,nz=q.hx,px=q.x+nx*9,pz=q.z+nz*9;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,16,8),dark);pole.position.set(px,8,pz);scene.add(pole);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:floodTex,transparent:true,opacity:.95,depthWrite:false}));
  gl.scale.set(6,6,1);gl.position.set(px,16.4,pz);scene.add(glowAtNight(gl,.95));
  const l=new THREE.PointLight(0xf3e7cf,0,60,1);l.position.set(px,14,pz);scene.add(lightAtNight(l,1.2))});

/* ======================= time of day ======================= */
/* 0 = cars-country daylight, 1 = full night; beats carry a night value */
const PD={h:new THREE.Color(0xEFE6D8),z:new THREE.Color(0x2E66C9),ground:new THREE.Color(0xD9B078),
  amb:new THREE.Color(0xFFF2DC),dark:new THREE.Color(0x54483E),bld:new THREE.Color(0xB98E67),rock:new THREE.Color(0x9C6B45),car:new THREE.Color(0xffffff)};
const PN={h:new THREE.Color(0x0a0d24),z:new THREE.Color(0x04051a),ground:new THREE.Color(0x3a2f2a),
  amb:new THREE.Color(0x2a2f55),dark:new THREE.Color(0x0b0c16),bld:new THREE.Color(0x171b36),rock:new THREE.Color(0x1c1720),car:new THREE.Color(0xd9d9d9)};
const MESA_NIGHT_FAR=new THREE.Color(0x14172f),MESA_NIGHT_NEAR=new THREE.Color(0x0c0e22),WHITE=new THREE.Color(0xffffff);
let nightT=1;
function setNight(t){nightT=t;
  sky.material.uniforms.h.value.copy(PD.h).lerp(PN.h,t);
  sky.material.uniforms.z.value.copy(PD.z).lerp(PN.z,t);
  scene.fog.color.copy(PD.h).lerp(PN.h,t);scene.background.copy(scene.fog.color);
  scene.fog.near=30+(25-30)*t;scene.fog.far=620+(230-620)*t;
  ground.material.color.copy(PD.ground).lerp(PN.ground,t);
  mesaFar.material.color.copy(WHITE).lerp(MESA_NIGHT_FAR,t);
  mesaNear.material.color.copy(WHITE).lerp(MESA_NIGHT_NEAR,t);
  amb.color.copy(PD.amb).lerp(PN.amb,t);amb.intensity=1+(.35-1)*t;
  dark.color.copy(PD.dark).lerp(PN.dark,t);
  bldM.color.copy(PD.bld).lerp(PN.bld,t);
  rockM.color.copy(PD.rock).lerp(PN.rock,t);
  standM.color.copy(WHITE).lerp(PN.amb,t);
  facadeMats.forEach(m=>m.emissiveIntensity=.12+.88*t); /* windows glow after dark */
  starsM.opacity=.7*t;
  dayClouds.forEach(c=>c.material.opacity=Math.max(0,1-t*1.15)*.92);
  sunSprite.material.opacity=Math.max(0,1-t*1.25)*.95;sunL.intensity=1.05*(1-t);
  nightGlows.forEach(g=>g.material.opacity=g.userData.base*t);
  nightLights.forEach(l=>l.intensity=l.userData.base*t)}
setNight(.08);
