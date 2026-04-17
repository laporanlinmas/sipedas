export interface AddrResult {
  full: string;
  road: string;
  parts: string[];
}

export function reverseGeocodeForceStreet(lat: number, lng: number): Promise<AddrResult> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve({ full: 'Koordinat: ' + lat.toFixed(5) + ',' + lng.toFixed(5), road: '', parts: [] });
      }
    }, 5000);

    function finish(result: AddrResult) {
      if (done) return;
      clearTimeout(timer);
      done = true;
      resolve(result);
    }

    function buildAddr(road: string | null, houseNum: string | null, a: any): AddrResult {
      const parts: string[] = [];
      if (road) {
        let r = road;
        if (houseNum) r += ' No.' + houseNum;
        parts.push(r);
      }
      
      const dukuh = a.hamlet || a.allotments || a.neighbourhood || a.quarter || null;
      if (dukuh && dukuh !== road) parts.push('Dukuh ' + dukuh);
      
      const desa = a.village || a.town || a.suburb || null;
      if (desa) parts.push('Desa ' + desa);
      
      const kec = a.subdistrict || a.city_district || null;
      if (kec) parts.push('Kec. ' + kec);
      
      const kab = a.city || a.county || a.regency || a.municipality || null;
      if (kab) parts.push(kab);
      
      if (a.state) parts.push(a.state);
      
      parts.push('Indonesia');
      return { full: parts.join(', '), road: road || '', parts };
    }

    function buildFallback(lat: number, lng: number, addr: any | null): AddrResult {
      if (addr) {
        const parts: string[] = [];
        const desa = addr.village || addr.town || addr.suburb || null;
        if (desa) parts.push(desa);
        const kec = addr.subdistrict || addr.city_district || null;
        if (kec) parts.push('Kec. ' + kec);
        const kab = addr.city || addr.county || addr.regency || null;
        if (kab) parts.push(kab);
        if (addr.state) parts.push(addr.state);
        parts.push('Indonesia');
        if (parts.length > 1) return { full: parts.join(', '), road: '', parts };
      }
      return { full: lat.toFixed(5) + ', ' + lng.toFixed(5) + ', Indonesia', road: '', parts: [] };
    }

    function tryOverpass(onFail: () => void) {
      const r = 0.0007;
      const q = '[out:json][timeout:4];way["highway"]["name"](' + (lat - r) + ',' + (lng - r) + ',' + (lat + r) + ',' + (lng + r) + ');out 1 tags;';
      fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q))
        .then(res => res.json())
        .then(d => {
          if (d && d.elements && d.elements.length > 0 && d.elements[0].tags && d.elements[0].tags.name) {
            const road = d.elements[0].tags.name;
            finish({ full: road + ', Ponorogo, Jawa Timur, Indonesia', road: road, parts: [road, 'Ponorogo', 'Jawa Timur', 'Indonesia'] });
          } else {
            onFail();
          }
        }).catch(() => { onFail(); });
    }

    function tryZoom(zoom: number, nextZoom: number | null) {
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=' + zoom + '&addressdetails=1&namedetails=1&accept-language=id')
        .then(res => res.json())
        .then(d => {
          if (done) return;
          if (!d || !d.address) {
            if (nextZoom) tryZoom(nextZoom, null);
            else finish(buildFallback(lat, lng, null));
            return;
          }
          const a = d.address;
          let road = a.road || a.pedestrian || a.footway || a.path || a.cycleway || a.service || a.track || a.living_street || a.motorway || a.trunk || a.primary || a.secondary || a.tertiary || a.unclassified || a.residential || a.highway || null;
          if (!road && d.namedetails && d.namedetails.name) road = d.namedetails.name;
          if (!road && d.display_name) {
            const cand = (d.display_name.split(',')[0] || '').trim();
            if (cand && !/^\d+\.?\d*$/.test(cand) && cand.length > 3) road = cand;
          }
          if (road) {
            finish(buildAddr(road, a.house_number || '', a));
          } else if (nextZoom) {
            tryZoom(nextZoom, null);
          } else {
            tryOverpass(() => { finish(buildFallback(lat, lng, a)); });
          }
        }).catch(() => {
          if (done) return;
          if (nextZoom) tryZoom(nextZoom, null);
          else finish(buildFallback(lat, lng, null));
        });
    }

    tryZoom(19, 18);
  });
}
