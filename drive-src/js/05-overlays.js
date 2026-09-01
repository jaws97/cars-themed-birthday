/* ======================= dashboard ======================= */
const ticks=document.getElementById('ticks');
for(let i=0;i<=12;i++){const a=(-120+i*20)*Math.PI/180,big=i%3===0,r1=big?36:39,r2=43,col=i>=11?'#E23A2E':'#F3E7CF';
  ticks.insertAdjacentHTML('beforeend',`<line x1="${50+r1*Math.sin(a)}" y1="${56-r1*Math.cos(a)}" x2="${50+r2*Math.sin(a)}" y2="${56-r2*Math.cos(a)}" stroke="${col}" stroke-opacity="${big?.9:.5}" stroke-width="${big?1.6:1}"/>`)}
['d1','d2'].forEach(id=>{document.getElementById(id).innerHTML=[0,1,2,3,4,5,6,7,8,9].map(n=>`<span>${n}</span>`).join('')});
function odo(m){d1.style.transform=`translateY(${-Math.floor(m/10)*2.6}cqh)`;d2.style.transform=`translateY(${-(m%10)*2.6}cqh)`}
let needleDeg=-120;

/* ======================= overlay content: photo, confetti, credits ======================= */
document.getElementById('fin').innerHTML=people.map(p=>`<div class="p"><span class="n" style="background:${p[3]}">${p[0]}</span><span class="who">${p[1]}<small>${p[2]}</small></span></div>`).join('');
{const cols=['#3EE6D8','#FF5CA8','#E23A2E','#F5B335','#F3E7CF'];
 document.getElementById('confetti').innerHTML=Array.from({length:90},(_,i)=>`<i style="left:${(i*37)%100}%;background:${cols[i%5]};width:${(.7+(i%5)*.2).toFixed(2)}cqh;height:${(1+(i%4)*.35).toFixed(2)}cqh;animation-duration:${(2.6+(i%7)*.5).toFixed(2)}s;animation-delay:${(-(i%11)*.6).toFixed(2)}s"></i>`).join('')}
rollEl.innerHTML=
  `<div><div class="hero" style="font-size:7cqh">ROUTE 08</div><div class="label" style="margin-top:1cqh">the august detour</div></div><div class="gap"></div>`
  +(SHOW.credits||[]).map(([r,w])=>`<div><div class="role">${r}</div><div class="who">${w}</div></div>`).join('')
  +`<div class="gap"></div>`
  +people.map(p=>`<div><div class="role">car №${p[0]} · ${p[2]}</div><div class="who">${p[1]}</div></div>`).join('')
  +`<div class="gap"></div>
  <div><div class="role">wrong turn</div><div class="who">Recalculating…</div></div>
  <div><div class="role">neon</div><div class="who">The town, showing off</div></div>
  <div><div class="role">tractors</div><div class="who">Themselves</div></div>
  <div><div class="role">pit crew</div><div class="who">Everyone who brought cake</div></div>
  <div class="gap"></div>
  <div class="hero" style="font-size:5.4cqh;white-space:normal;max-width:70cqw;margin:0 auto;line-height:1.3">Happy birthday, August people.</div>
  <div class="gap"></div>
  <div class="label" style="opacity:.55">same road next year · press space to drive again</div>`;
function startRoll(){kill('roll');rollEl.style.transform='translateY(0)';
  const H=stageEl.clientHeight,fin=rollEl.lastElementChild,end=-(H*.5+fin.offsetTop+fin.offsetHeight*.5);
  tween(v=>rollEl.style.transform=`translateY(${v}px)`,0,end,40000,ease.lin,null,'roll')}
