# AK30 — İşlevsel savunma mevzileri ve sur bağlantısı sözleşmesi

Tarih: 23 Kasım 2026
Durum: tasarım/açık uygulama; AK29 ana dala PASS olarak alındı.

## Gerçek oyun davranışı
- Başlangıçta **70 kırmızı savunmacı içeride, 70 mavi saldırgan dışarıda**.
- Kale gerçek 600HP kırılabilir girişe, koçbaşına, mancınığa ve kuleye sahiptir.
- AK26'nın 19 gerçek kütlesi + AK28'in altı gerçek bot güzergâhı korunur.
- Mevcut top mazgalları **dekoratif**; henüz buradan ateş edildiğini iddia etme.

## AK30 gerçek oyun mekaniği, sıralama
1. **Sur geçişi prototipi:** mevcut iç avludan yalnız iki kanat savunma tabyasına çıkan geçişleri kontrollü geometrilerle ekle. Yürüme yüzeyi, bot yolunu takip edebilmeli; hayali merdiven yok.
2. **Fiziksel siper postası:** sur iç tarafındaki gerçek alçak siper ve yan mazgal açıklığı birinci-şahıs ve G5.4 silah ışınları için aynı cover kuralını kullanmalı.
3. **Savunma botları:** gerçek red-G5.4 tüfekçi/okçu bölüğüne yalnız geçerli setDestination güzergâhı doğrulandığında mevzi emri. Hiçbir ışınlanma, görünmez kalkan, ekstra hasar veya sahte asker yok.
4. **Tehdit değişimi:** kapı tahribatı, kule geçişi veya düşmanın gerçek içerideki konumu savunma emrini günceller. Surlardan iç avluya gerçek rota ile geri çekilme mümkün olmalı.
5. **Kuşatma kabulü:** altı AK28 yolunun tümü, F6–F10, üç harita, gerçek 140 asker ve kapı makinesi geçişleri PASS olmadan merge yok.

## Mevcut koda bağlanma
- Kanonik derleyici `recovered/native-siege/build_canonical_three_maps.mjs` tek giriş.
- İlk 28 özgün AK09 script bayt-eşit korunacak; yalnız 29. script yeni kontrollü eklenti alabilir.
- `KTKSiegeFortificationV26` gerçek duvar/kapsam sağlayıcısı.
- `KTKSiegeDefenderDoctrineV27` özgün red G5.4 komutanı; `AK28` gerçek rota denetçisi.
- AK29 görseli aynı gerçek kale fiziklerine bağlıdır.
- Yeni görevlerde Arena, Meydan ve FFA kaynakları değiştirilmez.
- Performans/FPS optimizasyonu sonraya bırakılır; işlevsel test önce.

## Kabul kapıları
- [ ] Gerçek çıkılabilir kale suru ve geri iniş
- [ ] Oyuncu + G5.4 gerçek silahı, siperden doğru çarpışma
- [ ] Botların gerçek mevzi rota kullanımı, tıkanma olmaması
- [ ] 70v70 kale savunması, 600HP kırılabilir kapı, 3 kuşatma makinesi
- [ ] Aynı oyun: üç harita Chromium/WebGL ve uzun kuşatma testleri
- [ ] Windows fiziksel GPU estetik/oynanış kabulü
