/* ======================= preloader: fill the tank before the show ======================= */
/* every model named in the config and the landing video download up front
   behind a pit-stop screen, so night one never pops or stutters. GLBs are
   parsed straight from the downloaded buffers (no second trip to the
   network). On file:// — or if anything fails — the show starts anyway and
   falls back exactly as before: multiplayer-style, never load-bearing. */
const PRELOAD={glb:{},videoURL:null,done:false};
{
  const SIZES=typeof ASSET_SIZES==='undefined'?{}:ASSET_SIZES; /* exact bytes, baked by build.py */
  const files=[...new Set([].concat(
    people.map(p=>p[4]).filter(Boolean),
    (SHOW.props||[]).map(p=>p.file)))];
  const media=SHOW.video?[SHOW.video]:[];
  const state=files.concat(media).map(f=>({f,got:0,total:SIZES[f]||0}));
  const lfill=document.getElementById('lfill'),lcar=document.getElementById('lcar'),ltext=document.getElementById('ltext');
  const MB=b=>(b/1048576).toFixed(1);
  function paint(){const got=state.reduce((a,s)=>a+s.got,0),total=state.reduce((a,s)=>a+s.total,0);
    const pc=total?Math.min(100,Math.round(got/total*100)):0;
    lfill.style.width=pc+'%';lcar.style.left=pc+'%';
    ltext.textContent=`fillin' her up · ${pc}% · ${MB(got)} of ${MB(total)} MB`}
  async function pull(s){const r=await fetch(encodeURI('assets/'+s.f));
    if(!r.ok)throw 0;
    s.total=s.total||+r.headers.get('Content-Length')||0;
    const rd=r.body.getReader(),chunks=[];
    for(;;){const{done,value}=await rd.read();if(done)break;chunks.push(value);s.got+=value.length;paint()}
    s.total=s.got;paint();
    const buf=new Uint8Array(s.got);let o=0;chunks.forEach(c=>{buf.set(c,o);o+=c.length});
    return buf}
  PRELOAD.ready=(location.protocol==='file:'||!window.fetch||!window.ReadableStream)
    ?Promise.resolve()
    :Promise.all(state.map((s,i)=>pull(s)
        .then(buf=>{if(i>=files.length)PRELOAD.videoURL=URL.createObjectURL(new Blob([buf],{type:'video/mp4'}));
          else PRELOAD.glb[s.f]=buf.buffer})
        .catch(()=>{s.total=s.got;paint()})));
}
/* every GLB consumer goes through here: parse the preloaded buffer, or fall
   back to a plain network load if it isn't there */
function loadGLB(file,ok){if(typeof THREE.GLTFLoader==='undefined')return;
  PRELOAD.ready.then(()=>{const buf=PRELOAD.glb[file];
    if(buf)new THREE.GLTFLoader().parse(buf,'assets/',ok,()=>{});
    else if(location.protocol!=='file:')new THREE.GLTFLoader().load('assets/'+file,ok,undefined,()=>{})})}
