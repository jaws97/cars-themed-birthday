/* ======================= tiny tween engine ======================= */
const tweens=[];
const ease={inout:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out:t=>1-Math.pow(1-t,3),lin:t=>t};
function tween(set,from,to,dur,fn=ease.inout,curve=null,tag=null){if(tag)kill(tag);tweens.push({set,from,to,dur,fn,curve,tag,t0:performance.now()})}
function kill(tag){for(let i=tweens.length-1;i>=0;i--)if(tweens[i].tag===tag)tweens.splice(i,1)}
function runTweens(now){for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];let p=Math.min(1,(now-w.t0)/w.dur);const v=w.curve?w.curve(p):w.from+(w.to-w.from)*w.fn(p);w.set(v);if(p>=1)tweens.splice(i,1)}}
/* neon ignition curve: stutter then hold */
const ignite=p=>{const k=[[0,0],[.14,.9],[.22,.2],[.38,1],[.46,.5],[.6,1],[1,1]];for(let i=1;i<k.length;i++){if(p<=k[i][0]){const a=k[i-1],b=k[i];return a[1]+(b[1]-a[1])*((p-a[0])/(b[0]-a[0]))}}return 1};
