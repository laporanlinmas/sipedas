/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — file-handler.js
   File input handling and image processing
═══════════════════════════════════════════════════════════ */

document.getElementById('fg').addEventListener('change', function (e) { handleFiles(e.target.files, 'gallery'); this.value = ''; });
document.getElementById('fc').addEventListener('change', function (e) { handleFiles(e.target.files, 'camera');  this.value = ''; });

function handleFiles(files, src) {
  var rem = MAX - fotos.length;
  if (rem <= 0) { showAlert('warn','Batas Foto','Maksimal ' + MAX + ' foto.'); return; }
  var toAdd = Math.min(files.length, rem);
  if (files.length > rem)
    showAlert('warn','Batas Terlampaui', files.length + ' foto dipilih, hanya ' + rem + ' slot tersisa. ' + toAdd + ' pertama ditambahkan.');
  for (var i = 0; i < toAdd; i++) {
    (function (file, source) {
      var idx = fotos.length;
      fotos.push({ data:null, mime:file.type, sizeKB:0, compressed:false,
                   processing:true, procLabel:'Membaca file...', source:source,
                   exif:null, exifAddr:null, ts:nowFull(), idbKey:null });
      renderGrid();
      if (source === 'camera') {
        fotos[idx].procLabel = 'Membaca EXIF GPS...'; renderGrid();
        readExif(file, function (exif) {
          fotos[idx].exif = exif;
          if (exif && exif.gps) {
            fotos[idx].procLabel = 'Geocoding nama jalan...'; renderGrid();
            reverseGeocodeForceStreet(exif.gps.lat, exif.gps.lng, function (addr) {
              fotos[idx].exifAddr = addr;
              fotos[idx].procLabel = 'Render WM + QR...'; renderGrid();
              doProcess(file, idx);
            });
          } else {
            fotos[idx].procLabel = 'Render watermark...'; renderGrid();
            doProcess(file, idx);
          }
        });
      } else {
        fotos[idx].procLabel = 'Kompres & watermark...'; renderGrid();
        doProcess(file, idx);
      }
    })(files[i], src);
  }
}

function doProcess(file, idx) {
  var rdr = new FileReader();
  rdr.onload = function (ev) {
    processImage(ev.target.result, file.type, idx, function (res) {
      Object.assign(fotos[idx], res);
      fotos[idx].processing = false;
      if (fotos[idx].source === 'camera') {
        idbSavePhoto(fotos[idx], function (key) {
          if (key !== null && key !== undefined) fotos[idx].idbKey = key;
        });
      }
      renderGrid();
    });
  };
  rdr.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════════════
   IMAGE PROCESSING
═══════════════════════════════════════════════════════════ */
function processImage(dataUrl, mime, idx, callback) {
  var img = new Image();
  img.onload = function () {
    var f=fotos[idx],cvs=document.getElementById('cvs'),ctx=cvs.getContext('2d');
    var w=img.naturalWidth,h=img.naturalHeight,mx=2500;
    if(w>mx||h>mx){if(w>h){h=Math.round(h*mx/w);w=mx;}else{w=Math.round(w*mx/h);h=mx;}}
    cvs.width=w;cvs.height=h;ctx.drawImage(img,0,0,w,h);
    function finalize(qrCvs){
      if(getWM(f.source))drawWM(ctx,w,h,idx,qrCvs);
      var outMime='image/jpeg',q=0.92,raw=cvs.toDataURL(outMime,q),sz=b64sz(raw),comp=false,out=raw;
      if(sz>MAX_B){comp=true;var lo=0.10,hi=q,best=raw;
        for(var it=0;it<14;it++){var mid=(lo+hi)/2,trial=cvs.toDataURL(outMime,mid),tsz=b64sz(trial);
          if(tsz<=MAX_B){best=trial;lo=mid;}else hi=mid;if(hi-lo<0.006)break;}out=best;}
      callback({data:out,mime:outMime,sizeKB:Math.round(b64sz(out)/1024),compressed:comp,ts:f.ts});
    }
    if(f.source==='camera'&&f.exif&&f.exif.gps&&getWM('camera')){
      var qrSz=Math.max(90,Math.min(240,Math.round(Math.min(w,h)*0.16)));
      makeQRCanvas(f.exif.gps.lat,f.exif.gps.lng,qrSz,function(qrCvs){finalize(qrCvs);});
    }else{finalize(null);}
  };
  img.src=dataUrl;
}