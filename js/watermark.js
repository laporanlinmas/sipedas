/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — watermark.js
   Watermark rendering and QR code generation
═══════════════════════════════════════════════════════════ */

function wrapTxt(ctx,txt,maxW){
  if(!txt)return[];if(ctx.measureText(txt).width<=maxW)return[txt];
  var words=txt.split(/\s+/),lines=[],cur='';
  words.forEach(function(w){var t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});
  if(cur)lines.push(cur);return lines.slice(0,5);
}
function drawWM(ctx,w,h,idx,qrCvs){
  var f=fotos[idx],isCam=(f.source==='camera'),exif=f.exif;
  var lat=null,lng=null;
  if(isCam&&exif&&exif.gps){lat=exif.gps.lat;lng=exif.gps.lng;}
  else if(S.lat&&S.lng){lat=parseFloat(S.lat);lng=parseFloat(S.lng);}
  var coordStr=(lat!==null&&lng!==null)?'📡 '+lat.toFixed(6)+', '+lng.toFixed(6):'Koordinat tidak tersedia';
  var addrFull=(isCam&&f.exifAddr&&f.exifAddr.full)?f.exifAddr.full:getManualLoc();
  var timeStr=isCam?fmtExifTime(exif):(nowFull()+' WIB');
  var danru=getDanru()||'—';
  var BAR=Math.max(3,Math.round(w*0.006)),PAD=Math.round(w*0.022),PADV=8;
  var LOGO=Math.round(Math.min(w,h)*0.10),QR=qrCvs?Math.max(90,Math.min(240,Math.round(Math.min(w,h)*0.16))):0;
  var QR_PAD=qrCvs?Math.round(PAD*0.6):0;
  var fT=Math.max(11,Math.round(LOGO*0.36)),fB=Math.max(9,Math.round(LOGO*0.30)),fS=Math.max(7,Math.round(fB*0.82));
  var LH=Math.round(fB*1.5),TX=BAR+Math.round(PAD*0.35)+LOGO+Math.round(PAD*0.45);
  var TW=w-TX-PAD-(qrCvs?QR+QR_PAD*2:0);
  ctx.font=fB+'px Arial,sans-serif';
  var addrLines=wrapTxt(ctx,addrFull,TW);
  var nLines=1+1+1+addrLines.length+1;
  var CONTH=PADV+Math.round(fT*1.45)+nLines*LH+PADV;
  var STRPH=Math.max(Math.round(h*0.15),CONTH,qrCvs?QR+PADV*2:0);
  var SY=h-STRPH;
  ctx.save();
  var gr=ctx.createLinearGradient(0,SY,0,h);gr.addColorStop(0,'rgba(2,6,18,0.42)');gr.addColorStop(0.6,'rgba(2,6,18,0.65)');gr.addColorStop(1,'rgba(2,6,18,0.80)');ctx.fillStyle=gr;ctx.fillRect(0,SY,w,STRPH);
  var bg=ctx.createLinearGradient(0,SY,0,h);bg.addColorStop(0,'rgba(26,101,214,0.65)');bg.addColorStop(1,'rgba(26,80,184,0.90)');ctx.fillStyle=bg;ctx.fillRect(0,SY,BAR,STRPH);
  var lx=BAR+Math.round(PAD*0.35),ly=SY+Math.round((STRPH-LOGO)/2);
  var lel=document.getElementById('img-linmas');
  if(lel&&lel.complete&&lel.naturalWidth>0){try{ctx.globalAlpha=0.65;ctx.drawImage(lel,lx,ly,LOGO,LOGO);ctx.globalAlpha=1;}catch(e){}}
  if(qrCvs&&QR>0){
    var qx=w-QR-QR_PAD,qy=SY+Math.round((STRPH-QR)/2) - 25;
    ctx.fillStyle='#ffffff';var qPad=4;ctx.fillRect(qx-qPad,qy-qPad,QR+qPad*2,QR+qPad*2);
    try{ctx.drawImage(qrCvs,qx,qy,QR,QR);}catch(e){}
    ctx.font='bold '+Math.max(7,Math.round(fS*0.82))+'px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,0.70)';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('📍 SCAN',qx+QR/2,qy+QR+4);
  }
  ctx.textAlign='left';ctx.textBaseline='top';var tx=TX,ty=SY+PADV;
  ctx.font='800 '+fT+'px Arial,sans-serif';ctx.fillStyle='rgba(255,210,0,0.90)';ctx.fillText('SATLINMAS PEDESTRIAN',tx,ty,TW);ty+=Math.round(fT*1.45);
  ctx.font='700 '+fB+'px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,0.90)';ctx.fillText('Danru: '+danru,tx,ty,TW);ty+=LH;
  ctx.font='400 '+fB+'px Arial,sans-serif';ctx.fillStyle='rgba(160,210,255,0.90)';ctx.fillText(timeStr,tx,ty,TW);ty+=LH;
  ctx.font='500 '+fB+'px Arial,sans-serif';ctx.fillStyle=(isCam&&f.exifAddr&&f.exifAddr.road)?'rgba(180,248,200,0.90)':'rgba(160,240,200,0.80)';
  addrLines.forEach(function(ln){ctx.fillText(ln,tx,ty,TW);ty+=LH;});
  ctx.font='400 '+fS+'px Arial,sans-serif';ctx.fillStyle='rgba(140,180,220,0.85)';ctx.fillText(coordStr,tx,ty,TW);
  var spF=Math.max(8,Math.round(w*0.024));ctx.font='900 '+spF+'px Arial,sans-serif';ctx.fillStyle='rgba(255,205,0,0.55)';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText('SI-PEDAS',w-Math.round(PAD*0.5),h-Math.round(PAD*0.3),Math.round(w*0.22));
  ctx.font='400 '+Math.round(spF*0.72)+'px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillText('mobile',w-Math.round(PAD*0.5),h-Math.round(PAD*0.3)-spF-2,Math.round(w*0.18));
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   QR CODE
═══════════════════════════════════════════════════════════ */
function makeQRCanvas(lat,lng,size,cb){
  try{
    var url='https://www.google.com/maps?q='+lat.toFixed(6)+','+lng.toFixed(6);
    var cont=document.getElementById('qr-worker');cont.innerHTML='';
    new QRCode(cont,{text:url,width:size,height:size,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
    setTimeout(function(){
      var el=cont.querySelector('canvas')||cont.querySelector('img');
      if(!el){cb(null);return;}
      if(el.tagName==='CANVAS'){cb(el);}
      else{var c=document.createElement('canvas');c.width=size;c.height=size;c.getContext('2d').drawImage(el,0,0,size,size);cb(c);}
    },80);
  }catch(e){cb(null);}
}