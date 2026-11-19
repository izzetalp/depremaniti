import { state, setFilter, setUIMounted } from "./state.js";
import { isFeltEarthquake, getFeltProbability, getFeltRadius, escapeHTML } from "./utils.js";
import { initOrUpdateMap } from "./map.js";

const mainContent = document.querySelector("main");

// Event Delegation (Performans Optimizasyonu): Filter Container yıkılıp yapılsa bile hafızada 1 adet dinleyici kalır
mainContent.addEventListener("click", (event) => {
  const targetBtn = event.target.closest('.filter-btn');
  // Sadece üstünde geçerli bir değer olan asıl filtre butonları çalışır
  if (!targetBtn || targetBtn.dataset.val === undefined) return;

  setFilter(targetBtn.dataset.val);
  renderEarthquakesPage();
});

export function showLoading() {
  mainContent.innerHTML = "<p style='padding: 2rem;'>Veriler yükleniyor...</p>";
}

export function showError(message) {
  mainContent.innerHTML = "";
  const errorNode = document.createElement("p");
  errorNode.style = "padding: 2rem; color: #dc2626";
  errorNode.textContent = message;
  mainContent.appendChild(errorNode);
}

export function renderEarthquakesPage() {
  if (state.allEarthquakes.length === 0) {
    mainContent.innerHTML = "<p style='padding: 2rem;'>Belirtilen tarih aralığında deprem verisi bulunamadı.</p>";
    return;
  }

  // 1. KISIM: ARAYÜZ İSKELETİ SADECE BİR KERE ÇİZİLİR (DOM Thrashing'i Önler)
  if (!state.isUIMounted) {
    mainContent.innerHTML = "";

    // 1A. Büyük Depremler (Boyutu 4.5 üstü son 5) -> Filtreden etkilenmez, hep tepede durur
    const majorEarthquakes = state.allEarthquakes.filter(eq => parseFloat(eq.magnitude) > 4.5).slice(0, 5);

    if (majorEarthquakes.length > 0) {
      const majorTitle = document.createElement("h2");
      majorTitle.className = "section-title";
      majorTitle.textContent = "🚨 Büyüklüğü 4.5 Üzeri Son Depremler";
      mainContent.appendChild(majorTitle);

      const majorList = document.createElement("ul");
      majorList.className = "earthquake-list-container";
      
      const majorFragment = document.createDocumentFragment();
      majorEarthquakes.forEach(eq => majorFragment.appendChild(createEarthquakeElement(eq)));
      majorList.appendChild(majorFragment);
      
      mainContent.appendChild(majorList);
    }

    // 1B. Dinamik Filtreli Alan Başlığı
    const recentTitle = document.createElement("h2");
    recentTitle.className = "section-title";
    recentTitle.textContent = "🔎 Son 25 Deprem";
    if (majorEarthquakes && majorEarthquakes.length > 0) {
      recentTitle.style.marginTop = "3rem";
    }
    mainContent.appendChild(recentTitle);

    // Filtre Butonları Oluşturulması
    const filterContainer = document.createElement("div");
    filterContainer.className = "filter-container";

    const filterOptions = [
      { label: "Tümü", val: 0 },
      { label: "Hissedilenler", val: "felt" },
      { label: "+2.0 Üstü", val: 2 },
      { label: "+3.0 Üstü", val: 3 },
      { label: "+4.0 Üstü", val: 4 }
    ];

    filterOptions.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.val = opt.val; // Butonun değerini hafızada tut
      btn.textContent = opt.label;
      filterContainer.appendChild(btn);
    });

    mainContent.appendChild(filterContainer);

    // DİNAMİK LİSTENİN GİRİLECEĞİ KASA ELEMENTİ
    const dynamicListContainer = document.createElement("div");
    dynamicListContainer.id = "dynamic-eq-list";
    mainContent.appendChild(dynamicListContainer);

    setUIMounted(true); // İskelet Artık Hazır
  }

  // 2. KISIM: SADECE DİNAMİK İÇERİK GÜNCELLENİR (Performans Optimizasyonu)
  // Aktif Buton Güncelle
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
    if (String(btn.dataset.val) === String(state.currentFilter)) {
      btn.classList.add("active");
    }
  });

  const dynamicListContainer = document.getElementById("dynamic-eq-list");
  dynamicListContainer.innerHTML = ""; // Yalnızca liste kısmını temizle

  // Filtrelenmiş Liste: Mevcut filtreye göre filtrele ve EN İYİ 25'i al
  const filteredEqs = state.allEarthquakes
    .filter(eq => {
      if (state.currentFilter === "felt") {
        return isFeltEarthquake(eq.magnitude, eq.depth);
      }
      return parseFloat(eq.magnitude) >= state.currentFilter;
    })
    .slice(0, 25);

  if (filteredEqs.length === 0) {
    const noData = document.createElement("p");
    noData.style.padding = "1rem 0";
    noData.style.color = "#6b7280";
    noData.textContent = "Seçilen filtre ve tarih aralığında uygun bir deprem bulunamadı.";
    dynamicListContainer.appendChild(noData);
  } else {
    const recentList = document.createElement("ul");
    recentList.className = "earthquake-list-container";
    
    // YENİDEN ÇİZİM
    const fragment = document.createDocumentFragment();
    filteredEqs.forEach(eq => fragment.appendChild(createEarthquakeElement(eq)));
    recentList.appendChild(fragment);
    
    dynamicListContainer.appendChild(recentList);
  }
}

export function openMapModal(eq) {
  const dialog = document.getElementById("detay-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  
  modalTitle.textContent = eq.location;
  
  const prob = getFeltProbability(eq.magnitude, eq.depth);
  const radius = getFeltRadius(eq.magnitude, prob, eq.depth);
  
  let htmlContent = `
    <p><strong>Büyüklük:</strong> ${escapeHTML(eq.magnitude)}</p>
    <p><strong>Derinlik:</strong> ${escapeHTML(eq.depth)} km</p>
    <p><strong>Tarih:</strong> ${escapeHTML(new Date(eq.date.endsWith("Z") ? eq.date : eq.date + "Z").toLocaleString("tr-TR"))}</p>
  `;
  
  if (prob > 0) {
    htmlContent += `
      <p><strong>Tahmini Hissedilme:</strong> %${escapeHTML(prob)}</p>
      <p><strong>Tahmini Etki Yarıçapı:</strong> ~${escapeHTML(radius)} km</p>
    `;
  } else {
    htmlContent += `<p><strong>Tahmini Hissedilme:</strong> Çok İhtimal Dışı</p>`;
  }
  
  modalDesc.innerHTML = htmlContent;
  dialog.showModal();
  
  const lat = parseFloat(eq.latitude);
  const lng = parseFloat(eq.longitude);
  
  initOrUpdateMap(lat, lng, eq.magnitude, radius, prob);
}

// HAKKINDA SAYFASI EKRANI
export function renderAboutPage() {
  mainContent.innerHTML = "";

  const aboutCard = document.createElement("div");
  aboutCard.className = "about-card";

  const title = document.createElement("h2");
  title.textContent = "Hakkında, Gizlilik ve Sorumluluk Reddi";
  aboutCard.appendChild(title);

  const paragraphs = [
    "<strong>Amaç ve Veri Kaynağı:</strong> <strong>depremaniti.com</strong>, kişisel kullanım ve genel bilgilendirme amacıyla geliştirilmiş bağımsız bir deprem takip arayüzüdür. Deprem verileri, Afet ve Acil Durum Yönetimi Başkanlığının (<strong>AFAD</strong>) halka açık veri servisi üzerinden sunucu tarafında çekilir. Resmi servislere aşırı yük bindirmemek amacıyla veriler sunucu önbelleğinde (<strong>cache</strong>) <strong>60 saniye</strong> boyunca saklanır ve büyük artçı fırtınalarında dahi güncel kayıtların kaybolmaması için geriye dönük son <strong>7 gün</strong> (en fazla 2000 kayıt) ile sınırlandırılır. Önbellekleme nedeniyle ekrandaki kayıtlar ile AFAD'ın anlık resmi duyuruları arasında <strong>yaklaşık 1 dakikaya kadar gecikme</strong> yaşanabilir.",
    "<strong>Tahmini Hesaplamalar ve Sorumluluk Reddi:</strong> Depremlere ait hissedilme olasılığı ve etki yarıçapı değerleri resmi sismik ölçüm, ivmeölçer kaydı veya hasar tespiti değildir. Bu göstergeler yalnızca büyüklük (<code>M</code>) ve derinlik (<code>D</code>, en az 1 km) değerlerini kullanan basitleştirilmiş matematiksel yaklaşımlarla (<code>I = 1.5 &middot; M - 1.5 &middot; log<sub>10</sub>(D)</code> ve <code>R = &radic;(0.01 &middot; 10<sup>M</sup> &middot; D - D&sup2;)</code>) hesaplanan, haritada fikir vermesi amacıyla gösterilen <strong>yaklaşık tahminlerdir</strong>; yerel zemin koşullarını, fay yönelimini veya yapı özelliklerini yansıtmaz. Bu platform <strong>resmi bir kurum sitesi veya deprem erken uyarı sistemi değildir</strong>; acil durum, tahliye ve resmi teyit kararları için her zaman AFAD ve yetkili kamu kurumlarının resmi kanalları esas alınmalıdır.",
    "<strong>Gizlilik, Çerezler ve Dış Bağlantılar (KVKK Bilgilendirmesi):</strong> Bu sitede kullanıcı hesabı oluşturulmaz, herhangi bir kişisel veri toplanmaz veya kaydedilmez; reklam, analitik ya da takip çerezi kullanılmaz. Bununla birlikte sitenin ve detay haritasının teknik olarak sunulabilmesi amacıyla standart internet protokolleri gereği barındırma ve API altyapısı için <strong>Cloudflare</strong>, harita kütüphanesi için <strong>unpkg CDN</strong> (Leaflet) ve harita görüntüleri için <strong>OpenStreetMap</strong> (<code>&copy; OpenStreetMap</code> katkıda bulunanları) sunucularına IP adresi ve tarayıcı bilgisi gibi standart teknik erişim verileri iletilebilir. AFAD veri sorguları sunucu tarafından yapıldığından kullanıcı IP adresi AFAD sunucularına aktarılmaz.",
    "<strong>İletişim ve Hukuki Bildirimler:</strong> 5651 sayılı Kanun kapsamındaki hukuki bildirimler, veri/içerik düzeltme talepleri ve gizlilikle ilgili her türlü başvuru için <strong>[iletisim@depremaniti.com]</strong> adresi üzerinden iletişime geçebilirsiniz.",
    "<em>Bu sitede yer alan bilgi ve tahminlerin kullanımından doğabilecek doğrudan veya dolaylı sonuçlardan site geliştiricisi sorumlu tutulamaz.</em>"
  ];

  const fragment = document.createDocumentFragment();
  paragraphs.forEach(html => {
    const p = document.createElement("p");
    p.innerHTML = html;
    fragment.appendChild(p);
  });

  aboutCard.appendChild(fragment);
  mainContent.appendChild(aboutCard);
}

// GÜVENLİ (XSS Free) DOM EKLEME FONKSİYONU
function createEarthquakeElement(eq) {
  // AFAD API saatleri UTC olarak (sonunda Z olmadan) gönderir.
  // JavaScript'in bunu yerel saat olarak yorumlayıp -3 saat göstermemesi için 'Z' ekleyerek UTC olduğunu belirtiyoruz.
  const dateStr = eq.date.endsWith("Z") ? eq.date : eq.date + "Z";
  const dateObj = new Date(dateStr);
  
  const formattedDate = dateObj.toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const mag = parseFloat(eq.magnitude);
  let magColor = "black";
  let magBgColor = "#f3f4f6";

  const listItem = document.createElement("li");
  listItem.className = "earthquake-list-item";
  if (eq.id) {
    listItem.dataset.id = eq.id;
  }

  const isFelt = isFeltEarthquake(eq.magnitude, eq.depth);
  const prob = getFeltProbability(eq.magnitude, eq.depth);
  const radius = getFeltRadius(eq.magnitude, prob, eq.depth);

  // Sadece hissedilebilir depremleri renklendir
  if (isFelt) {
    if (mag >= 5.0) {
      magColor = "#b91c1c"; // koyu kırmızı
      magBgColor = "#fee2e2"; // açık kırmızı arkaplan
      listItem.classList.add("felt-earthquake-high");
    } else if (mag >= 4.0) {
      magColor = "#c2410c"; // koyu turuncu
      magBgColor = "#ffedd5";
      listItem.classList.add("felt-earthquake");
    } else {
      magColor = "#b45309"; // kehribar
      magBgColor = "#fef3c7";
      listItem.classList.add("felt-earthquake");
    }
  }

  const infoDiv = document.createElement("div");
  infoDiv.className = "eq-info";

  const locationTitle = document.createElement("h3");
  locationTitle.textContent = eq.location;

  const dateSpan = document.createElement("p");
  // Hissedilebilirliği %0'dan büyükse göster
  const probText = prob > 0 ? `  |  👁️ Etki Yarıçapı: ~${radius} km` : "";
  dateSpan.textContent = `📅 ${formattedDate}  |  📍 Derinlik: ${eq.depth} km${probText}`;

  infoDiv.appendChild(locationTitle);
  infoDiv.appendChild(dateSpan);

  const rightContainer = document.createElement("div");
  rightContainer.className = "eq-right-container";

  const magDiv = document.createElement("div");
  magDiv.className = "eq-mag";
  magDiv.style.color = magColor;
  magDiv.style.backgroundColor = magBgColor;
  magDiv.textContent = eq.magnitude;
  rightContainer.appendChild(magDiv);

  if (prob > 0) {
    const barOuter = document.createElement("div");
    barOuter.className = "prob-bar-outer";
    barOuter.title = `Tahmini Hissedilme: %${prob}`;
    
    const barInner = document.createElement("div");
    barInner.className = "prob-bar-inner";
    barInner.style.width = prob + "%";
    
    if (prob >= 80) barInner.style.backgroundColor = "#ef4444"; // Kırmızı
    else if (prob >= 40) barInner.style.backgroundColor = "#f59e0b"; // Turuncu
    
    barOuter.appendChild(barInner);
    rightContainer.appendChild(barOuter);
  }

  listItem.appendChild(infoDiv);
  listItem.appendChild(rightContainer);

  return listItem;
}
