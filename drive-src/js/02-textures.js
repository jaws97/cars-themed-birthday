/* ======================= canvas-drawn textures ======================= */
/* every texture is drawn code-side so the show needs no image files;   */
/* any of these can be swapped for a loaded asset (e.g. a Meshy GLB     */
/* replaces the car sprites) without touching the show logic.           */
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')]}
function tex(c){const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t}
function roadTexture(){const[c,x]=cv(256,512);x.fillStyle='#0d0e18';x.fillRect(0,0,256,512);
  const g=x.createImageData(256,512);for(let i=0;i<g.data.length;i+=4){const n=48+Math.random()*26;g.data[i]=n;g.data[i+1]=n;g.data[i+2]=n+8;g.data[i+3]=255}x.putImageData(g,0,0);
  x.fillStyle='rgba(243,231,207,.32)';x.fillRect(10,0,5,512);x.fillRect(241,0,5,512);
  x.fillStyle='rgba(243,231,207,.55)';x.fillRect(125,60,6,200);
  const t=tex(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function gridTexture(){const[c,x]=cv(256,1024);x.strokeStyle='rgba(243,231,207,.5)';x.lineWidth=5;
  for(let i=0;i<8;i++){const col=i%2,y=40+i*118;x.strokeRect(col?142:28,y,86,92)}
  return tex(c)}
/* optional art from drive-src/assets/, embedded by build.py as data URIs.
   pure-magenta pixels (the meshy/AI cutout convention) become transparent. */
function assetTex(name){const src=typeof ASSETS!=='undefined'&&ASSETS[name];if(!src)return null;
  const t=new THREE.Texture();t.encoding=THREE.sRGBEncoding;t.anisotropy=8;t.minFilter=THREE.LinearFilter;
  const im=new Image();im.onload=()=>{const[cc,x]=cv(im.width,im.height);x.drawImage(im,0,0);
    const d=x.getImageData(0,0,im.width,im.height);let hit=false;
    for(let i=0;i<d.data.length;i+=4){if(d.data[i]>200&&d.data[i+2]>200&&d.data[i+1]<100){d.data[i+3]=0;hit=true}}
    if(hit)x.putImageData(d,0,0);
    t.image=cc;t.needsUpdate=true};
  im.src=src;return t}
function mesaTexture(near){const[c,x]=cv(2048,256);
  const g=x.createLinearGradient(0,40,0,256);g.addColorStop(0,near?'#B4653A':'#C99772');g.addColorStop(1,near?'#6E3B20':'#A9744F');x.fillStyle=g;
  x.beginPath();x.moveTo(0,256);let X=0;const base=near?110:80;
  while(X<2048){const w=140+Math.random()*260,h=base+Math.random()*(near?90:60),s=22+Math.random()*30;
    x.lineTo(X+10,256-(18+Math.random()*20));
    x.lineTo(X+s,256-h);x.lineTo(X+w-s,256-h+(Math.random()*10-5));x.lineTo(X+w,256-(14+Math.random()*20));
    X+=w+50+Math.random()*180}
  x.lineTo(2048,256);x.closePath();x.fill();
  x.globalCompositeOperation='source-atop';
  x.strokeStyle='rgba(0,0,0,.12)';x.lineWidth=3;
  for(let y=112;y<250;y+=18){x.beginPath();x.moveTo(0,y);x.lineTo(2048,y);x.stroke()}
  x.fillStyle='rgba(255,240,220,.22)';x.fillRect(0,238,2048,18);
  x.globalCompositeOperation='source-over';
  return tex(c)}
/* a warm 50s main-street facade: parapet trim, windows (some lit), storefront,
   sometimes an awning. returns [color map, emissive map] — lit windows glow */
function facadeTexture(seed){const W=256,H=320;const[c,x]=cv(W,H);const[c2,x2]=cv(W,H);
  let n=(Math.abs(seed)*16807+13)%2147483647;const R=()=>{n=(n*48271)%2147483647;return n/2147483647};
  const bases=['#B98E67','#96604C','#4E7A76','#8A6B4E','#75587B','#A56A3E','#7A8558'];
  const trims=['#F3E7CF','#3EE6D8','#F5B335','#FF5CA8'];
  const base=bases[(R()*bases.length)|0],trim=trims[(R()*trims.length)|0];
  x.fillStyle=base;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,.06)';x.fillRect(0,0,W,H/2);
  x.fillStyle=trim;x.fillRect(0,0,W,10);
  x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,10,W,6);
  x2.fillStyle='#000';x2.fillRect(0,0,W,H);
  const colsN=3+((R()*2)|0),gw=W/colsN;
  for(let r=0;r<2;r++)for(let q=0;q<colsN;q++){
    const ww=gw*.44,wh=54,wx=gw*q+(gw-ww)/2,wy=34+r*84,lit=R()<.5;
    x.fillStyle=lit?'#F2C979':'#141a30';x.fillRect(wx,wy,ww,wh);
    if(lit){const wg=x.createLinearGradient(0,wy,0,wy+wh);wg.addColorStop(0,'rgba(255,255,255,.25)');wg.addColorStop(1,'rgba(0,0,0,.15)');
      x.fillStyle=wg;x.fillRect(wx,wy,ww,wh);x2.fillStyle='#a87b2e';x2.fillRect(wx,wy,ww,wh)}
    x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=3;x.strokeRect(wx,wy,ww,wh);
    x.fillStyle='rgba(243,231,207,.4)';x.fillRect(wx-3,wy+wh,ww+6,4)}
  const gy=H-96;
  if(R()<.65){for(let a=0,i=0;a<W;a+=24,i++){x.fillStyle=i%2?'#F3E7CF':trim;x.fillRect(a,gy-24,W-a<24?W-a:24,24)}
    x.fillStyle='rgba(0,0,0,.2)';x.fillRect(0,gy,W,6)}
  x.fillStyle='#161a30';x.fillRect(14,gy,W-28,82);
  x2.fillStyle='#33280f';x2.fillRect(14,gy,W-28,82);
  x.fillStyle='#0b0d1c';x.fillRect(W/2-18,H-70,36,70);
  const gg=x.createLinearGradient(0,H-50,0,H);gg.addColorStop(0,'rgba(0,0,0,0)');gg.addColorStop(1,'rgba(0,0,0,.3)');
  x.fillStyle=gg;x.fillRect(0,H-50,W,50);
  return[tex(c),tex(c2)]}
function standTexture(){const[c,x]=cv(512,256);x.fillStyle='#5C4636';x.fillRect(0,0,512,256);
  x.fillStyle='#3E3028';x.fillRect(0,0,512,28);
  const cols=['#E23A2E','#F5B335','#3EE6D8','#FF5CA8','#F3E7CF','#6CC04A','#8E5BD6','#2E9BE0'];
  for(let r=0;r<7;r++){const y=48+r*30;x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,y+14,512,6);
    for(let i=0;i<40;i++){if(Math.random()<.8){x.fillStyle=cols[(Math.random()*8)|0];x.beginPath();x.arc(8+i*12.6,y+(Math.random()*6-3),5,0,7);x.fill()}}}
  const t=tex(c);t.wrapS=THREE.RepeatWrapping;t.repeat.set(6,1);return t}
function cloudTexture(){const[c,x]=cv(512,256);
  const blob=(bx,by,r,col,fade)=>{const g=x.createRadialGradient(bx,by,r*.2,bx,by,r);g.addColorStop(0,col);g.addColorStop(1,fade);x.fillStyle=g;x.beginPath();x.arc(bx,by,r,0,7);x.fill()};
  for(let i=0;i<16;i++)blob(90+Math.random()*330,155+Math.random()*40,30+Math.random()*36,'rgba(196,206,226,.5)','rgba(196,206,226,0)');
  for(let i=0;i<18;i++)blob(80+Math.random()*350,118+Math.random()*52,26+Math.random()*40,'rgba(255,255,255,.72)','rgba(255,255,255,0)');
  return tex(c)}
function sunTexture(){const[c,x]=cv(256,256);const g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,255,244,1)');g.addColorStop(.18,'rgba(255,241,205,.95)');g.addColorStop(.4,'rgba(255,214,150,.35)');g.addColorStop(1,'rgba(255,200,120,0)');
  x.fillStyle=g;x.fillRect(0,0,256,256);return tex(c)}
function glowTexture(color){const[c,x]=cv(256,256);const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,color);g.addColorStop(.25,color.replace(')',',.55)').replace('rgb(','rgba('));g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,256);return tex(c)}
function signTexture(text,color,lit,font,size){const[c,x]=cv(1024,512);x.textAlign='center';x.textBaseline='middle';x.font=`${size}px ${font}`;
  if(lit){x.shadowColor=color;x.shadowBlur=70;x.fillStyle=color;x.fillText(text,512,256,960);x.shadowBlur=30;x.fillText(text,512,256,960);x.shadowBlur=8;x.fillText(text,512,256,960);
    x.shadowBlur=0;x.fillStyle='rgba(255,250,240,.55)';x.fillText(text,512,256,960)}
  else{x.fillStyle='#161a3d';x.fillText(text,512,256,960);x.strokeStyle='#1d2250';x.lineWidth=3;x.strokeText(text,512,256,960)}
  return tex(c)}
const boardCv=cv(2048,512),boardTex=tex(boardCv[0]);
function boardTexture(alpha){const[c,x]=boardCv;x.globalAlpha=1;x.letterSpacing='0px';x.fillStyle='#0a0c1e';x.fillRect(0,0,2048,512);x.strokeStyle=`rgba(243,231,207,${.15+.45*alpha})`;x.lineWidth=10;x.strokeRect(30,30,1988,452);
  x.textAlign='center';x.textBaseline='middle';x.globalAlpha=alpha;x.fillStyle=CREAM;x.font='150px "Alfa Slab One"';x.fillText(SHOW.board,1024,220,1880);
  x.font='700 46px Nunito';x.letterSpacing='12px';x.fillText(SHOW.boardSub,1024,380,1880);boardTex.needsUpdate=true;return boardTex}
function exitTexture(){const[c,x]=cv(512,256);x.fillStyle='#0f1330';x.fillRect(0,0,512,256);x.strokeStyle='rgba(243,231,207,.7)';x.lineWidth=8;x.strokeRect(12,12,488,232);
  x.fillStyle=CREAM;x.textAlign='center';x.textBaseline='middle';x.font='700 44px Nunito';x.letterSpacing='10px';x.fillText('EXIT',256,72);x.font='120px "Racing Sans One"';x.fillText('8',256,168);
  x.font='700 60px Nunito';x.fillText('↗',430,170);return tex(c)}
function carTexture(color,n){const[c,x]=cv(256,180);
  const p=new Path2D('M44 62 Q52 30 92 26 L164 26 Q204 30 212 62 Z');x.fillStyle=color;x.fill(p);
  x.fillStyle='#0b0d22';x.fill(new Path2D('M60 62 Q66 40 96 38 L160 38 Q190 40 196 62 Z'));
  x.fillStyle=color;roundRect(x,18,62,220,74,10);x.fillStyle='rgba(0,0,0,.35)';roundRect(x,18,62,220,74,10);
  x.fillStyle='rgba(255,255,255,.08)';roundRect(x,18,62,220,12,10);
  x.shadowColor='#E23A2E';x.shadowBlur=18;x.fillStyle='#E23A2E';roundRect(x,32,86,40,14,4);roundRect(x,184,86,40,14,4);x.shadowBlur=0;
  x.fillStyle='#05060f';roundRect(x,12,136,232,16,4);roundRect(x,24,136,34,34,6);roundRect(x,198,136,34,34,6);
  x.fillStyle=CREAM;x.textAlign='center';x.textBaseline='middle';x.font='30px "Racing Sans One"';x.fillText(n,128,118);return tex(c)}
function plateTexture(n){const[c,x]=cv(128,128);x.fillStyle='#F3E7CF';x.beginPath();x.arc(64,64,60,0,7);x.fill();
  x.fillStyle='#0E1230';x.textAlign='center';x.textBaseline='middle';x.font='64px "Racing Sans One"';x.fillText(n,64,70);return tex(c)}
function roundRect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();x.fill()}
function archTexture(){const[c,x]=cv(1024,256);x.fillStyle='#0a0c1e';x.fillRect(0,0,1024,256);
  x.strokeStyle='rgba(243,231,207,.55)';x.lineWidth=8;x.strokeRect(14,14,996,228);
  x.textAlign='center';x.textBaseline='middle';x.font='118px "Racing Sans One"';
  x.shadowColor='#F5B335';x.shadowBlur=46;x.fillStyle='#F5B335';x.fillText(SHOW.race,512,128);x.shadowBlur=14;x.fillText(SHOW.race,512,128);x.shadowBlur=0;
  x.fillStyle='#F3E7CF';for(let i=0;i<20;i++){const bx=52+i*(920/19);x.beginPath();x.arc(bx,38,7,0,7);x.fill();x.beginPath();x.arc(bx,218,7,0,7);x.fill()}
  return tex(c)}
function checkerTexture(){const[c,x]=cv(512,128);for(let i=0;i<16;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#0E1230':'#F3E7CF';x.fillRect(i*32,j*32,32,32)}return tex(c)}
function tractorTexture(){const[c,x]=cv(256,200);
  x.fillStyle='#0d1120';x.beginPath();x.arc(78,138,52,0,7);x.fill();
  x.fillStyle='#2a2f45';x.beginPath();x.arc(78,138,30,0,7);x.fill();
  x.fillStyle='#0d1120';x.beginPath();x.arc(78,138,12,0,7);x.fill();
  x.fillStyle='#0d1120';x.beginPath();x.arc(196,158,32,0,7);x.fill();
  x.fillStyle='#2a2f45';x.beginPath();x.arc(196,158,17,0,7);x.fill();
  x.fillStyle='#333a55';x.fillRect(126,26,9,58);x.fillRect(121,20,19,9);
  x.fillStyle='#6CC04A';roundRect(x,58,84,150,38,10);
  x.fillStyle='#5aa53e';roundRect(x,166,96,52,44,8);
  x.fillStyle='#6CC04A';roundRect(x,52,34,66,58,9);
  x.fillStyle='#0b0d22';roundRect(x,60,42,50,32,6);
  x.fillStyle='#F3E7CF';x.beginPath();x.arc(76,57,7,0,7);x.fill();x.beginPath();x.arc(96,57,7,0,7);x.fill();
  x.fillStyle='#0b0d22';x.beginPath();x.arc(78,59,3,0,7);x.fill();x.beginPath();x.arc(98,59,3,0,7);x.fill();
  return tex(c)}
