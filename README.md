# Deprem Anıtı

Bu proje, Türkiye depremlerine özel, anlık takip sağlayan ve bilgi sunan bir platform olan **Deprem Anıtı** projesinin kod tabanıdır. 

## Proje Felsefesi: Vanilla JS Odaklı Geliştirme

Proje, herhangi bir ağır build aracı (Webpack, Vite vb.) veya karmaşık bir JavaScript framework'ü (React, Vue vb.) kullanılmadan, tamamen **saf (Vanilla) JavaScript** ile geliştirilmiştir.

Bu yaklaşımın amaçları şunlardır:
1. **Şeffaflık ve Minimalizm**: Sadece gerekli olan kodların yazılarak gereksiz paket ve framework bağımlılıklarının ortadan kaldırılması.
2. **Yüksek Performans**: Doğrudan tarayıcının yerel (native) ES Modules yeteneklerini kullanarak derleme ve bundle yükünü sıfıra indirmek.
3. **Gerçek Zamanlı Hız**: İstemci tarafında çalışan modüler yapısı sayesinde deprem verilerinin anında, engelsiz sunulması.
4. **Uzun Ömürlülük (Longevity)**: Framework trendlerinin ötesinde, standartlaşmış web teknolojileri sayesinde yıllarca bakım sorunu yaşamadan çalışabilme garantisi.

## Proje Yapısı

\`\`\`
.
├── .gitignore         # Git tarafından takip edilmeyecek gizli dosyalar
├── README.md          # Proje dokümantasyon dosyası (şu an okuduğunuz)
├── AGENTS.md          # Yapay zeka asistanları için proje hafızası ve kuralları
├── public/            # İstemci tarafında çalışacak web dosyaları 
│   ├── index.html     # Uygulamanın ana giriş noktası
│   ├── style.css      # Ana ve Vanilla CSS stilleri
│   └── modules/       # ES modülü mantığıyla ayrılmış Vanilla JS parçaları
└── functions/         # Cloudflare Pages üzerinden çalışacak sunucu (Serverless API) fonksiyonları
\`\`\`

## Nasıl Çalıştırılır?

Projenin bir build adımı olmadığı için statik dosyaları (HTML/CSS/JS) doğrudan tarayıcınızda bile açabilirsiniz. Fakat `functions/` altındaki API yönlendirmelerini de lokalde denemek isterseniz, Cloudflare'in **Wrangler** aracı kullanılmalıdır.

### Lokalde Test Etmek İçin

Terminalinizde, projenin kök dizinindeyken şu komutu çalıştırın:
\`\`\`bash
npx wrangler pages dev public
\`\`\`
*(Not: `npx` komutu eğer makinenizde yoksa, öncelikle bilgisayarınıza [Node.js](https://nodejs.org) kurmanız gereklidir.)*

Bu komut, projenizi varsayılan ayarlarla (genellikle `http://localhost:8788`) çalıştıracak ve hem `public` klasörünüzdeki statik dosyaları ayağa kaldıracak hem de `functions` içerisindeki serverless endpoint'lerinizi taklit edecektir.
