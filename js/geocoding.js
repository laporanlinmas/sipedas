/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — geocoding.js
   Reverse geocoding functions for location lookup
═══════════════════════════════════════════════════════════ */

function reverseGeocodeForceStreet(lat, lng, cb) {
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;cb({full:'Koordinat: '+lat.toFixed(5)+','+lng.toFixed(5),road:'',parts:[]});}},5000);
  function finish(result){if(done)return;clearTimeout(timer);done=true;cb(result);}
  function buildAddr(road,houseNum,a){
    var parts=[];
    if(road){var r=road;if(houseNum)r+=' No.'+houseNum;parts.push(r);}
    var dukuh=a.hamlet||a.allotments||a.neighbourhood||a.quarter||null;
    if(dukuh&&dukuh!==road)parts.push(dukuh);
    var desa=a.village||a.town||a.suburb||null;if(desa)parts.push(desa);
    var kec=a.subdistrict||a.city_district||null;if(kec)parts.push('Kec. '+kec);
    var kab=a.city||a.county||a.regency||a.municipality||null;if(kab)parts.push(kab);
    if(a.state)parts.push(a.state);parts.push('Indonesia');
    return{full:parts.join(', '),road:road||'',parts:parts};
  }
  function tryZoom(zoom,nextZoom){
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lng+'&zoom='+zoom+'&addressdetails=1&namedetails=1&accept-language=id')
      .then(function(r){return r.json();})
      .then(function(d){
        if(done)return;
        if(!d||!d.address){if(nextZoom)tryZoom(nextZoom,null);else finish(buildFallback(lat,lng,null));return;}
        var a=d.address;
        var road=a.road||a.pedestrian||a.footway||a.path||a.cycleway||a.service||a.track||a.living_street||a.motorway||a.trunk||a.primary||a.secondary||a.tertiary||a.unclassified||a.residential||a.highway||null;
        if(!road&&d.namedetails&&d.namedetails.name)road=d.namedetails.name;
        if(!road&&d.display_name){var cand=(d.display_name.split(',')[0]||'').trim();if(cand&&!/^\d+\.?\d*$/.test(cand)&&cand.length>3)road=cand;}
        if(road){finish(buildAddr(road,a.house_number||'',a));}
        else if(nextZoom){tryZoom(nextZoom,null);}
        else{tryOverpass(lat,lng,finish,function(){finish(buildFallback(lat,lng,a));});}
      }).catch(function(){if(done)return;if(nextZoom)tryZoom(nextZoom,null);else finish(buildFallback(lat,lng,null));});
  }
  tryZoom(19,18);
}
function tryOverpass(lat,lng,onSuccess,onFail){
  var r=0.0007;
  var q='[out:json][timeout:4];way["highway"]["name"]('+(lat-r)+','+(lng-r)+','+(lat+r)+','+(lng+r)+');out 1 tags;';
  fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.elements&&d.elements.length>0&&d.elements[0].tags&&d.elements[0].tags.name){
        var road=d.elements[0].tags.name;
        onSuccess({full:road+', Ponorogo, Jawa Timur, Indonesia',road:road,parts:[road,'Ponorogo','Jawa Timur','Indonesia']});
      }else{onFail();}
    }).catch(function(){onFail();});
}
function buildFallback(lat,lng,addr){
  if(addr){
    var parts=[];
    var desa=addr.village||addr.town||addr.suburb||null;if(desa)parts.push(desa);
    var kec=addr.subdistrict||addr.city_district||null;if(kec)parts.push('Kec. '+kec);
    var kab=addr.city||addr.county||addr.regency||null;if(kab)parts.push(kab);
    if(addr.state)parts.push(addr.state);parts.push('Indonesia');
    if(parts.length>1)return{full:parts.join(', '),road:'',parts:parts};
  }
  return{full:lat.toFixed(5)+', '+lng.toFixed(5)+', Indonesia',road:'',parts:[]};
}