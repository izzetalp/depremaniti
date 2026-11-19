export function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Hissedilebilir deprem hesaplama algoritması (Gelişmiş)
export function isFeltEarthquake(mag, depth) {
  const m = parseFloat(mag);
  const d = parseFloat(depth);
  
  // Logaritma hesaplamasında sonsuz/tanımsız değer almamak için minimum derinliği 1 km kabul ediyoruz
  const effectiveDepth = Math.max(d, 1);
  
  // Sismolojide sıkça kullanılan Tahmini Merkez Üssü Şiddeti (Mercalli Intensity - I) formüllerinden biri:
  // Şiddet = 1.5 * Büyüklük - 1.5 * log10(Derinlik)
  // Bu formül derindeki bir depremin yüzeye ulaşırken enerjisinin nasıl sönümlendiğini logaritmik olarak çok daha gerçekçi hesaplar.
  const estimatedIntensity = (1.5 * m) - (1.5 * Math.log10(effectiveDepth));
  
  // Mercalli şiddet ölçeğinde 3.0 seviyesi "Hafif" olarak adlandırılır ve evlerin içinde net hissedilir.
  // 2.75 gibi bir eşik değeri ayarlayarak sınırda olan ama çok sığ olduğu için gürültü/sarsıntı yapanları da dahil ediyoruz.
  return estimatedIntensity >= 2.75;
}

// Hissedilme olasılığını yüzdelik (%) olarak hesaplar
export function getFeltProbability(mag, depth) {
  const m = parseFloat(mag);
  const d = Math.max(parseFloat(depth), 1);
  const estimatedIntensity = (1.5 * m) - (1.5 * Math.log10(d));
  
  // Şiddet 1.5 iken %0, Şiddet 4.0 iken %100 diye doğrusal bir oran kuruyoruz.
  // Tahmini şiddet 2.75 olduğunda oran tam olarak %50 çıkar (Eşik noktamız)
  let prob = Math.round(((estimatedIntensity - 1.5) / 2.5) * 100);
  
  if (prob < 0) prob = 0;
  if (prob > 100) prob = 100;
  
  return prob;
}

// İhtimal sıfırdan büyükse sismolojik etki yarıçapını (kaç km uzağa gideceğini) hesaplar
export function getFeltRadius(mag, prob, depth) {
  if (prob === 0) return 0;
  const m = parseFloat(mag);
  const d = Math.max(parseFloat(depth), 1);
  
  // Gutenberg-Richter Makrosismik Şiddet ve Sönümleme (Attenuation) formüllerinin basitleştirilmiş modeli:
  // I_0 - I_R = 3 * log10(R_hypo / D) mantığından türetilmiştir. Yüzeydeki minimum hissedilme sınırını Intensity(Şiddet) = 3.0 alırsak:
  // Etki Yarıçapı (R) = kök( 0.01 * 10^M * D - D^2 )
  const rSquared = (0.01 * Math.pow(10, m) * d) - (d * d);
  
  if (rSquared <= 0) return 1; // Sönümlenme yüzeye bile ulaşamadan bitiyorsa min 1 km alan ver
  
  return Math.round(Math.sqrt(rSquared));
}
