// ================================================================
//  ui.js — Logic UI utama SI-PEDAS
//  Semua google.script.run sudah diganti dengan apiGet / apiPost
// ================================================================

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
var SES=null,PER=15,SLM_PER=24;
var _RC={};var _rcIdx=0;
function rcSet(r){var k='rc_'+(++_rcIdx);_RC[k]=r;return k;}
function rcGet(k){return _RC[k]||null;}
var _gal=[],_galOrig=[],_gi=0;
var _charts={};
var _rData=[],_rPg=1,_rFQ='',_rFFrom='',_rFTo='';
var _editRow=null,_editFotos=[];
var _pdfRow=null;
var _slmData=[],_slmPg=1,_slmFNama='',_slmFUnit='',_slmRow=null;
var _hpsMode='',_hpsRi=null;
var _kolData=[];
var _currentPage='db';
var _petaLoaded=false;

// ══════════════════════════════════════════
//  DEVICE DETECTION
// ══════════════════════════════════════════
function isRealMobile(){
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&window.screen.width<=900);
}
function isMobileView(){
  return document.body.classList.contains('mode-phone')||
    (isRealMobile()&&!document.body.classList.contains('mode-desktop-hp'));
}

// ══════════════════════════════════════════
//  VIEW MODE
// ══════════════════════════════════════════
function getVM(){try{return localStorage.getItem('_vm3')||'auto';}catch(e){return'auto';}}
function setVM(v){try{localStorage.setItem('_vm3',v);}catch(e){};}
function applyViewMode(){
  var mode=getVM(),mobile=isRealMobile(),body=document.body;
  body.classList.remove('mode-phone','mode-desktop-hp');
  var eff=(mode==='phone')?'phone':(mode==='desktop')?'desktop':(mobile?'phone-native':'desktop-native');
  if(eff==='phone'&&!mobile){body.classList.add('mode-phone');setViewport(false);}
  else if(eff==='desktop'&&mobile){body.classList.add('mode-desktop-hp');setViewport(true);}
  else{setViewport(!mobile);}
  updateFab(mode,mobile);
}
function updateFab(mode,mobile){
  var ico=G('vm-ico'),lbtico=G('lvm-ico');
  var tip,iconClass;
  if(mobile){if(mode==='desktop'){iconClass='fas fa-mobile-alt';tip='Kembali ke Mode HP';}else{iconClass='fas fa-desktop';tip='Mode Desktop';}}
  else{if(mode==='phone'){iconClass='fas fa-desktop';tip='Kembali ke Mode Desktop';}else{iconClass='fas fa-mobile-alt';tip='Mode HP';}}
  if(ico)ico.className=iconClass;if(lbtico)lbtico.className=iconClass;
  var vmb=G('vm-btn');if(vmb)vmb.setAttribute('data-tip',tip);
  var lvmb=G('lvm-btn');if(lvmb)lvmb.title=tip;
}
function toggleViewMode(){
  var mode=getVM(),mobile=isRealMobile(),next;
  if(mobile){next=(mode==='desktop')?'auto':'desktop';}
  else{next=(mode==='phone')?'auto':'phone';}
  setVM(next);document.body.classList.remove('sb-off');applyViewMode();
  var nl={auto:'Otomatis',phone:'Mode HP',desktop:'Mode Desktop'};
  toast('Tampilan: '+nl[next],'inf');
}
function setViewport(allowZoom){
  var m=G('mvp');if(!m)return;
  m.setAttribute('content',allowZoom?'width=1080,initial-scale=0.5,minimum-scale=0.2,user-scalable=yes':'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no');
}
function toggleSbCollapse(){document.body.classList.toggle('sb-off');}

function doRefreshPage(){
  var btn=G('refresh-btn');
  if(btn)btn.classList.add('spinning');
  toast('Memuat ulang data...','inf');
  setTimeout(function(){
    if(btn)btn.classList.remove('spinning');
    var page=_currentPage;
    if(page==='db')loadDashboard();
    else if(page==='rk')loadRekap();
    else if(page==='ed')loadEdit();
    else if(page==='in')loadInput();
    else if(page==='sl')loadSatlinmas();
    else if(page==='pt'){_petaLoaded=false;loadPeta();}
    else if(page==='ptk')loadPetunjuk();
    else loadDashboard();
  },600);
}

// Swipe gesture
(function(){
  var sx=0,sy=0,stime=0;
  document.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;stime=Date.now();},{passive:true});
  document.addEventListener('touchend',function(e){
    if(!document.body.classList.contains('mode-desktop-hp'))return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy,dt=Date.now()-stime;
    if(dt>500||Math.abs(dy)>Math.abs(dx)*1.2||Math.abs(dx)<50)return;
    var off=document.body.classList.contains('sb-off');
    if(dx>0&&off)document.body.classList.remove('sb-off');
    else if(dx<0&&!off)document.body.classList.add('sb-off');
  },{passive:true});
})();

// ══════════════════════════════════════════
//  UTIL
// ══════════════════════════════════════════
function G(id){return document.getElementById(id);}
function esc(v){if(!v)return'';return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showLoad(m){G('lmsg').textContent=m||'Memuat...';G('lov').classList.add('on');}
function hideLoad(){G('lov').classList.remove('on');}
function toast(msg,type){
  type=type||'inf';
  var ico={ok:'fa-circle-check',er:'fa-circle-xmark',inf:'fa-circle-info'};
  var el=document.createElement('div');el.className='ti '+type;
  el.innerHTML='<i class="fas '+(ico[type]||ico.inf)+'"></i><span>'+esc(msg)+'</span>';
  G('tco').appendChild(el);
  setTimeout(function(){el.classList.add('tOut');setTimeout(function(){el.remove();},230);},3400);
}
function om(id){G(id).classList.add('on');document.body.style.overflow='hidden';}
function cm(id){G(id).classList.remove('on');document.body.style.overflow='';}

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){galClose();document.querySelectorAll('.mov.on').forEach(function(m){m.classList.remove('on');});document.body.style.overflow='';}
  if(G('gov').classList.contains('on')){if(e.key==='ArrowLeft')galNav(-1);if(e.key==='ArrowRight')galNav(1);}
});

function toggleLokasi(el){/* tidak dipakai lagi */}
function mcardLokasi(teks){
  if(!teks)return'<div class="lok-wrap"><span class="lok-trunc" style="color:var(--muted)">—</span></div>';
  return'<div class="lok-wrap"><span class="lok-trunc">'+esc(teks)+'</span></div>';
}
function mcardChip(teks,chipCls){
  if(!teks)return'';var safe=esc(teks);
  var isNihil=teks.toUpperCase()==='NIHIL'||teks==='';
  if(isNihil)return'<span class="chip cm">Nihil</span>';
  return'<span class="chip '+chipCls+' chip-mob" onclick="this.classList.toggle(\'expanded\')" title="'+safe+'">'+safe+'</span>';
}
function mcardPersonil(teks){
  if(!teks)return'—';var safe=esc(teks);
  if(teks.length<=25)return safe;
  return'<span class="per-trunc" onclick="this.classList.toggle(\'expanded\')" title="'+safe+'">'+safe+'</span>';
}

// Datetime
var _dtwInterval=null;
var _hariNames=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var _bulanNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function startDtwTick(){
  if(_dtwInterval)clearInterval(_dtwInterval);
  _dtwInterval=setInterval(tickDtw,1000);tickDtw();
}
function tickDtw(){
  var now=new Date();
  var h=G('dtw-h'),m=G('dtw-m'),s=G('dtw-s'),dte=G('dtw-date'),dy=G('dtw-day');
  if(!h)return;
  function z(n){return String(n).padStart(2,'0');}
  h.textContent=z(now.getHours());m.textContent=z(now.getMinutes());s.textContent=z(now.getSeconds());
  dte.textContent=now.getDate()+' '+_bulanNames[now.getMonth()]+' '+now.getFullYear();
  dy.textContent=_hariNames[now.getDay()];
}
function tickClock(){var c=G('clk');if(c)c.textContent=new Date().toLocaleString('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}
tickClock();setInterval(tickClock,1000);

// ══════════════════════════════════════════
//  FOTO THUMBNAIL
// ══════════════════════════════════════════
function renderFotoThumb(fotArr,fotThumb,ck){
  if(!fotArr||!fotArr.length)return'—';
  var disp=fotArr.slice(0,3);var rest=fotArr.length-3;
  var html='<div class="foto-thumb-wrap">';
  disp.forEach(function(u,i){
    var thumb=(fotThumb&&fotThumb[i])?fotThumb[i]:u;
    html+='<img src="'+esc(thumb)+'" title="Foto '+(i+1)+'" '
      +'onclick="var rx=rcGet(\''+ck+'\');galOpen(rx.fotos,rx.fotosThumb||rx.fotos,'+i+')" '
      +'onerror="this.style.display=\'none\'">';
  });
  if(rest>0){html+='<span class="foto-more-badge" onclick="var rx=rcGet(\''+ck+'\');galOpen(rx.fotos,rx.fotosThumb||rx.fotos,3)"><i class="fas fa-images"></i> +'+rest+'</span>';}
  return html+'</div>';
}

// ══════════════════════════════════════════
//  GALLERY
// ══════════════════════════════════════════
function galOpen(fotos,fotosThumb,idx){
  if(!fotos||!fotos.length){toast('Tidak ada foto.','inf');return;}
  _galOrig=fotos;_gal=fotosThumb&&fotosThumb.length?fotosThumb:fotos;_gi=idx||0;
  galRender();G('gov').classList.add('on');
}
function galRender(){
  var img=G('gimg');img.style.display='none';G('gloaderOverlay').classList.add('on');
  img.src=_gal[_gi]||'';G('gcnt').textContent=(_gi+1)+' / '+_gal.length;
  G('gpv').disabled=_gi===0;G('gnx').disabled=_gi===_gal.length-1;
  var orig=_galOrig[_gi]||'';var lnk=G('gdrvhref');
  if(orig&&orig.indexOf('drive.google.com')>-1){lnk.href=orig;G('gdrvlink').style.display='';}else{G('gdrvlink').style.display='none';}
  var th=G('gths');th.innerHTML='';
  _gal.forEach(function(u,i){var el=document.createElement('img');el.src=u;el.className='gth'+(i===_gi?' on':'');el.onerror=function(){el.style.opacity='.15';};el.onclick=(function(ii){return function(){_gi=ii;galRender();};})(i);th.appendChild(el);});
}
function galImgLoad(img){G('gloaderOverlay').classList.remove('on');img.style.display='block';}
function galImgErr(img){
  G('gloaderOverlay').classList.remove('on');img.style.display='block';
  var orig=_galOrig[_gi]||'';
  if(orig&&img.src!==orig){img.src=orig;return;}
  img.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23222"%2F%3E%3Ctext x="150" y="110" text-anchor="middle" fill="%23777" font-size="13" font-family="sans-serif"%3EGambar tidak dapat dimuat%3C%2Ftext%3E%3C%2Fsvg%3E';
  if(orig&&orig.indexOf('drive.google.com')>-1)G('gdrvlink').style.display='';
}
function galNav(d){_gi=Math.max(0,Math.min(_gal.length-1,_gi+d));galRender();}
function galClose(){G('gov').classList.remove('on');}

// ══════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════
function sbToggle(){G('sidebar').classList.toggle('on');G('mbb').classList.toggle('on');}
function sbClose(){G('sidebar').classList.remove('on');G('mbb').classList.remove('on');}
function setNav(id){
  _currentPage=id;
  if(id!=='pt') G('ct').classList.remove('peta-outer-pa');
  document.querySelectorAll('.nb').forEach(function(b){b.classList.remove('on');});
  var el=G('nav-'+id);if(el)el.classList.add('on');
  document.querySelectorAll('.bni').forEach(function(b){b.classList.remove('on');});
  var bn=G('bni-'+id);if(bn)bn.classList.add('on');
}
function setPage(t,s){G('pgtl').textContent=t;G('pgsb').textContent=s||'';}
function dChart(id){if(_charts[id]){_charts[id].destroy();delete _charts[id];}}

// ══════════════════════════════════════════
//  LOGIN
//  Sebelum: google.script.run.withSuccessHandler(fn).checkLogin(u,p)
//  Sesudah: apiPost('login', { username, password }).then(fn)
// ══════════════════════════════════════════
function toggleEye(){var i=G('ip'),ic=G('eyeico');if(i.type==='password'){i.type='text';ic.className='fas fa-eye-slash';}else{i.type='password';ic.className='fas fa-eye';}}

function doLogin(){
  var u=G('iu').value.trim(),p=G('ip').value;
  if(!u||!p){showLErr('Username & password wajib diisi.');return;}
  var btn=G('lbtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memeriksa...';
  btn.disabled=true;
  G('lerr').classList.remove('on');

  // ✅ GANTI: google.script.run → apiPost
  apiPost('login',{username:u,password:p}).then(function(res){
    btn.innerHTML='<i class="fas fa-right-to-bracket"></i> Masuk';
    btn.disabled=false;
    if(res.success){
      var d=res.data||res;
      SES={username:d.username,role:d.role,namaLengkap:d.namaLengkap};
      try{sessionStorage.setItem('_slm',JSON.stringify(SES));}catch(e){}
      buildUI();
      G('lp').style.display='none';
      G('app').classList.add('on');
      loadDashboard();
    }else{
      showLErr(res.message||'Login gagal.');
    }
  });
}

function showLErr(m){G('lerrmsg').textContent=m;G('lerr').classList.add('on');}

function buildUI(){
  if(!SES)return;
  var adm=SES.role==='admin';
  var ini=(SES.namaLengkap||SES.username||'?').charAt(0).toUpperCase();
  var tbav=G('tb-av'),tbun=G('tb-un'),tbrl=G('tb-rl'),tbbdg=G('tb-bdg'),tbacct=G('tb-acct');
  if(tbav)tbav.textContent=ini;
  if(tbun)tbun.textContent=SES.namaLengkap||SES.username;
  if(tbrl)tbrl.textContent=adm?'Administrator':'Pengguna';
  if(tbbdg){tbbdg.textContent=adm?'Admin':'User';tbbdg.className='rbdg '+(adm?'adm':'usr');}
  if(tbacct)tbacct.style.display='';
  if(!adm){
    var ne=G('nav-ed'),ni=G('nav-in'),be=G('bni-ed'),bi=G('bni-in');
    if(ne)ne.style.display='none';if(ni)ni.style.display='none';
    if(be)be.style.display='none';if(bi)bi.style.display='none';
  }
}

function doLogout(){
  if(!confirm('Yakin ingin keluar?'))return;
  try{sessionStorage.removeItem('_slm');}catch(e){}
  SES=null;
  G('app').classList.remove('on');
  G('lp').style.display='';
  G('ip').value='';
  G('ct').innerHTML='';
  sbClose();
  document.body.classList.remove('sb-off');
  _petaLoaded=false;
}

// ══════════════════════════════════════════
//  DASHBOARD
//  Sebelum: google.script.run.withSuccessHandler(renderDash).getDashboardData()
//  Sesudah: apiGet('getDashboard').then(renderDash)
// ══════════════════════════════════════════
function loadDashboard(){
  setNav('db');setPage('Dashboard','Statistik & grafik data patroli');sbClose();showLoad();
  dChart('bar');dChart('dnt');dChart('tw');

  // ✅ GANTI: google.script.run → apiGet
  apiGet('getDashboard').then(function(res){
    if(!res.success){hideLoad();showErr(res.message);return;}
    renderDash(res.data||res);
  });
}

function renderDash(d){
  hideLoad();if(!d){showErr('Data kosong');return;}
  var mobileView=isMobileView();
  var h='<div class="fu">'
    +'<div class="dtw" id="dtw">'
      +'<div class="dtw-left">'
        +'<div class="dtw-time"><span id="dtw-h">--</span>:<span id="dtw-m">--</span><span class="dtw-sec">:<span id="dtw-s">--</span></span></div>'
        +'<div class="dtw-date" id="dtw-date">—</div>'
        +'<div class="dtw-day" id="dtw-day">—</div>'
      +'</div>'
      +'<div class="dtw-right">'
        +'<div class="dtw-badge"><i class="fas fa-circle-dot"></i> Sistem Aktif</div>'
        +'<div class="dtw-badge" id="dtw-user-badge"></div>'
        +'<div class="dtw-dots"><div class="dtw-dot"></div><div class="dtw-dot"></div><div class="dtw-dot"></div></div>'
      +'</div>'
    +'</div>'
    +'<div class="sgr">'
    +sc('cb','fa-clipboard-list',d.total||0,'Total Laporan')
    +sc('cr','fa-user-slash',d.totalP||0,'Pelanggaran')
    +sc('cg','fa-calendar-day',d.hariIni||0,'Hari Ini')
    +sc('ca','fa-triangle-exclamation',d.hariIniP||0,'Pelanggaran Hari Ini')
    +sc('cp','fa-users',d.totalAnggota||0,'Total Anggota')
    +'</div>'
    +'<div class="cg2">'
    +'<div class="panel" style="margin-bottom:0"><div class="phd"><span class="ptl"><i class="fas fa-chart-bar"></i> Laporan per Hari</span></div><div class="pbd"><div class="chbox"><canvas id="cBar"></canvas></div></div></div>'
    +'<div style="display:flex;flex-direction:column;gap:12px">'
      +'<div class="panel" style="margin-bottom:0">'
        +'<div class="phd"><span class="ptl"><i class="fas fa-chart-pie" style="color:var(--purple)"></i> Tren Triwulan</span><span id="tw-year-lbl" style="font-size:.58rem;color:var(--muted);font-family:var(--mono)"></span></div>'
        +'<div class="pbd" style="padding-bottom:10px"><div class="chbox-sm"><canvas id="cTw"></canvas></div><div class="tw-legend" id="tw-legend"></div></div>'
      +'</div>'
      +'<div class="panel" style="margin-bottom:0"><div class="phd"><span class="ptl"><i class="fas fa-map-pin"></i> Top Lokasi Patroli</span></div><div class="pbd">'+lokBar(d.perLokasi||[])+'</div></div>'
    +'</div>'
    +'</div>';
  if(mobileView){h+=renderPetunjukWidget();}
  h+='</div>';
  G('ct').innerHTML=h;
  startDtwTick();
  var ub=G('dtw-user-badge');if(ub&&SES){ub.innerHTML='<i class="fas fa-user"></i> '+(SES.namaLengkap||SES.username||'');}
  var hl=(d.perHari||[]).map(function(x){return x.hari;}),hd=(d.perHari||[]).map(function(x){return x.n;});
  _charts['bar']=new Chart(G('cBar'),{type:'bar',data:{labels:hl,datasets:[{label:'Laporan',data:hd,backgroundColor:'rgba(30,111,217,.12)',borderColor:'#1e6fd9',borderWidth:2.5,borderRadius:7,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{precision:0}}}}});
  var twData=hitungTriwulan(d.allData||[]);
  buildTwChart(twData);
  var yl=G('tw-year-lbl');if(yl)yl.textContent='Tahun '+new Date().getFullYear();
}

function hitungTriwulan(data){
  var labels=['Jan–Mar','Apr–Jun','Jul–Sep','Okt–Des'];
  var counts=[0,0,0,0],countP=[0,0,0,0];
  var BLN={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
  (data||[]).forEach(function(r){
    var b=String(r.tanggal||'').replace(/^[A-Za-z]+,?\s*/,'').trim().toLowerCase();
    var m=/(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(b);
    if(m&&BLN[m[2]]){var mo=BLN[m[2]],qi=Math.floor((mo-1)/3);if(qi>=0&&qi<=3){counts[qi]++;if(r.identitas&&r.identitas.toUpperCase()!=='NIHIL'&&r.identitas!=='')countP[qi]++;}}
  });
  var total=counts[0]+counts[1]+counts[2]+counts[3];
  if(!total&&_rData&&_rData.length){
    _rData.forEach(function(r){
      var b=String(r.tanggal||'').replace(/^[A-Za-z]+,?\s*/,'').trim().toLowerCase();
      var m=/(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(b);
      if(m&&BLN[m[2]]){var mo=BLN[m[2]],qi=Math.floor((mo-1)/3);if(qi>=0&&qi<=3){counts[qi]++;if(r.identitas&&r.identitas.toUpperCase()!=='NIHIL'&&r.identitas!=='')countP[qi]++;}}
    });
  }
  return{labels:labels,counts:counts,countP:countP};
}

function buildTwChart(tw){
  if(_charts['tw']){_charts['tw'].destroy();delete _charts['tw'];}
  var colors=['rgba(30,111,217,.82)','rgba(13,146,104,.82)','rgba(217,119,6,.82)','rgba(124,58,237,.82)'];
  var bords=['#1e6fd9','#0d9268','#d97706','#7c3aed'];
  _charts['tw']=new Chart(G('cTw'),{type:'doughnut',data:{labels:tw.labels,datasets:[{data:tw.counts.map(function(v){return v||0;}),backgroundColor:colors,borderColor:bords,borderWidth:2,hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.label+': '+ctx.parsed+' laporan';}}}}}});
  var leg=G('tw-legend');if(!leg)return;
  var legItems=[{color:'#1e6fd9',label:'Q1 Jan–Mar',n:tw.counts[0]},{color:'#0d9268',label:'Q2 Apr–Jun',n:tw.counts[1]},{color:'#d97706',label:'Q3 Jul–Sep',n:tw.counts[2]},{color:'#7c3aed',label:'Q4 Okt–Des',n:tw.counts[3]}];
  leg.innerHTML=legItems.map(function(l){return'<div class="tw-leg-item"><div class="tw-leg-dot" style="background:'+l.color+'"></div><span>'+l.label+': <strong>'+l.n+'</strong></span></div>';}).join('');
}
function sc(cls,ico,n,l){return'<div class="scard '+cls+'"><div class="sico"><i class="fas '+ico+'"></i></div><div class="snum">'+n+'</div><div class="slbl">'+l+'</div></div>';}
function lokBar(arr){
  if(!arr.length)return'<div class="empty"><i class="fas fa-map-pin"></i><p>Belum ada data</p></div>';
  var mx=arr[0].n||1,h='';
  arr.slice(0,7).forEach(function(x){var p=Math.round(x.n/mx*100);h+='<div class="lokbar-item"><div class="lokbar-label"><span>'+esc(x.lokasi)+'</span><span style="color:var(--blue);font-family:var(--mono)">'+x.n+'</span></div><div class="lokbar-track"><div class="lokbar-fill" style="width:'+p+'%"></div></div></div>';});
  return h;
}

// ══════════════════════════════════════════
//  PETUNJUK TEKNIS
// ══════════════════════════════════════════
var _ptkData=[
  {id:'ptk-db',ico:'fa-gauge-high',color:'var(--blue)',bg:'var(--bluelo)',title:'Dashboard',desc:'Halaman utama menampilkan statistik ringkasan dan grafik data laporan patroli.',poin:['Statistik total laporan, pelanggaran, & aktivitas hari ini','Grafik laporan per hari','Top lokasi patroli berdasarkan frekuensi','Tren Laporan dalam Format Triwulan','Jumlah Anggota Satlinmas Pedestrian']},
  {id:'ptk-peta',ico:'fa-map-location-dot',color:'#0891b2',bg:'#e0f7fa',title:'Peta Pedestrian',desc:'Peta interaktif wilayah patroli Satlinmas Pedestrian.',poin:['Mode Google My Maps menampilkan rute patroli, titik rawan, dan pos jaga','Mode Peta Realtime menampilkan laporan lapangan secara langsung','Klik layer atau marker untuk melihat detail lokasi','Tombol Edit Layer untuk administrator','Tombol Refresh untuk memuat ulang peta realtime']},
  {id:'ptk-rk',ico:'fa-table-list',color:'var(--amber)',bg:'var(--amberl)',title:'Rekap Laporan',desc:'Melihat, mencari, dan mencetak seluruh laporan patroli.',poin:['Filter berdasarkan kata kunci, lokasi, personil, atau rentang tanggal','Lihat foto dokumentasi langsung dari tabel','Cetak laporan tunggal atau kolektif (PDF rekap)','Admin dapat edit dan hapus laporan dari halaman ini']},
  {id:'ptk-in',ico:'fa-plus-circle',color:'var(--green)',bg:'var(--greenl)',title:'Input Laporan (Admin)',desc:'Menambahkan laporan patroli baru.',poin:['Input manual: isi form tanggal, hari, lokasi, personil, identitas pelanggar','Format WA: tempel teks laporan dari WhatsApp, sistem otomatis parsing','Lampirkan foto dokumentasi (maks 10 foto)','Minimal 1 foto wajib disertakan']},
  {id:'ptk-ed',ico:'fa-file-pen',color:'var(--purple)',bg:'var(--purplel)',title:'Edit Laporan',desc:'Mengelola dan memperbaiki data laporan. Khusus Admin.',poin:['Edit semua field laporan','Tambah atau hapus foto dari laporan','Hapus laporan secara permanen']},
  {id:'ptk-sl',ico:'fa-users',color:'var(--red)',bg:'var(--redl)',title:'Data Satlinmas',desc:'Manajemen data anggota Satlinmas Pedestrian.',poin:['Tambah, edit, dan hapus data anggota','Data mencakup nama, tanggal lahir, unit, dan nomor WhatsApp','Usia dihitung otomatis dari tanggal lahir']},
  {id:'ptk-acc',ico:'fa-user-shield',color:'var(--blue)',bg:'var(--bluelo)',title:'Tipe Akun & Hak Akses',desc:'Dua level pengguna dengan batasan fitur berbeda.',poin:['Administrator: Akses penuh (Input, Validasi, Edit, Hapus, Cetak).','Pengguna (User): Akses terbatas (hanya lihat dan cetak).']},
  {id:'ptk-auth',ico:'fa-circle-info',color:'#34495e',bg:'#f4f7f6',title:'Informasi Sistem',desc:'Dikembangkan untuk efisiensi pelaporan Satlinmas Pedestrian.',poin:['Author: Ahmad Abdul Basith, S.Tr.I.P.','<a href="https://wa.me/6285159686554" target="_blank" style="color:#0d9268;font-weight:bold;"><i class="fab fa-whatsapp"></i> Hubungi 0851-5968-6554</a>']}
];

function renderPetunjukWidget(){
  var h='<div class="ptk-section"><div class="ptk-outer">'
    +'<button class="ptk-outer-toggle" onclick="togglePtkOuter(this)">'
      +'<div class="ptk-outer-left"><div class="ptk-outer-ico"><i class="fas fa-book-open"></i></div>'
      +'<div><div class="ptk-outer-title">Petunjuk Teknis SI-PEDAS</div><div class="ptk-outer-sub">Panduan fitur & penggunaan sistem</div></div></div>'
      +'<i class="fas fa-chevron-down ptk-outer-arr"></i>'
    +'</button>'
    +'<div class="ptk-menulist" id="ptk-menulist">';
  _ptkData.forEach(function(item){
    var faClass=item.ico.indexOf('fab ')===0?item.ico:'fas '+item.ico;
    h+='<div class="ptk-menu-item">'
      +'<button class="ptk-menu-btn" onclick="togglePtkMenu(this)">'
        +'<div class="ptk-menu-left"><div class="ptk-menu-ico" style="background:'+item.bg+';color:'+item.color+'"><i class="'+faClass+'"></i></div>'
        +'<span class="ptk-menu-name">'+item.title+'</span></div>'
        +'<i class="fas fa-chevron-right ptk-menu-arr"></i>'
      +'</button>'
      +'<div class="ptk-detail"><p>'+item.desc+'</p><ul>'+item.poin.map(function(p){return'<li>'+p+'</li>';}).join('')+'</ul></div>'
    +'</div>';
  });
  h+='</div></div></div>';
  return h;
}
function togglePtkOuter(btn){btn.classList.toggle('open');var ml=G('ptk-menulist');if(ml)ml.classList.toggle('on');}
function togglePtkMenu(btn){
  var detail=btn.nextElementSibling;var isOpen=detail.classList.contains('on');
  document.querySelectorAll('.ptk-detail.on').forEach(function(d){d.classList.remove('on');});
  document.querySelectorAll('.ptk-menu-btn.open').forEach(function(b){b.classList.remove('open');});
  if(!isOpen){detail.classList.add('on');btn.classList.add('open');}
}
function loadPetunjuk(){
  setNav('ptk');setPage('Petunjuk Teknis','Panduan fitur & penggunaan SI-PEDAS');sbClose();
  dChart('bar');dChart('dnt');
  G('ct').innerHTML='<div class="fu">'+renderPetunjukWidget()+'</div>';
  var tog=document.querySelector('.ptk-outer-toggle');if(tog)togglePtkOuter(tog);
}

// ══════════════════════════════════════════
//  DATA SATLINMAS
//  Sebelum: google.script.run.withSuccessHandler(fn).getSatlinmasData()
//  Sesudah: apiGet('getSatlinmas').then(fn)
// ══════════════════════════════════════════
function loadSatlinmas(){
  setNav('sl');setPage('Data Satlinmas','Daftar anggota');sbClose();showLoad();
  _slmFNama='';_slmFUnit='';

  // ✅ GANTI
  apiGet('getSatlinmas').then(function(res){
    hideLoad();
    _slmData=res.data||[];
    _slmPg=1;
    renderSatlinmas();
  });
}

function buildSlmCards(sl){
  var cards='';
  if(!sl.length)return'<div class="empty" style="grid-column:1/-1"><i class="fas fa-users"></i><p>Belum ada data.</p></div>';
  sl.forEach(function(r){
    var av=(r.nama||'?').charAt(0).toUpperCase(),avCls='ag-av',unit=(r.unit||'').toLowerCase();
    if(unit.indexOf('satpol')>-1||unit.indexOf('pp')>-1)avCls+=' satpol';
    else if(unit.indexOf('desa')>-1)avCls+=' desa';
    else if(unit.indexOf('kelurahan')>-1||unit.indexOf('kel ')>-1)avCls+=' kel';
    var ageMeta=r.usia!==''&&r.usia!==undefined?'<span class="ag-pill ag-age"><i class="fas fa-cake-candles"></i> '+r.usia+' thn</span>':'';
    var waMeta=r.wa?'<a class="ag-pill ag-wa" href="https://wa.me/62'+r.wa.replace(/^0/,'').replace(/[^0-9]/g,'')+'" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> '+esc(r.wa)+'</a>':'';
    var bornMeta=r.tglLahir?'<span class="ag-pill ag-born"><i class="fas fa-calendar"></i> '+esc(r.tglLahir)+'</span>':'';
    var ck=rcSet(r);
    cards+='<div class="ag-card"><div class="'+avCls+'">'+av+'</div>'
      +'<div class="ag-info"><div class="ag-name">'+esc(r.nama)+'</div><div class="ag-unit">'+(esc(r.unit)||'\u2014')+'</div>'
      +'<div class="ag-meta">'+ageMeta+bornMeta+waMeta+'</div></div>'
      +'<div class="ag-act">'
      +'<button class="ag-btn ag-edit" onclick="openSlmModal(rcGet(\''+ck+'\'))" title="Edit"><i class="fas fa-pen"></i></button>'
      +'<button class="ag-btn ag-del" onclick="konfirmHapus(\'satlinmas\',rcGet(\''+ck+'\')._ri)" title="Hapus"><i class="fas fa-trash"></i></button>'
      +'</div></div>';
  });
  return cards;
}

function renderSatlinmas(){
  var flt=filterSlm(),tot=flt.length,pages=Math.max(1,Math.ceil(tot/SLM_PER));
  _slmPg=Math.min(_slmPg,pages);var st=(_slmPg-1)*SLM_PER,sl=flt.slice(st,st+SLM_PER);
  var cards=buildSlmCards(sl);
  var unitCount={};_slmData.forEach(function(r){var k=r.unit||'Lainnya';unitCount[k]=(unitCount[k]||0)+1;});
  var unitPills=Object.keys(unitCount).map(function(k){return'<span class="chip cb2" style="margin-right:4px">'+esc(k)+': '+unitCount[k]+'</span>';}).join('');
  if(!G('slm-grid')){
    var h='<div class="fu"><div class="panel">'
      +'<div class="phd"><div style="flex:1"><span class="ptl"><i class="fas fa-users"></i> Data Satlinmas Pedestrian</span>'
      +'<div id="slm-meta" style="font-size:.62rem;color:var(--muted);margin-top:3px">Total: <strong>'+tot+'</strong> anggota'+(unitPills?' · '+unitPills:'')+'</div></div>'
      +'<button class="bp" onclick="openSlmModal(null)"><i class="fas fa-user-plus"></i> Tambah</button></div>'
      +'<div class="fbar"><div class="fsrch" style="flex:2 1 140px"><i class="fas fa-search fsi"></i><input class="fctl" type="text" id="slm-snm" placeholder="Cari nama..." oninput="slmFiltDebounce()"></div>'
      +'<div class="fsrch" style="flex:1 1 110px"><i class="fas fa-search fsi"></i><input class="fctl" type="text" id="slm-sun" placeholder="Cari unit..." oninput="slmFiltDebounce()"></div>'
      +'<button class="bg2" onclick="slmReset()"><i class="fas fa-rotate-left"></i></button></div>'
      +'<div class="ag-grid" id="slm-grid">'+cards+'</div>'
      +'<div class="pgw" id="slm-pgw"><span>'+pgInfo(st,tot,SLM_PER)+'</span><div class="pbs">'+pgBtns(_slmPg,pages,'slmPage')+'</div></div>'
      +'</div></div>';
    G('ct').innerHTML=h;
  }else{
    G('slm-grid').innerHTML=cards;
    G('slm-pgw').innerHTML='<span>'+pgInfo(st,tot,SLM_PER)+'</span><div class="pbs">'+pgBtns(_slmPg,pages,'slmPage')+'</div>';
    if(G('slm-meta'))G('slm-meta').innerHTML='Total: <strong>'+tot+'</strong> anggota'+(unitPills?' · '+unitPills:'');
  }
}

function filterSlm(){return _slmData.filter(function(r){var nm=_slmFNama.toLowerCase(),un=_slmFUnit.toLowerCase();if(nm&&(r.nama||'').toLowerCase().indexOf(nm)<0)return false;if(un&&(r.unit||'').toLowerCase().indexOf(un)<0)return false;return true;});}
var _slmFiltTimer=null;
function slmFiltDebounce(){clearTimeout(_slmFiltTimer);_slmFiltTimer=setTimeout(function(){_slmFNama=G('slm-snm')?G('slm-snm').value:'';_slmFUnit=G('slm-sun')?G('slm-sun').value:'';_slmPg=1;renderSlmBody();},200);}
function renderSlmBody(){var flt=filterSlm(),tot=flt.length,pages=Math.max(1,Math.ceil(tot/SLM_PER));_slmPg=Math.min(_slmPg,pages);var st=(_slmPg-1)*SLM_PER,sl=flt.slice(st,st+SLM_PER);if(G('slm-grid'))G('slm-grid').innerHTML=buildSlmCards(sl);if(G('slm-pgw'))G('slm-pgw').innerHTML='<span>'+pgInfo(st,tot,SLM_PER)+'</span><div class="pbs">'+pgBtns(_slmPg,pages,'slmPage')+'</div>';}
function slmReset(){_slmFNama='';_slmFUnit='';_slmPg=1;if(G('slm-snm'))G('slm-snm').value='';if(G('slm-sun'))G('slm-sun').value='';renderSlmBody();}
function slmPage(p){_slmPg=p;renderSlmBody();}

function openSlmModal(row){
  _slmRow=row;var isEdit=!!row;
  G('mslm-title').innerHTML=isEdit?'<i class="fas fa-user-pen" style="color:var(--blue)"></i> Edit Anggota':'<i class="fas fa-user-plus" style="color:var(--green)"></i> Tambah Anggota';
  var unitOpts=['Satpol PP','Satlinmas Desa','Satlinmas Kelurahan','Lainnya'].map(function(u){return'<option value="'+u+'"'+(row&&row.unit===u?' selected':'')+'>'+u+'</option>';}).join('');
  G('mslm-body').innerHTML=''
    +'<div class="fgrp"><label class="flbl">Nama Lengkap <span class="req">*</span></label><input class="fctl" id="slm-nama" placeholder="Nama lengkap" value="'+esc(row?row.nama:'')+'"></div>'
    +'<div class="frow"><div class="fcol"><label class="flbl">Tanggal Lahir</label><input class="fctl" id="slm-tgl" type="date" value="'+esc(row?row.tglLahir:'')+'" oninput="previewUsia()" onchange="previewUsia()"><div id="slm-usia-prev" style="font-size:.63rem;color:var(--blue);margin-top:3px;font-weight:700;min-height:15px"></div></div>'
    +'<div class="fcol"><label class="flbl">Unit</label><select class="fctl" id="slm-unit"><option value="">-- Pilih Unit --</option>'+unitOpts+'</select></div></div>'
    +'<div class="fgrp"><label class="flbl">Nomor WhatsApp</label><input class="fctl" id="slm-wa" placeholder="08xxxxxxxxxx" value="'+esc(row?row.wa:'')+'"></div>';
  if(row&&row.tglLahir)previewUsia();
  om('mslm');setTimeout(function(){var el=G('slm-nama');if(el)el.focus();},180);
}

function previewUsia(){
  var inp=G('slm-tgl'),prev=G('slm-usia-prev');if(!inp||!prev)return;
  var val=inp.value;if(!val){prev.textContent='';return;}
  var d=new Date(val);if(isNaN(d.getTime())){prev.textContent='';return;}
  var now=new Date(),usia=now.getFullYear()-d.getFullYear(),m=now.getMonth()-d.getMonth();
  if(m<0||(m===0&&now.getDate()<d.getDate()))usia--;
  prev.textContent=usia>=0?'Usia: '+usia+' tahun':'';
}

function submitSlm(){
  var nama=(G('slm-nama')||{}).value||'';
  if(!nama.trim()){toast('Nama wajib diisi.','er');return;}
  var payload={nama:nama,tglLahir:(G('slm-tgl')||{}).value||'',unit:(G('slm-unit')||{}).value||'',wa:(G('slm-wa')||{}).value||''};
  if(_slmRow)payload._ri=_slmRow._ri;
  var action=_slmRow?'updateSatlinmas':'addSatlinmas';
  showLoad(_slmRow?'Menyimpan...':'Menambah...');cm('mslm');

  // ✅ GANTI
  apiPost(action,payload).then(function(res){
    hideLoad();
    if(res.success){toast(_slmRow?'Data diperbarui.':'Anggota ditambahkan.','ok');loadSatlinmas();}
    else toast('Gagal: '+(res.message||''),'er');
  });
}

// ══════════════════════════════════════════
//  PAGINATION
// ══════════════════════════════════════════
function pgBtns(cur,tot,fn){
  if(tot<=1)return'';
  var h='<button class="pbn" '+(cur<=1?'disabled':'')+' onclick="'+fn+'('+(cur-1)+')"><i class="fas fa-chevron-left fa-xs"></i></button>';
  var s=Math.max(1,cur-2),e=Math.min(tot,cur+2);
  for(var p=s;p<=e;p++)h+='<button class="pbn '+(p===cur?'on':'')+'" onclick="'+fn+'('+p+')">'+p+'</button>';
  h+='<button class="pbn" '+(cur>=tot?'disabled':'')+' onclick="'+fn+'('+(cur+1)+')"><i class="fas fa-chevron-right fa-xs"></i></button>';
  return h;
}
function pgInfo(st,tot,per){if(!tot)return'Tidak ada data';return'Menampilkan '+(st+1)+'–'+Math.min(st+per,tot)+' dari '+tot;}

function showErr(msg){
  G('ct').innerHTML='<div class="empty" style="padding:72px 20px">'
    +'<i class="fas fa-triangle-exclamation" style="color:var(--red);opacity:1;font-size:1.9rem"></i>'
    +'<p style="color:var(--red);font-weight:800;margin-top:9px">Gagal memuat data</p>'
    +'<p style="font-size:.7rem;margin-top:4px;color:var(--muted)">'+(msg||'Coba muat ulang.')+'</p>'
    +'<button class="bg2" style="margin-top:12px" onclick="loadDashboard()"><i class="fas fa-rotate-left"></i> Kembali</button>'
    +'</div>';
}
