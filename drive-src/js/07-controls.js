/* ======================= controls ======================= */
document.addEventListener('keydown',e=>{
  if(!PRELOAD.done&&e.key!=='f'&&e.key!=='F')return; /* only fullscreen works while the tank fills */
  if([' ','ArrowRight','Enter','PageDown'].includes(e.key)){e.preventDefault();advance()}
  else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(b-1,-1)}
  else if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
  else if(e.key==='b'||e.key==='B'||e.key==='.'){document.getElementById('blk').classList.toggle('on')}
  else if(e.key==='r'||e.key==='R'){kill('z');carZ=0;lastZ=0;go(0,0)}
  else if(e.key==='h'||e.key==='H'){honk()}
  else if(e.key==='m'||e.key==='M'){sndMute()}
  else if(/^[0-6]$/.test(e.key)){jumpMile(+e.key)}
  else if(/^[wasd]$/i.test(e.key)){RM.keys[e.key.toLowerCase()]=true}}); /* the projector drives a spare car on the sand */
document.addEventListener('keyup',e=>{if(/^[wasd]$/i.test(e.key))RM.keys[e.key.toLowerCase()]=false});
/* the click that focuses the window shouldn't burn a beat */
let focusT=-1e9;
window.addEventListener('focus',()=>focusT=performance.now());
document.addEventListener('click',()=>{if(!PRELOAD.done||performance.now()-focusT<400)return;advance()});
function honk(){if(RM.on)sndHorn();if(beats[b]&&beats[b].name==='tractors')tractors.forEach((tr,i)=>tween(v=>tr.position.y=Math.abs(Math.sin(v*Math.PI*2))*.35,0,1,700+(i?150:0),ease.lin,null,'honk'+i))}

/* fonts and the asset preload first, so canvas type is the real type and
   nothing pops in after the show starts */
const fontsReady=Promise.all(['"Alfa Slab One"','"Racing Sans One"','Nunito','Pacifico'].map(f=>document.fonts.load(`40px ${f}`))).catch(()=>{});
Promise.all([fontsReady,PRELOAD.ready]).then(()=>{
  /* textures were drawn at load; redraw the type now the fonts are in */
  signs.forEach(s=>{s.on.material.map=signTexture(s.t,s.c,true,s.font,s.size);s.off.material.map=signTexture(s.t,s.c,false,s.font,s.size)});
  boardTexture(0);
  archM.material.map=archTexture();
  cars.forEach(c=>{if(c.userData.redraw)c.userData.redraw()});
  /* the show starts from a real key press: browsers block unmuted autoplay
     on a fresh page, and that first gesture is what buys the attract cinema
     its sound. F stays free so fullscreen can go first. */
  const ld=document.getElementById('loader');
  ld.classList.add('ready');
  document.getElementById('ltext').textContent='start your engines · press any key';
  const begin=e=>{if(e&&(e.key==='f'||e.key==='F'))return;
    document.removeEventListener('keydown',begin);document.removeEventListener('pointerdown',begin);
    PRELOAD.done=true;ld.classList.add('off');setTimeout(()=>ld.remove(),1100);
    sndInit();go(0,0);requestAnimationFrame(frame)};
  document.addEventListener('keydown',begin);document.addEventListener('pointerdown',begin)});
