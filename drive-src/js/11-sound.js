/* ======================= sound: synthesized, no files =======================
   an engine that follows the speed, a thud for a cone, a crunch for a
   pile-up, a chime for a checkpoint or a lap, a horn for last call. all
   WebAudio, built at the first key press (the same gesture that starts the
   show), so nothing is loaded and nothing can fail to arrive. M mutes. */
const SND={ctx:null,master:null,eng:null,muted:false};
function sndInit(){if(SND.ctx)return;
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const ctx=SND.ctx=new C();
    const m=SND.master=ctx.createGain();m.gain.value=.7;m.connect(ctx.destination);
    /* the engine: a saw and a square a hair apart, through a lowpass, behind a gate */
    const g=ctx.createGain();g.gain.value=0;
    const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=380;f.Q.value=2;
    const o1=ctx.createOscillator(),o2=ctx.createOscillator();o1.type='sawtooth';o2.type='square';
    o1.frequency.value=50;o2.frequency.value=50.7;
    const o2g=ctx.createGain();o2g.gain.value=.35;
    o1.connect(f);o2.connect(o2g);o2g.connect(f);f.connect(g);g.connect(m);o1.start();o2.start();
    SND.eng={g,f,o1,o2};
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ctx.state==='suspended')ctx.resume().catch(()=>{})});
  }catch(e){SND.ctx=null}}
function sndEngine(spd,on){const e=SND.eng;if(!e)return;const t=SND.ctx.currentTime,k=Math.min(1,spd/40);
  e.g.gain.setTargetAtTime(on?.05+.09*k:0,t,.12);
  const f=42+k*95;e.o1.frequency.setTargetAtTime(f,t,.15);e.o2.frequency.setTargetAtTime(f*1.01+.6,t,.15);
  e.f.frequency.setTargetAtTime(300+k*900,t,.15)}
function sndNoise(dur,fc,vol,q){const ctx=SND.ctx;if(!ctx)return;
  const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++){const e=1-i/n;d[i]=(Math.random()*2-1)*e*e}
  const s=ctx.createBufferSource();s.buffer=b;
  const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fc;f.Q.value=q||.7;
  const g=ctx.createGain();g.gain.value=vol;s.connect(f);f.connect(g);g.connect(SND.master);s.start()}
function sndThud(){sndNoise(.16,420,.9,1.2)}
function sndCrunch(){sndNoise(.45,900,1,.6)}
function sndTone(fr,t0,dur,vol,type){const ctx=SND.ctx;if(!ctx)return;
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.value=fr;
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.02);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(g);g.connect(SND.master);o.start(t0);o.stop(t0+dur+.05)}
function sndChime(high){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime,b=high?660:523;
  [b,b*1.25,b*1.5].forEach((f,i)=>sndTone(f,t+i*.09,.5,.25,'triangle'))}
function sndFanfare(){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime;
  [523,659,784,1047].forEach((f,i)=>sndTone(f,t+i*.12,.7,.3,'triangle'))}
function sndHorn(){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime;
  sndTone(392,t,.55,.35,'square');sndTone(494,t,.55,.25,'square')}
/* a car pulling in: the engine climbs, settles, and dies as it parks */
function sndRev(dur){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime,d=dur||2.4;
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),o2g=ctx.createGain();
  o.type='sawtooth';o2.type='square';f.type='lowpass';f.Q.value=3;o2g.gain.value=.35;
  [[o,48,150,40],[o2,48.6,151,40.5]].forEach(([osc,a,b,c])=>{osc.frequency.setValueAtTime(a,t);
    osc.frequency.exponentialRampToValueAtTime(b,t+d*.55);osc.frequency.exponentialRampToValueAtTime(c,t+d)});
  f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(1400,t+d*.55);f.frequency.exponentialRampToValueAtTime(250,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.25);g.gain.setValueAtTime(.16,t+d*.6);g.gain.linearRampToValueAtTime(0,t+d);
  o.connect(f);o2.connect(o2g);o2g.connect(f);f.connect(g);g.connect(SND.master);
  o.start(t);o2.start(t);o.stop(t+d+.1);o2.stop(t+d+.1)}
/* a friendly hello: two short notes, lighter than the horn */
function sndToot(){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime;sndTone(523,t,.14,.22,'square');sndTone(659,t+.17,.2,.22,'square')}
function sndMute(){SND.muted=!SND.muted;
  if(SND.master)SND.master.gain.setTargetAtTime(SND.muted?0:.7,SND.ctx.currentTime,.05);return SND.muted}
