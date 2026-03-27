/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — exif-parser.js
   EXIF parsing functions for photo metadata
═══════════════════════════════════════════════════════════ */

function readExif(file, cb) {
  var rdr = new FileReader();
  rdr.onload  = function (e) { try { cb(parseExif(new DataView(e.target.result))); } catch (err) { cb(null); } };
  rdr.onerror = function ()  { cb(null); };
  rdr.readAsArrayBuffer(file);
}
function parseExif(dv) {
  if (dv.getUint16(0) !== 0xFFD8) return null;
  var off = 2, len = dv.byteLength;
  while (off < len - 4) {
    if (dv.getUint8(off) !== 0xFF) break;
    var mk = dv.getUint16(off), sl = dv.getUint16(off+2);
    if (mk===0xFFE1 && dv.getUint32(off+4)===0x45786966 && dv.getUint16(off+8)===0x0000)
      return parseTiff(dv, off+10);
    off += 2 + sl;
  }
  return null;
}
function parseTiff(dv, base) {
  var le  = (dv.getUint16(base)===0x4949);
  var r16 = function(o){ return le?dv.getUint16(o,true):dv.getUint16(o,false); };
  var r32 = function(o){ return le?dv.getUint32(o,true):dv.getUint32(o,false); };
  var rStr= function(o,l){ var s=''; for(var i=0;i<l;i++){var c=dv.getUint8(o+i);if(!c)break;s+=String.fromCharCode(c);}return s.trim(); };
  var rRat= function(o){ var n=r32(o),d=r32(o+4); return d?n/d:0; };
  var res={},ifd0=r32(base+4),nE=r16(base+ifd0),exifOff=null,gpsOff=null;
  for(var i=0;i<nE;i++){
    var ep=base+ifd0+2+(i*12),tag=r16(ep),cnt=r32(ep+4),vp=ep+8;
    if(tag===0x8769)exifOff=r32(vp);
    if(tag===0x8825)gpsOff=r32(vp);
    if(tag===0x0132)res.dateTime=rStr(base+r32(vp),cnt);
  }
  if(exifOff){
    var eb=base+exifOff,en=r16(eb);
    for(var j=0;j<en;j++){
      var ep2=eb+2+(j*12),t2=r16(ep2),c2=r32(ep2+4),v2=ep2+8;
      if(t2===0x9003)res.dto=rStr(base+r32(v2),c2);
      if(t2===0x9004)res.dtd=rStr(base+r32(v2),c2);
      if(t2===0x882a)res.tzOff=dv.getInt16(v2,le);
    }
  }
  if(gpsOff){
    var gb=base+gpsOff,gn=r16(gb),gps={};
    for(var k=0;k<gn;k++){
      var gp=gb+2+(k*12),gt=r16(gp),gc=r32(gp+4),gv=gp+8;
      if(gt===1)gps.latRef=String.fromCharCode(dv.getUint8(gv));
      if(gt===2){var lo=base+r32(gv);gps.latD=rRat(lo);gps.latM=rRat(lo+8);gps.latS=rRat(lo+16);}
      if(gt===3)gps.lngRef=String.fromCharCode(dv.getUint8(gv));
      if(gt===4){var lo2=base+r32(gv);gps.lngD=rRat(lo2);gps.lngM=rRat(lo2+8);gps.lngS=rRat(lo2+16);}
    }
    if(gps.latD!==undefined&&gps.lngD!==undefined){
      var lat=gps.latD+gps.latM/60+gps.latS/3600;
      var lng=gps.lngD+gps.lngM/60+gps.lngS/3600;
      if(gps.latRef==='S')lat=-lat;
      if(gps.lngRef==='W')lng=-lng;
      res.gps={lat:lat,lng:lng};
    }
  }
  return Object.keys(res).length?res:null;
}
function fmtExifTime(exif) {
  if(!exif)return nowFull()+' WIB';
  var raw=exif.dto||exif.dtd||exif.dateTime;
  if(!raw)return nowFull()+' WIB';
  var m=/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if(!m)return nowFull()+' WIB';
  var tz=exif.tzOff!==undefined?' GMT'+(exif.tzOff>=0?'+':'')+exif.tzOff:' WIB';
  return m[3]+'/'+m[2]+'/'+m[1]+' '+m[4]+':'+m[5]+':'+m[6]+tz;
}