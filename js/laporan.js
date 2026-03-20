// ================================================================
//  laporan.js — Logic Rekap, PDF, Edit, Input Laporan
//  Semua google.script.run sudah diganti dengan apiGet / apiPost
// ================================================================

// ══════════════════════════════════════════
//  REKAP
//  Sebelum: google.script.run.withSuccessHandler(fn).getRekapData({})
//  Sesudah: apiGet('getRekap', params).then(fn)
// ══════════════════════════════════════════
function loadRekap(){
  setNav('rk');setPage('Rekap Laporan','Data laporan patroli');sbClose();showLoad();
  dChart('bar');dChart('dnt');_rData=[];_rPg=1;_rFQ='';_rFFrom='';_rFTo='';

  // ✅ GANTI
  apiGet('getRekap').then(function(res){
    hideLoad();
    _rData=(res.data&&res.data.rows)?res.data.rows:(res.data||[]);
    _rPg=1;
    renderRekap();
  });
}

function makeChipDesktop(identitas){
  if(!identitas||identitas.toUpperCase()==='NIHIL')return'<span class="chip cm">Nihil</span>';
  var safe=esc(identitas);
  return'<span class="chip cr2" style="max-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:middle;cursor:pointer;transition:all .15s" title="'+safe+'" onclick="var s=this.style;var on=this.dataset.exp===\'1\';this.dataset.exp=on?\'0\':\'1\';s.maxWidth=on?\'110px\':\'none\';s.whiteSpace=on?\'nowrap\':\'normal\';s.overflow=on?\'hidden\':\'visible\';">'+safe+'</span>';
}

function buildRekapRows(sl,st,isAdm){
  var rows='',cards='';
  if(!sl.length){
    rows='<tr><td colspan="11"><div class="empty"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div></td></tr>';
    cards='<div class="empty"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div>';
  }else{
    sl.forEach(function(r,i){
      var fotArr=r.fotos||[],fotThumb=r.fotosThumb||fotArr;
      var chip=makeChipDesktop(r.identitas);var chipMob=mcardChip(r.identitas,'cr2');
      var ck=rcSet(r);
      var fotCell=fotArr.length?'<button class="bfot" onclick="var rx=rcGet(\''+ck+'\');galOpen(rx.fotos,rx.fotosThumb||rx.fotos,0)"><i class="fas fa-images"></i> '+fotArr.length+'</button>':'—';
      var fotBtnMob=fotArr.length?'<button class="bfot" onclick="var rx=rcGet(\''+ck+'\');galOpen(rx.fotos,rx.fotosThumb||rx.fotos,0)"><i class="fas fa-images"></i> '+fotArr.length+'</button>':'';
      var aksi='<button class="bpdf" onclick="openPdf(rcGet(\''+ck+'\'))"><i class="fas fa-file-pdf"></i></button>';
      if(isAdm){aksi+=' <button class="be" onclick="openEditModal(rcGet(\''+ck+'\'))"><i class="fas fa-pen"></i></button> <button class="bd" onclick="konfirmHapus(\'laporan\',rcGet(\''+ck+'\')._ri)"><i class="fas fa-trash"></i></button>';}
      rows+='<tr>'
        +'<td style="color:var(--muted);font-family:var(--mono);font-size:.63rem">'+(st+i+1)+'</td>'
        +'<td style="font-size:.66rem;white-space:nowrap;font-family:var(--mono)">'+esc(r.ts)+'</td>'
        +'<td style="font-weight:600;max-width:130px">'+esc(r.lokasi)+'</td>'
        +'<td><span class="chip ca2">'+esc(r.hari)+'</span></td>'
        +'<td style="white-space:nowrap;font-size:.69rem">'+esc(r.tanggal)+'</td>'
        +'<td>'+chip+'</td>'
        +'<td style="font-size:.67rem;max-width:120px;color:var(--mid)">'+esc(r.personil)+'</td>'
        +'<td><span class="chip cb2">'+esc(r.danru)+'</span></td>'
        +'<td style="font-size:.69rem">'+esc(r.namaDanru)+'</td>'
        +'<td>'+fotCell+'</td>'
        +'<td style="white-space:nowrap">'+aksi+'</td>'
        +'</tr>';
      var aksiMob='<button class="bpdf" onclick="openPdf(rcGet(\''+ck+'\'))"><i class="fas fa-file-pdf"></i></button>';
      if(isAdm){aksiMob+=' <button class="be" onclick="openEditModal(rcGet(\''+ck+'\'))"><i class="fas fa-pen"></i></button> <button class="bd" onclick="konfirmHapus(\'laporan\',rcGet(\''+ck+'\')._ri)"><i class="fas fa-trash"></i></button>';}
      cards+='<div class="mcard-item">'
        +'<div class="mcard-row">'+mcardLokasi(r.lokasi)+chipMob+'</div>'
        +'<div class="mcard-meta"><i class="fas fa-calendar-day" style="color:var(--amber);width:12px"></i> '+esc(r.hari)+', '+esc(r.tanggal)+'<br>'
        +'<i class="fas fa-users" style="color:var(--blue);width:12px"></i> '+mcardPersonil(r.personil)+(r.namaDanru?' · Danru: '+esc(r.namaDanru):'')
        +(fotArr.length?'<br><i class="fas fa-images" style="color:var(--green);width:12px"></i> '+fotArr.length+' foto':'')
        +'</div><div class="mcard-acts">'+fotBtnMob+' '+aksiMob+'</div></div>';
    });
  }
  return{rows:rows,cards:cards};
}

function renderRekap(){
  var isAdm=SES&&SES.role==='admin';
  var flt=filterR(),tot=flt.length,pages=Math.max(1,Math.ceil(tot/PER));
  _rPg=Math.min(_rPg,pages);var st=(_rPg-1)*PER,sl=flt.slice(st,st+PER);
  var rc=buildRekapRows(sl,st,isAdm);
  if(!G('r-tbody')){
    var h='<div class="fu"><div class="panel">'
      +'<div class="phd"><span class="ptl"><i class="fas fa-table-list"></i> Rekap Laporan</span>'
      +'<div class="fbar-right"><span id="r-count" style="font-size:.66rem;color:var(--muted);font-family:var(--mono)">'+tot+'</span>'
      +'<button class="bppl" onclick="openKolektifModal()"><i class="fas fa-print"></i> Kolektif</button></div></div>'
      +'<div class="fbar">'
      +'<div class="fsrch" style="flex:2 1 150px"><i class="fas fa-search fsi"></i><input class="fctl" type="text" id="ft-q" placeholder="Cari lokasi, personil, danru..." oninput="rFiltDebounce()"></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><label style="font-size:.65rem;color:var(--mid);font-weight:700;white-space:nowrap">Dari:</label><input class="fctl" type="date" id="ft-from" style="min-width:0;flex:1" onchange="rFilt()"></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><label style="font-size:.65rem;color:var(--mid);font-weight:700;white-space:nowrap">S/d:</label><input class="fctl" type="date" id="ft-to" style="min-width:0;flex:1" onchange="rFilt()"></div>'
      +'<button class="bg2" onclick="rReset()"><i class="fas fa-rotate-left"></i></button>'
      +'</div>'
      +'<div class="twrap"><table class="dtbl"><thead><tr><th>#</th><th>Timestamp</th><th>Lokasi</th><th>Hari</th><th>Tanggal</th><th>Pelanggaran</th><th>Personil</th><th>Danru</th><th>Nama Danru</th><th>Foto</th><th>Aksi</th></tr></thead>'
      +'<tbody id="r-tbody">'+rc.rows+'</tbody></table></div>'
      +'<div class="mcard-list" id="r-cards">'+rc.cards+'</div>'
      +'<div class="pgw" id="r-pgw"><span>'+pgInfo(st,tot,PER)+'</span><div class="pbs">'+pgBtns(_rPg,pages,'rPage')+'</div></div>'
      +'</div></div>';
    G('ct').innerHTML=h;
  }else{
    G('r-tbody').innerHTML=rc.rows;G('r-cards').innerHTML=rc.cards;
    G('r-pgw').innerHTML='<span>'+pgInfo(st,tot,PER)+'</span><div class="pbs">'+pgBtns(_rPg,pages,'rPage')+'</div>';
    if(G('r-count'))G('r-count').textContent=tot;
  }
}

function filterR(){
  return _rData.filter(function(r){
    if(_rFQ){var q=_rFQ.toLowerCase();if((r.lokasi||'').toLowerCase().indexOf(q)<0&&(r.tanggal||'').toLowerCase().indexOf(q)<0&&(r.hari||'').toLowerCase().indexOf(q)<0&&(r.personil||'').toLowerCase().indexOf(q)<0&&(r.identitas||'').toLowerCase().indexOf(q)<0&&(r.danru||'').toLowerCase().indexOf(q)<0&&(r.namaDanru||'').toLowerCase().indexOf(q)<0)return false;}
    if(_rFFrom){var df=parseISODate(_rFFrom);if(df){var dt=parseTglID(r.tanggal);if(!dt||dt<df)return false;}}
    if(_rFTo){var dto=parseISODate(_rFTo);if(dto){dto.setHours(23,59,59,999);var dt2=parseTglID(r.tanggal);if(!dt2||dt2>dto)return false;}}
    return true;
  });
}

function parseISODate(s){if(!s)return null;var m=/(\d{4})-(\d{2})-(\d{2})/.exec(s);return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function parseTglID(s){
  if(!s)return null;
  var BLN={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
  var b=s.replace(/^[A-Za-z]+,?\s*/,'').trim().toLowerCase();
  var m=/(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(b);if(m&&BLN[m[2]])return new Date(+m[3],BLN[m[2]]-1,+m[1]);
  var m2=/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);if(m2)return new Date(+m2[3],+m2[2]-1,+m2[1]);
  return null;
}

var _rFiltTimer=null;
function renderRekapBody(){
  var isAdm=SES&&SES.role==='admin';
  var flt=filterR(),tot=flt.length,pages=Math.max(1,Math.ceil(tot/PER));
  _rPg=Math.min(_rPg,pages);var st=(_rPg-1)*PER,sl=flt.slice(st,st+PER);
  var rc=buildRekapRows(sl,st,isAdm);
  if(G('r-tbody'))G('r-tbody').innerHTML=rc.rows;
  if(G('r-cards'))G('r-cards').innerHTML=rc.cards;
  if(G('r-pgw'))G('r-pgw').innerHTML='<span>'+pgInfo(st,tot,PER)+'</span><div class="pbs">'+pgBtns(_rPg,pages,'rPage')+'</div>';
  if(G('r-count'))G('r-count').textContent=tot;
}
function rFiltDebounce(){clearTimeout(_rFiltTimer);_rFiltTimer=setTimeout(function(){_rFQ=G('ft-q')?G('ft-q').value:'';_rPg=1;renderRekapBody();},200);}
function rFilt(){_rFQ=G('ft-q')?G('ft-q').value:'';_rFFrom=G('ft-from')?G('ft-from').value:'';_rFTo=G('ft-to')?G('ft-to').value:'';_rPg=1;renderRekapBody();}
function rReset(){_rFQ='';_rFFrom='';_rFTo='';_rPg=1;if(G('ft-q'))G('ft-q').value='';if(G('ft-from'))G('ft-from').value='';if(G('ft-to'))G('ft-to').value='';renderRekapBody();}
function rPage(p){_rPg=p;renderRekapBody();}

// ══════════════════════════════════════════
//  PDF SINGLE
//  Sebelum: google.script.run.withSuccessHandler(fn).generateLaporanHtml(payload)
//  Sesudah: apiPost('generateLaporanHtml', payload).then(fn)
// ══════════════════════════════════════════
function togglePdfTtd(){
  var box=G('pdf-ttd-box'),lbl=G('pdf-ttd-lbl');
  var on=box.classList.contains('on');box.classList.toggle('on');
  lbl.textContent=on?'Ubah Data Pejabat TTD ▸':'Sembunyikan Data Pejabat TTD ▾';
}

function tglIDStr(d){
  var BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return d.getDate()+' '+BLN[d.getMonth()]+' '+d.getFullYear();
}

function openPdf(row){
  if(!row){toast('Data tidak ditemukan.','er');return;}
  _pdfRow=row;var now=new Date();
  G('pdf-judulsub').value=(row.lokasi||'').toUpperCase();
  G('pdf-hari').value=row.hari||'';G('pdf-tanggal').value=row.tanggal||'';
  G('pdf-tujuan').value='Melaksanakan Monitoring Dan Pengamanan Area Wisata Pedestrian';
  var ns=G('pdf-nospt');if(ns)ns.value='';
  G('pdf-lokasi').value=row.lokasi||'';
  G('pdf-anggota').value='Regu Pedestrian, Anggota Bidang Linmas, Satpol PP';
  G('pdf-pukul').value='16.00 – 00.00 WIB';
  var idn=row.identitas||'';var isNihil=idn.trim()===''||idn.toUpperCase()==='NIHIL';
  G('pdf-identitas').value=isNihil?'':idn;G('pdf-uraian').value='';G('pdf-tglsurat').value=tglIDStr(now);
  var box=G('pdf-ttd-box');if(box)box.classList.remove('on');
  var lbl=G('pdf-ttd-lbl');if(lbl)lbl.textContent='Ubah Data Pejabat TTD ▸';
  om('mpdf');refreshPdfPreview();
}

function refreshPdfPreview(){
  showLoad('Menyiapkan preview...');

  // ✅ GANTI
  apiPost('generateLaporanHtml',{
    judulSub:G('pdf-judulsub').value,hari:G('pdf-hari').value,tanggal:G('pdf-tanggal').value,
    tujuan:G('pdf-tujuan').value,nomorSpt:(G('pdf-nospt')||{}).value||'',
    lokasi:G('pdf-lokasi').value,anggota:G('pdf-anggota').value,pukul:G('pdf-pukul').value,
    identitas:G('pdf-identitas').value,uraian:G('pdf-uraian').value,tglSurat:G('pdf-tglsurat').value,
    jabatanTtd:G('pdf-jabatan').value,namaTtd:G('pdf-namatd').value,
    pangkatTtd:G('pdf-pangkat').value,nipTtd:G('pdf-nip').value,
    fotos:_pdfRow?(_pdfRow.fotos||[]):[]
  }).then(function(res){
    hideLoad();
    if(!res.success){toast('Gagal: '+res.message,'er');return;}
    var html=(res.data&&res.data.html)?res.data.html:res.html;
    G('pdfframe').srcdoc=html;
  });
}

function doPrint(fid){
  var fr=G(fid);
  if(fr&&fr.contentWindow){fr.contentWindow.focus();fr.contentWindow.print();}
  else toast('Preview belum siap.','inf');
}

// ══════════════════════════════════════════
//  CETAK KOLEKTIF
//  Sebelum: google.script.run.withSuccessHandler(fn).generateKolektifHtml(payload)
//  Sesudah: apiPost('generateKolektifHtml', payload).then(fn)
// ══════════════════════════════════════════
function openKolektifModal(){
  var now=new Date(),y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0');
  G('kol-from').value=y+'-'+m+'-01';
  G('kol-to').value=y+'-'+m+'-'+String(now.getDate()).padStart(2,'0');
  G('kol-info').innerHTML='Pilih rentang tanggal lalu klik Perbarui Preview.';
  G('kol-printbtn').disabled=true;G('kol-printbtn').style.opacity='.4';
  G('kolframe').style.display='none';G('kol-empty').style.display='flex';
  om('mkolektif');
}

function previewKolektif(){
  var from=G('kol-from').value,to=G('kol-to').value;
  var rows=_rData.filter(function(r){
    if(from){var df=parseISODate(from);if(df){var dt=parseTglID(r.tanggal);if(!dt||dt<df)return false;}}
    if(to){var dto=parseISODate(to);if(dto){dto.setHours(23,59,59,999);var dt2=parseTglID(r.tanggal);if(!dt2||dt2>dto)return false;}}
    return true;
  }).slice().reverse();
  _kolData=rows;
  G('kol-info').innerHTML='Ditemukan <strong>'+rows.length+'</strong> laporan'+(rows.length?' (termasuk '+rows.filter(function(r){return r.identitas&&r.identitas.toUpperCase()!=='NIHIL'&&r.identitas!=='';}).length+' pelanggaran).':'.');
  if(!rows.length){
    G('kolframe').style.display='none';G('kol-empty').style.display='flex';
    G('kol-printbtn').disabled=true;G('kol-printbtn').style.opacity='.4';return;
  }
  showLoad('Menyiapkan preview kolektif...');

  // ✅ GANTI
  apiPost('generateKolektifHtml',{rows:rows,tglFrom:from,tglTo:to}).then(function(res){
    hideLoad();
    if(!res.success){toast('Gagal: '+res.message,'er');return;}
    var html=(res.data&&res.data.html)?res.data.html:res.html;
    G('kol-empty').style.display='none';
    G('kolframe').style.display='block';
    G('kolframe').srcdoc=html;
    G('kol-printbtn').disabled=false;
    G('kol-printbtn').style.opacity='1';
  });
}

// ══════════════════════════════════════════
//  EDIT LAPORAN
//  Sebelum: google.script.run.withSuccessHandler(fn).getRekapData({})
//  Sesudah: apiGet('getRekap').then(fn)
// ══════════════════════════════════════════
function loadEdit(){
  if(SES&&SES.role!=='admin'){toast('Akses ditolak.','er');return;}
  setNav('ed');setPage('Edit Laporan','Kelola data laporan');sbClose();showLoad();
  dChart('bar');dChart('dnt');_rData=[];_rPg=1;_rFQ='';_rFFrom='';_rFTo='';

  // ✅ GANTI
  apiGet('getRekap').then(function(res){
    hideLoad();
    _rData=(res.data&&res.data.rows)?res.data.rows:(res.data||[]);
    _rPg=1;renderEdit();
  });
}

function buildEditRows(sl,st){
  var rows='',cards='';
  if(!sl.length){
    rows='<tr><td colspan="10"><div class="empty"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div></td></tr>';
    cards='<div class="empty"><i class="fas fa-inbox"></i><p>Tidak ada data</p></div>';
  }else{
    sl.forEach(function(r){
      var fotArr=r.fotos||[],fotThumb=r.fotosThumb||fotArr;
      var chip=makeChipDesktop(r.identitas);var chipMob=mcardChip(r.identitas,'cr2');
      var ck=rcSet(r);
      var fotCell=fotArr.length?'<button class="bfot" onclick="var rx=rcGet(\''+ck+'\');galOpen(rx.fotos,rx.fotosThumb||rx.fotos,0)"><i class="fas fa-images"></i> '+fotArr.length+'</button>':'—';
      var aksi='<button class="be" onclick="openEditModal(rcGet(\''+ck+'\'))"><i class="fas fa-pen"></i> Edit</button> <button class="bd" onclick="konfirmHapus(\'laporan\',rcGet(\''+ck+'\')._ri)"><i class="fas fa-trash"></i></button>';
      rows+='<tr>'
        +'<td style="font-size:.66rem;white-space:nowrap;font-family:var(--mono)">'+esc(r.ts)+'</td>'
        +'<td style="font-weight:600;max-width:130px">'+esc(r.lokasi)+'</td>'
        +'<td><span class="chip ca2">'+esc(r.hari)+'</span></td>'
        +'<td style="white-space:nowrap;font-size:.69rem">'+esc(r.tanggal)+'</td>'
        +'<td>'+chip+'</td>'
        +'<td style="font-size:.67rem;max-width:120px;color:var(--mid)">'+esc(r.personil)+'</td>'
        +'<td><span class="chip cb2">'+esc(r.danru)+'</span></td>'
        +'<td style="font-size:.69rem">'+esc(r.namaDanru)+'</td>'
        +'<td>'+fotCell+'</td>'
        +'<td style="white-space:nowrap">'+aksi+'</td>'
        +'</tr>';
      var fotBtnMob=fotArr.length?'<button class="bfot" onclick="var rx=rcGet(\''+ck+'\');galOpen(rx.fotos,rx.fotosThumb||rx.fotos,0)"><i class="fas fa-images"></i> '+fotArr.length+'</button>':'';
      cards+='<div class="mcard-item"><div class="mcard-row">'+mcardLokasi(r.lokasi)+chipMob+'</div>'
        +'<div class="mcard-meta"><i class="fas fa-calendar-day" style="color:var(--amber);width:12px"></i> '+esc(r.hari)+', '+esc(r.tanggal)+'<br>'
        +'<i class="fas fa-users" style="color:var(--blue);width:12px"></i> '+mcardPersonil(r.personil)+(r.namaDanru?' · Danru: '+esc(r.namaDanru):'')
        +(fotArr.length?'<br><i class="fas fa-images" style="color:var(--green);width:12px"></i> '+fotArr.length+' foto':'')
        +'</div><div class="mcard-acts">'+fotBtnMob+' '+aksi+'</div></div>';
    });
  }
  return{rows:rows,cards:cards};
}

function renderEdit(){
  var flt=filterR(),tot=flt.length,pages=Math.max(1,Math.ceil(tot/PER));
  _rPg=Math.min(_rPg,pages);var st=(_rPg-1)*PER,sl=flt.slice(st,st+PER);var rc=buildEditRows(sl,st);
  if(!G('e-tbody')){
    var h='<div class="fu"><div class="panel">'
      +'<div class="phd"><span class="ptl"><i class="fas fa-file-pen"></i> Daftar Laporan</span><span id="e-count" style="font-size:.66rem;color:var(--muted);font-family:var(--mono)">'+tot+'</span></div>'
      +'<div class="fbar">'
      +'<div class="fsrch" style="flex:2 1 150px"><i class="fas fa-search fsi"></i><input class="fctl" type="text" id="ft-q" placeholder="Cari lokasi, tanggal, danru..." oninput="eFiltDebounce()"></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><label style="font-size:.65rem;color:var(--mid);font-weight:700;white-space:nowrap">Dari:</label><input class="fctl" type="date" id="ft-from" style="min-width:0" onchange="rFilt()"></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><label style="font-size:.65rem;color:var(--mid);font-weight:700;white-space:nowrap">S/d:</label><input class="fctl" type="date" id="ft-to" style="min-width:0" onchange="rFilt()"></div>'
      +'<button class="bg2" onclick="rReset()"><i class="fas fa-rotate-left"></i></button>'
      +'</div>'
      +'<div class="twrap"><table class="dtbl"><thead><tr><th>Timestamp</th><th>Lokasi</th><th>Hari</th><th>Tanggal</th><th>Pelanggaran</th><th>Personil</th><th>Danru</th><th>Nama Danru</th><th>Foto</th><th>Aksi</th></tr></thead>'
      +'<tbody id="e-tbody">'+rc.rows+'</tbody></table></div>'
      +'<div class="mcard-list" id="e-cards">'+rc.cards+'</div>'
      +'<div class="pgw" id="e-pgw"><span>'+pgInfo(st,tot,PER)+'</span><div class="pbs">'+pgBtns(_rPg,pages,'ePage')+'</div></div>'
      +'</div></div>';
    G('ct').innerHTML=h;
  }else{
    G('e-tbody').innerHTML=rc.rows;G('e-cards').innerHTML=rc.cards;
    G('e-pgw').innerHTML='<span>'+pgInfo(st,tot,PER)+'</span><div class="pbs">'+pgBtns(_rPg,pages,'ePage')+'</div>';
    if(G('e-count'))G('e-count').textContent=tot;
  }
}

var _eFiltTimer=null;
function eFiltDebounce(){clearTimeout(_eFiltTimer);_eFiltTimer=setTimeout(function(){_rFQ=G('ft-q')?G('ft-q').value:'';_rPg=1;renderEditBody();},200);}
function renderEditBody(){
  var flt=filterR(),tot=flt.length,pages=Math.max(1,Math.ceil(tot/PER));
  _rPg=Math.min(_rPg,pages);var st=(_rPg-1)*PER,sl=flt.slice(st,st+PER);var rc=buildEditRows(sl,st);
  if(G('e-tbody'))G('e-tbody').innerHTML=rc.rows;if(G('e-cards'))G('e-cards').innerHTML=rc.cards;
  if(G('e-pgw'))G('e-pgw').innerHTML='<span>'+pgInfo(st,tot,PER)+'</span><div class="pbs">'+pgBtns(_rPg,pages,'ePage')+'</div>';
  if(G('e-count'))G('e-count').textContent=tot;
}
function ePage(p){_rPg=p;renderEditBody();}

function makeDriveThumbUrl(url){
  if(!url)return'';if(url.startsWith('data:'))return url;
  var m1=/[?&]id=([^&]+)/.exec(url);if(m1)return'https://drive.google.com/thumbnail?id='+m1[1]+'&sz=w400';
  var m2=/\/file\/d\/([^\/]+)/.exec(url);if(m2)return'https://drive.google.com/thumbnail?id='+m2[1]+'&sz=w400';
  return url;
}

function openEditModal(row){
  if(!row){toast('Data tidak ditemukan.','er');return;}
  _editRow=row;
  _editFotos=(row.fotos||[]).map(function(u){return{src:makeDriveThumbUrl(u),url:u,isNew:false};});
  var days=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
  var dOpts=days.map(function(d){return'<option value="'+d+'"'+(row.hari===d?' selected':'')+'>'+d+'</option>';}).join('');
  G('medit-body').innerHTML=''
    +'<div class="frow"><div class="fcol"><label class="flbl">Lokasi <span class="req">*</span></label><input class="fctl" id="ed-lok" value="'+esc(row.lokasi)+'"></div>'
    +'<div class="fcol"><label class="flbl">Hari</label><select class="fctl" id="ed-hari">'+dOpts+'</select></div></div>'
    +'<div class="frow"><div class="fcol"><label class="flbl">Tanggal</label><input class="fctl" id="ed-tgl" value="'+esc(row.tanggal)+'"></div>'
    +'<div class="fcol"><label class="flbl">Identitas / Pelanggar</label><textarea class="fctl" id="ed-idn" rows="3" placeholder="NIHIL atau isi identitas">'+esc(row.identitas)+'</textarea></div></div>'
    +'<div class="fgrp"><label class="flbl">Personil</label><input class="fctl" id="ed-per" value="'+esc(row.personil)+'"></div>'
    +'<div class="frow"><div class="fcol"><label class="flbl">Danru</label><input class="fctl" id="ed-dan" value="'+esc(row.danru)+'"></div>'
    +'<div class="fcol"><label class="flbl">Nama Danru</label><input class="fctl" id="ed-ndan" value="'+esc(row.namaDanru)+'"></div></div>'
    +'<div class="fgrp"><label class="flbl">Foto</label><div class="fgrd" id="ed-fgrd"></div></div>';
  renderEditFotoGrid();
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.multiple=true;inp.style.display='none';inp.id='ed-finp';
  inp.addEventListener('change',function(e){addEditFotos(e.target.files);inp.value='';});
  G('medit-body').appendChild(inp);om('medit');
}

function renderEditFotoGrid(){
  var g=G('ed-fgrd');if(!g)return;g.innerHTML='';
  _editFotos.forEach(function(f,i){
    var div=document.createElement('div');div.className='fitem';
    var img=document.createElement('img');img.src=f.src||f.url||'';
    img.style.cssText='width:100%;height:100%;object-fit:cover;display:block;cursor:pointer;';
    img.onerror=(function(fi,imgEl,divEl){return function(){
      var stage=parseInt(imgEl.dataset.stage||'0');imgEl.onerror=null;
      if(stage===0){imgEl.dataset.stage='1';var orig=fi.url||'';if(orig&&imgEl.src!==orig){imgEl.onerror=arguments.callee;imgEl.src=orig;return;}stage=1;}
      if(stage===1){imgEl.dataset.stage='2';var furl=fi.url||'';var mx2=/\/file\/d\/([^\/]+)/.exec(furl);var mx1=/[?&]id=([^&]+)/.exec(furl);var fid=mx2?mx2[1]:(mx1?mx1[1]:'');if(fid){var lh3url='https://lh3.googleusercontent.com/d/'+fid+'=w400';imgEl.onerror=function(){imgEl.onerror=null;showFotoPlaceholder(imgEl,divEl);};imgEl.src=lh3url;return;}}
      showFotoPlaceholder(imgEl,divEl);
    };})(f,img,div);
    img.onclick=(function(idx){return function(){var origUrls=_editFotos.map(function(x){return x.url||x.src;});var thumbUrls=_editFotos.map(function(x){return x.src||x.url;});galOpen(origUrls,thumbUrls,idx);};})(i);
    var del=document.createElement('button');del.className='fdel';del.innerHTML='<i class="fas fa-times"></i>';
    del.onclick=(function(ii){return function(e){e.stopPropagation();_editFotos.splice(ii,1);renderEditFotoGrid();};})(i);
    var num=document.createElement('div');num.className='fnum';num.textContent=i+1;
    div.appendChild(img);div.appendChild(del);div.appendChild(num);g.appendChild(div);
  });
  if(_editFotos.length<10){
    var btn=document.createElement('button');btn.className='fadd';
    btn.innerHTML='<i class="fas fa-plus"></i><span>Tambah</span>';
    btn.onclick=function(){var fi=G('ed-finp');if(fi)fi.click();};
    g.appendChild(btn);
  }
}

function showFotoPlaceholder(imgEl,divEl){
  if(divEl)divEl.style.background='#f0f0f0';imgEl.onerror=null;
  imgEl.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23e8e8e8"%2F%3E%3Ctext x="40" y="47" text-anchor="middle" fill="%23bbb" font-size="9" font-family="sans-serif"%3EFoto%3C%2Ftext%3E%3C%2Fsvg%3E';
}

function addEditFotos(files){
  var rem=10-_editFotos.length;
  for(var i=0;i<Math.min(files.length,rem);i++){
    (function(file){
      var rd=new FileReader();
      rd.onload=function(e){_editFotos.push({src:e.target.result,isNew:true,data:e.target.result,mime:file.type});renderEditFotoGrid();};
      rd.readAsDataURL(file);
    })(files[i]);
  }
}

function submitEdit(){
  if(!_editRow)return;
  var lok=(G('ed-lok')||{}).value||'';
  if(!lok.trim()){toast('Lokasi wajib diisi.','er');return;}
  var fPay=_editFotos.map(function(f){return f.isNew?{data:f.data,mime:f.mime}:f.url;});
  showLoad('Menyimpan...');cm('medit');

  // ✅ GANTI
  apiPost('updateLaporan',{
    _ri:_editRow._ri,lokasi:lok,
    hari:(G('ed-hari')||{}).value||'',tanggal:(G('ed-tgl')||{}).value||'',
    identitas:(G('ed-idn')||{}).value||'',personil:(G('ed-per')||{}).value||'',
    danru:(G('ed-dan')||{}).value||'',namaDanru:(G('ed-ndan')||{}).value||'',
    fotos:fPay
  }).then(function(res){
    hideLoad();
    if(res.success){toast('Laporan berhasil diperbarui.','ok');loadEdit();}
    else toast('Gagal: '+(res.message||''),'er');
  });
}

// ══════════════════════════════════════════
//  KONFIRM HAPUS
//  Sebelum: google.script.run.withSuccessHandler(fn).deleteLaporan(ri)
//  Sesudah: apiPost('deleteLaporan', { ri }).then(fn)
// ══════════════════════════════════════════
function konfirmHapus(mode,ri){
  _hpsMode=mode;_hpsRi=ri;
  G('mconf-msg').textContent=mode==='satlinmas'?'Hapus data anggota ini? Tidak dapat dibatalkan.':'Hapus laporan ini? Tidak dapat dibatalkan.';
  G('mbtnhps').onclick=function(){doHapus();};om('mconf');
}

function doHapus(){
  if(!_hpsRi&&_hpsRi!==0)return;showLoad('Menghapus...');cm('mconf');
  if(_hpsMode==='satlinmas'){
    // ✅ GANTI
    apiPost('deleteSatlinmas',{ri:_hpsRi}).then(function(res){
      hideLoad();
      if(res.success){toast('Anggota dihapus.','ok');loadSatlinmas();}
      else toast('Gagal: '+(res.message||''),'er');
    });
  }else{
    // ✅ GANTI
    apiPost('deleteLaporan',{ri:_hpsRi}).then(function(res){
      hideLoad();
      if(res.success){
        toast('Laporan dihapus.','ok');
        var an=document.querySelector('.nb.on');
        if(an&&an.id==='nav-rk')loadRekap();else loadEdit();
      }else toast('Gagal: '+(res.message||''),'er');
    });
  }
}

// ══════════════════════════════════════════
//  INPUT LAPORAN
//  Sebelum: google.script.run.withSuccessHandler(fn).addLaporan(payload)
//  Sesudah: apiPost('addLaporan', payload).then(fn)
// ══════════════════════════════════════════
var _inFotos=[],_inMode='manual';

function loadInput(){
  if(SES&&SES.role!=='admin'){toast('Akses ditolak.','er');return;}
  setNav('in');setPage('Input Laporan','Tambah laporan baru');sbClose();
  dChart('bar');dChart('dnt');_inFotos=[];_inMode='manual';
  var days=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
  var dOpts=days.map(function(d){return'<option>'+d+'</option>';}).join('');
  var bulan=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var bOpts=bulan.map(function(b,i){return'<option value="'+(i+1)+'">'+b+'</option>';}).join('');
  var now=new Date(),cy=now.getFullYear();
  var thnOpts='';for(var y=cy-1;y<=cy+4;y++)thnOpts+='<option value="'+y+'"'+(y===cy?' selected':'')+'>'+y+'</option>';
  var h='<div class="fu"><div class="panel" style="max-width:800px">'
    +'<div class="phd"><span class="ptl"><i class="fas fa-plus-circle"></i> Input Laporan Baru</span></div><div class="pbd">'
    +'<div class="in-tabs">'
    +'<button class="in-tab on" id="tab-manual" onclick="switchInTab(\'manual\')"><i class="fas fa-keyboard"></i> Input Manual</button>'
    +'<button class="in-tab" id="tab-wa" onclick="switchInTab(\'wa\')"><i class="fab fa-whatsapp"></i> Format WA</button>'
    +'</div>'
    +'<div id="in-panel-wa" style="display:none">'
    +'<div class="fgrp"><label class="flbl">Tempel Teks Laporan WA <span class="req">*</span></label>'
    +'<textarea class="wa-ta" id="wa-teks" placeholder="Tempel teks laporan dari WhatsApp di sini..."></textarea>'
    +'<div class="wa-err" id="wa-err"><i class="fas fa-circle-xmark"></i><span id="wa-err-msg"></span></div>'
    +'<div class="wa-prev" id="wa-prev"><div class="wa-prev-head"><i class="fas fa-circle-check"></i> Berhasil diparse — periksa lalu klik Lanjut ke Form</div><div id="wa-prev-body"></div></div>'
    +'<div style="display:flex;gap:7px;margin-top:10px"><button class="bp" onclick="parseWA()"><i class="fas fa-wand-magic-sparkles"></i> Parse Teks</button>'
    +'<button class="bg2" id="wa-btn-lanjut" style="display:none" onclick="waLanjutKeForm()"><i class="fas fa-arrow-right"></i> Lanjut ke Form</button></div></div></div>'
    +'<div id="in-panel-manual">'
    +'<div class="fgrp"><label class="flbl">Tanggal <span class="req">*</span></label>'
    +'<div style="display:grid;grid-template-columns:64px 1fr 84px;gap:7px">'
    +'<select class="fctl" id="in-tgl-h" onchange="syncTglStr()">'+buildTglOpts(1,31)+'</select>'
    +'<select class="fctl" id="in-tgl-b" onchange="syncTglStr()">'+bOpts+'</select>'
    +'<select class="fctl" id="in-tgl-y" onchange="syncTglStr()">'+thnOpts+'</select>'
    +'</div><input type="hidden" id="in-tgl-str"></div>'
    +'<div class="frow"><div class="fcol"><label class="flbl">Hari <span class="req">*</span></label><select class="fctl" id="in-hari">'+dOpts+'</select></div>'
    +'<div class="fcol"><label class="flbl">Lokasi Patroli <span class="req">*</span></label><input class="fctl" id="in-lok" placeholder="Nama jalan / lokasi"></div></div>'
    +'<div class="fgrp"><label class="flbl">Personil <span class="req">*</span></label><input class="fctl" id="in-per" placeholder="Nama personil, dipisah koma"></div>'
    +'<div class="fgrp"><label class="flbl">Identitas / Pelanggar</label><textarea class="fctl" id="in-idn" rows="3" placeholder="NIHIL atau isi identitas pelanggar">NIHIL</textarea></div>'
    +'<div class="frow"><div class="fcol"><label class="flbl">Danru</label><input class="fctl" id="in-dan" placeholder="Danru 1"></div>'
    +'<div class="fcol"><label class="flbl">Nama Danru</label><input class="fctl" id="in-ndan" placeholder="Nama danru"></div></div>'
    +'<div class="fgrp"><label class="flbl">Foto Dokumentasi <span style="color:var(--muted);font-weight:400;text-transform:none;font-size:.6rem">(maks 10)</span></label>'
    +'<div style="display:flex;gap:7px;margin-bottom:7px"><button class="bg2" onclick="GG(\'in-gal\').click()"><i class="fas fa-images"></i> Galeri</button><button class="bg2" onclick="GG(\'in-cam\').click()"><i class="fas fa-camera"></i> Kamera</button></div>'
    +'<div class="fgrd" id="in-fgrd"></div></div>'
    +'<div id="in-msg" style="display:none;margin-bottom:10px"></div>'
    +'<div style="display:flex;gap:7px"><button class="bp" onclick="submitInput()"><i class="fas fa-save"></i> Simpan</button><button class="bg2" onclick="resetInput()"><i class="fas fa-rotate-left"></i> Reset</button></div>'
    +'</div></div></div></div>';
  G('ct').innerHTML=h;
  G('in-tgl-h').value=now.getDate();G('in-tgl-b').value=now.getMonth()+1;syncTglStr();
  var dayN=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];G('in-hari').value=dayN[now.getDay()];
  renderInFotoGrid();
  var ig=document.createElement('input');ig.type='file';ig.id='in-gal';ig.accept='image/*';ig.multiple=true;ig.style.display='none';
  ig.addEventListener('change',function(e){addInFotos(e.target.files);ig.value='';});
  var ic=document.createElement('input');ic.type='file';ic.id='in-cam';ic.accept='image/*';ic.capture='environment';ic.style.display='none';
  ic.addEventListener('change',function(e){addInFotos(e.target.files);ic.value='';});
  G('ct').appendChild(ig);G('ct').appendChild(ic);
}

function switchInTab(mode){
  _inMode=mode;
  var tabs={manual:G('tab-manual'),wa:G('tab-wa')};
  var panels={manual:G('in-panel-manual'),wa:G('in-panel-wa')};
  Object.keys(tabs).forEach(function(k){if(tabs[k])tabs[k].classList.toggle('on',k===mode);if(panels[k])panels[k].style.display=k===mode?'':'none';});
}

var _waParsed=null;
function _bersihWA(teks){return teks.replace(/[\*\_\~\u200B\u200C\u200D\uFEFF]/g,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();}
function _parseWAClient(teks){
  var bersih=_bersihWA(teks);
  var hasil={lokasi:'',hari:'',tanggal:'',identitas:'',personil:'',danru:'',namaDanru:''};
  var mLok=/Patroli\s+([\s\S]+?)\s+Sebagai/i.exec(bersih);if(!mLok)mLok=/Patroli\s+(.+)/i.exec(bersih.split('\n')[0]);
  if(mLok)hasil.lokasi=mLok[1].replace(/\n/g,' ').trim();
  var mHari=/Hari\s*:\s*(.+)/i.exec(bersih);if(mHari)hasil.hari=mHari[1].split('\n')[0].trim();
  var mTgl=/Tanggal\s*:\s*(.+)/i.exec(bersih);if(mTgl)hasil.tanggal=mTgl[1].split('\n')[0].trim();
  var mIdn=/Identitas\s*[\/\\]\s*Nama\s*Pelanggaran\s*\n+([^\n]+)/i.exec(bersih);
  if(!mIdn)mIdn=/Identitas\s*[\/\\]\s*Nama\s*Pelanggaran\s*:?\s*([^\n]+)/i.exec(bersih);
  if(mIdn)hasil.identitas=mIdn[1].trim();else{var mFb=/Pelanggaran[^\n]*\n([^\n]+)/i.exec(bersih);if(mFb)hasil.identitas=mFb[1].trim();}
  var mPer=/Personil\s*yang\s*terlibat\s*:\s*\(?([^)\n]+)\)?/i.exec(bersih);if(mPer)hasil.personil=mPer[1].replace(/[()]/g,'').trim();
  var mDan=/Danru\s*(\d+)/i.exec(bersih);if(mDan)hasil.danru='Danru '+mDan[1];
  var mNdan=/Danru\s*\d+\s*\(\s*([^)]+)\s*\)/i.exec(bersih);if(mNdan)hasil.namaDanru=mNdan[1].trim();
  return hasil;
}

function parseWA(){
  var teks=(G('wa-teks')||{}).value||'';
  var errEl=G('wa-err'),prevEl=G('wa-prev'),lanjutBtn=G('wa-btn-lanjut');
  _waParsed=null;errEl.classList.remove('on');prevEl.classList.remove('on');if(lanjutBtn)lanjutBtn.style.display='none';
  if(!teks.trim()){G('wa-err-msg').textContent='Teks WA belum diisi.';errEl.classList.add('on');return;}
  var p=_parseWAClient(teks);
  var missing=[];
  if(!p.lokasi)missing.push('Lokasi');if(!p.hari)missing.push('Hari');if(!p.tanggal)missing.push('Tanggal');if(!p.personil)missing.push('Personil yang terlibat');
  if(missing.length){G('wa-err-msg').innerHTML='Field tidak terbaca:<br>• '+missing.join('<br>• ')+'<br><br>Periksa format teks WA-nya.';errEl.classList.add('on');return;}
  _waParsed=p;
  var rowsHtml='';
  [{l:'Lokasi',v:p.lokasi},{l:'Hari',v:p.hari},{l:'Tanggal',v:p.tanggal},{l:'Identitas',v:p.identitas||'NIHIL'},{l:'Personil',v:p.personil},{l:'Danru',v:p.danru||'—'},{l:'Nama Danru',v:p.namaDanru||'—'}].forEach(function(r){
    var cls=(r.v==='—'||!r.v)?'wp-val wp-mis':'wp-val wp-ok';
    rowsHtml+='<div class="wp-row"><span class="wp-lbl">'+r.l+'</span><span class="'+cls+'">'+esc(r.v||'tidak ditemukan')+'</span></div>';
  });
  G('wa-prev-body').innerHTML=rowsHtml;prevEl.classList.add('on');if(lanjutBtn)lanjutBtn.style.display='';
}

function waLanjutKeForm(){
  if(!_waParsed)return;var p=_waParsed;switchInTab('manual');
  if(G('in-lok'))G('in-lok').value=p.lokasi||'';if(G('in-per'))G('in-per').value=p.personil||'';
  if(G('in-idn'))G('in-idn').value=p.identitas||'NIHIL';if(G('in-dan'))G('in-dan').value=p.danru||'';if(G('in-ndan'))G('in-ndan').value=p.namaDanru||'';
  if(p.hari&&G('in-hari')){var HARI_MAP={senin:'Senin',selasa:'Selasa',rabu:'Rabu',kamis:'Kamis',jumat:'Jumat',sabtu:'Sabtu',minggu:'Minggu'};G('in-hari').value=HARI_MAP[p.hari.toLowerCase()]||p.hari;}
  if(p.tanggal){
    var BMAP={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
    var mT=/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/.exec(p.tanggal);
    if(mT){var tgl=parseInt(mT[1]),bln=BMAP[mT[2].toLowerCase()],thn=parseInt(mT[3]);if(tgl&&bln&&thn){if(G('in-tgl-h'))G('in-tgl-h').value=tgl;if(G('in-tgl-b'))G('in-tgl-b').value=bln;if(G('in-tgl-y'))G('in-tgl-y').value=thn;syncTglStr();}}
  }
  toast('Data dari WA berhasil diisi. Periksa & simpan.','ok');
}

function GG(id){return document.getElementById(id);}
function buildTglOpts(mn,mx){var s='';for(var i=mn;i<=mx;i++)s+='<option value="'+i+'">'+i+'</option>';return s;}
var BULAN_ID=['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function syncTglStr(){
  var h=parseInt((G('in-tgl-h')||{}).value||1),b=parseInt((G('in-tgl-b')||{}).value||1),y=parseInt((G('in-tgl-y')||{}).value||2026);
  if(G('in-tgl-str'))G('in-tgl-str').value=h+' '+BULAN_ID[b]+' '+y;
}

function addInFotos(files){
  var rem=10-_inFotos.length;
  if(rem<=0){toast('Maks 10 foto.','er');return;}
  for(var i=0;i<Math.min(files.length,rem);i++){
    (function(file){
      var rd=new FileReader();
      rd.onload=function(e){_inFotos.push({data:e.target.result,mime:file.type});renderInFotoGrid();};
      rd.readAsDataURL(file);
    })(files[i]);
  }
}

function renderInFotoGrid(){
  var g=G('in-fgrd');if(!g)return;g.innerHTML='';
  _inFotos.forEach(function(f,i){
    var div=document.createElement('div');div.className='fitem';
    var img=document.createElement('img');img.src=f.data;
    img.onclick=(function(idx){return function(){var srcs=_inFotos.map(function(x){return x.data;});galOpen(srcs,srcs,idx);};})(i);
    var del=document.createElement('button');del.className='fdel';del.innerHTML='<i class="fas fa-times"></i>';
    del.onclick=(function(ii){return function(e){e.stopPropagation();_inFotos.splice(ii,1);renderInFotoGrid();};})(ii);
    var num=document.createElement('div');num.className='fnum';num.textContent=i+1;
    div.appendChild(img);div.appendChild(del);div.appendChild(num);g.appendChild(div);
  });
}

function submitInput(){
  syncTglStr();
  var tgl=(G('in-tgl-str')||{}).value||'',lok=(G('in-lok')||{}).value||'',per=(G('in-per')||{}).value||'',hari=(G('in-hari')||{}).value||'';
  if(!tgl||!lok||!per||!hari){inMsg('Tanggal, Hari, Lokasi, dan Personil wajib diisi.','er');return;}
  if(!_inFotos.length){inMsg('Lampirkan minimal 1 foto.','er');return;}
  showLoad('Menyimpan laporan...');

  // ✅ GANTI
  apiPost('addLaporan',{
    lokasi:lok,hari:hari,tanggal:tgl,
    identitas:(G('in-idn')||{}).value||'NIHIL',
    personil:per,
    danru:(G('in-dan')||{}).value||'',
    namaDanru:(G('in-ndan')||{}).value||'',
    fotos:_inFotos
  }).then(function(res){
    hideLoad();
    if(res.success){toast('Laporan berhasil disimpan.','ok');_inFotos=[];resetInput();}
    else inMsg('Gagal: '+(res.message||''),'er');
  });
}

function inMsg(msg,type){
  var el=G('in-msg');if(!el)return;
  el.style.display='block';el.style.padding='8px 12px';el.style.borderRadius='8px';el.style.fontSize='.73rem';el.style.fontWeight='700';
  if(type==='er'){el.style.background='var(--redl)';el.style.color='var(--red)';el.innerHTML='<i class="fas fa-circle-xmark"></i> '+msg;}
  else{el.style.background='var(--greenl)';el.style.color='var(--green)';el.innerHTML='<i class="fas fa-circle-check"></i> '+msg;}
}

function resetInput(){_inFotos=[];loadInput();}
