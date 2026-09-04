/* ======================= sound: synthesized, no files =======================
   an engine that follows the speed, a thud for a cone, a crunch for a
   pile-up, a chime for a checkpoint or a lap, a horn for last call. all
   WebAudio, built at the first key press (the same gesture that starts the
   show), so nothing is loaded and nothing can fail to arrive. M mutes. */
const SND={ctx:null,master:null,eng:null,muted:false,voice:-2};
/* one voice per roster slot, in roster order: pitch, two waveforms and their
   mix, filter bite, and a chug (lfo) for the old timers. McQueen screams,
   The King rumbles, Lizzie putters, Mater rattles, Ramone bounces */
const VOICES=[
  {p:1.3,a:'sawtooth',b:'square',mix:.3,q:3,lfo:0},
  {p:1.1,a:'triangle',b:'sawtooth',mix:.5,q:1.5,lfo:0},
  {p:.78,a:'square',b:'sawtooth',mix:.6,q:2,lfo:0},
  {p:.7,a:'square',b:'square',mix:.4,q:2,lfo:9,depth:.6},
  {p:1.15,a:'sawtooth',b:'sawtooth',mix:.5,q:5,lfo:0},
  {p:.85,a:'square',b:'sawtooth',mix:.5,q:2,lfo:14,depth:.5},
  {p:.9,a:'sawtooth',b:'square',mix:.5,q:2.5,lfo:0},
  {p:.95,a:'square',b:'triangle',mix:.5,q:1.5,lfo:5,depth:.35}];
const VOICE_PLAIN={p:1,a:'sawtooth',b:'square',mix:.35,q:2,lfo:0};
const voiceOf=i=>i>=0?VOICES[i%VOICES.length]:VOICE_PLAIN;
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
    /* a chug: a slow square wobbling the gate, silent unless the voice asks */
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.type='square';lfo.frequency.value=6;lg.gain.value=0;
    lfo.connect(lg);lg.connect(g.gain);lfo.start();
    SND.eng={g,f,o1,o2,o2g,lfo,lg,p:1};
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ctx.state==='suspended')ctx.resume().catch(()=>{})});
  }catch(e){SND.ctx=null}}
function sndVoice(i){const e=SND.eng;if(!e||SND.voice===i)return;SND.voice=i;const v=voiceOf(i);
  e.o1.type=v.a;e.o2.type=v.b;e.o2g.gain.value=v.mix;e.f.Q.value=v.q;e.p=v.p;
  e.lfo.frequency.value=v.lfo||6;e.lg.gain.setTargetAtTime(v.lfo?.05*(v.depth||.5):0,SND.ctx.currentTime,.1)}
function sndEngine(spd,on,i){const e=SND.eng;if(!e)return;const t=SND.ctx.currentTime,k=Math.min(1,spd/40);
  sndVoice(i===undefined?-1:i);
  e.g.gain.setTargetAtTime(on?.05+.09*k:0,t,.12);
  const f=(42+k*95)*e.p;e.o1.frequency.setTargetAtTime(f,t,.15);e.o2.frequency.setTargetAtTime(f*1.01+.6,t,.15);
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
function sndRev(dur,i){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime,d=dur||2.4,v=voiceOf(i===undefined?-1:i);
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),o2g=ctx.createGain();
  o.type=v.a;o2.type=v.b;f.type='lowpass';f.Q.value=v.q;o2g.gain.value=v.mix;
  [[o,48,150,40],[o2,48.6,151,40.5]].forEach(([osc,a,b,c])=>{osc.frequency.setValueAtTime(a*v.p,t);
    osc.frequency.exponentialRampToValueAtTime(b*v.p,t+d*.55);osc.frequency.exponentialRampToValueAtTime(c*v.p,t+d)});
  f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(1400,t+d*.55);f.frequency.exponentialRampToValueAtTime(250,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.25);g.gain.setValueAtTime(.16,t+d*.6);g.gain.linearRampToValueAtTime(0,t+d);
  if(v.lfo){const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.type='square';lfo.frequency.value=v.lfo;lg.gain.value=.08*(v.depth||.5);
    lfo.connect(lg);lg.connect(g.gain);lfo.start(t);lfo.stop(t+d+.1)}
  o.connect(f);o2.connect(o2g);o2g.connect(f);f.connect(g);g.connect(SND.master);
  o.start(t);o2.start(t);o.stop(t+d+.1);o2.stop(t+d+.1)}
/* a friendly hello: two short notes in the car's own pitch; the old timers go ahooga */
function sndToot(i){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime,v=voiceOf(i===undefined?-1:i);
  if(v.lfo&&v.p<.9){sndTone(440,t,.32,.22,'square');sndTone(330,t+.2,.42,.22,'square');return}
  sndTone(523*v.p,t,.14,.22,'square');sndTone(659*v.p,t+.17,.2,.22,'square')}
/* the tractors: a diesel chug that fades in, holds, and wanders off */
function sndPutt(dur,vol){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime,d=dur||4,vv=vol||.14;
  const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
  o.type='square';o.frequency.value=46;f.type='lowpass';f.frequency.value=420;f.Q.value=4;
  lfo.type='square';lfo.frequency.value=6.5;lg.gain.value=vv*.9;lfo.connect(lg);lg.connect(g.gain);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vv,t+.8);g.gain.setValueAtTime(vv,t+Math.max(.8,d-2.5));g.gain.linearRampToValueAtTime(0,t+d);
  o.connect(f);f.connect(g);g.connect(SND.master);o.start(t);lfo.start(t);o.stop(t+d+.1);lfo.stop(t+d+.1)}
/* tractors are cows: honk at one and it moos */
function sndMoo(){const ctx=SND.ctx;if(!ctx)return;const t=ctx.currentTime;
  const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),vib=ctx.createOscillator(),vg=ctx.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(230,t+.2);o.frequency.exponentialRampToValueAtTime(120,t+.9);
  vib.frequency.value=6;vg.gain.value=8;vib.connect(vg);vg.connect(o.frequency);
  f.type='lowpass';f.frequency.value=700;f.Q.value=2;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.25,t+.08);g.gain.setValueAtTime(.25,t+.55);g.gain.linearRampToValueAtTime(0,t+.95);
  o.connect(f);f.connect(g);g.connect(SND.master);o.start(t);vib.start(t);o.stop(t+1);vib.stop(t+1)}
function sndMute(){SND.muted=!SND.muted;
  if(SND.master)SND.master.gain.setTargetAtTime(SND.muted?0:.7,SND.ctx.currentTime,.05);return SND.muted}
