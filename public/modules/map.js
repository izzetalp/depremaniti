// Sadece harita işlevselliği
let mapInstance = null;
let mapMarker = null;
let mapCircles = [];

export function initOrUpdateMap(lat, lng, magnitude, radius, prob) {
  const mapContainer = document.getElementById("map");
  if (isNaN(lat) || isNaN(lng)) {
    mapContainer.style.display = "none";
    return;
  }
  mapContainer.style.display = "block";

  // CSS Animasyonunun akıcı bitmesi için Leaflet harita render işlemini 250ms erteliyoruz
  setTimeout(() => {
    // Gözle görülebilir bir varsayılan alan ayarla
    const visualRadius = radius > 0 ? radius * 1000 : parseFloat(magnitude) * 1000;
    
    // Leaflet global nesnesi (L) index.html üzerinden geliyor
    if (typeof L === 'undefined') {
        console.error("Leaflet(L) yüklenemedi!");
        return;
    }

    if (!mapInstance) {
      // Mobil cihazlarda tek parmakla sayfa kaydırmayı engellememek için harita kaydırmasını kapat (iki parmak gerekir)
      mapInstance = L.map('map', {
        dragging: !L.Browser.mobile,
        tap: !L.Browser.mobile
      }).setView([lat, lng], 8);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance);
      
      mapMarker = L.marker([lat, lng]).addTo(mapInstance);
    } else {
      mapInstance.setView([lat, lng], 8);
      mapMarker.setLatLng([lat, lng]);
    }

    // Önceki çemberleri temizle
    mapCircles.forEach(circle => mapInstance.removeLayer(circle));
    mapCircles = [];

    // Çember katmanlarını büyükten küçüğe oluştur (altta kalmamaları için)
    if (prob > 0) {
      const layers = [
        { ratio: 1.0, color: '#eab308', fillOpacity: 0.15 }, // %100 Sarı
        { ratio: 0.6, color: '#f97316', fillOpacity: 0.20 }, // %60 Turuncu
        { ratio: 0.2, color: '#ef4444', fillOpacity: 0.30 }  // %20 Kırmızı
      ];

      layers.forEach(layer => {
        const circle = L.circle([lat, lng], {
          color: layer.color,
          fillColor: layer.color,
          fillOpacity: layer.fillOpacity,
          radius: visualRadius * layer.ratio,
          weight: 1 // Çizgi kalınlığını narin yapalım
        }).addTo(mapInstance);
        mapCircles.push(circle);
      });
    } else {
      // Hissedilmeyen zayıf deprem ise tekil mavi çember çiz
      const circle = L.circle([lat, lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        radius: visualRadius,
        weight: 1
      }).addTo(mapInstance);
      mapCircles.push(circle);
    }
    
    // Haritanın boyutlarını en son tazele
    mapInstance.invalidateSize();
  }, 250);
}
