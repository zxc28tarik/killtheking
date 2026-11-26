# KTK BUG01–10 — 2026-11-26
Kaynak: main HTML blob ad24dbde04012cc8d90b0cca0b4bb8fb560d71ab. Kullanıcı talimatı: hiçbir maddeyi atlama, sırayla ikili paketler halinde çöz. Bot karar/zeka sistemi, menü, ışık ve renk korunacak. Her paket: kod + regresyon + Chromium + canonical HTML eşliği; yalnız doğrulanmış sürüm main'e. Donanım ölçümü olmadan FPS artışı iddiası yok.
| ID | Sorun | Öncelik | Durum / kabul |
|---|---|---|---|
| BUG01 | Kuşatma kulesindeki askerlerin görsel Y kotu ile isabet silindiri uyuşmuyor | Kritik | Main'e işlendi; yüksek ve zemin hedeflerinin gerçek ray/ok isabeti |
| BUG02 | Oyuncu ayak kotu G5.4 motoruna aktarılmıyor | Kritik | Main'e işlendi; yüksek oyuncu gövdesi, ok/tüfek rayları ve sıfır kot regresyonu |
| BUG03 | Yakın dövüş dikey erişim kontrolü eksik | Kritik | Main'e işlendi; farklı kotlarda hayalet vuruş yok |
| BUG04 | dt 0.05 sınırı gerçek maç süresini FPS'e bağlı kılıyor | Kritik | Main'e işlendi; gerçek zaman, duraklama ve fizik adımı ayrımı |
| BUG05 | 3000 x 156 üçgen Meshy çim, frustum culling kapalı | Yüksek | Açık; görünüm korunarak görünür alan işi ve ölçüm |
| BUG06 | Çim değişiminde tüm instance tamponları dirty | Yüksek | Açık; değişen aralık aktarımı, aynı görünüm |
| BUG07 | Efekt havuzu yalnız boş nesneleri sınırlıyor | Yüksek | Açık; aktif efekt yükü sınırlı, kritik efekt korunur |
| BUG08 | Kale pathClear yalnız örnek noktaları kontrol ediyor | Yüksek | Açık; sürekli segment/süpürme testi |
| BUG09 | Hasar göstergeleri DOM/timer churn ve ekran dışı üretim | Orta | Açık; ekran sınırları ve sınırlı yeniden kullanım |
| BUG10 | Duraklamada gereksiz WebGL çizimi | Orta | Açık; duraklama/sonuç ekranı, resize/resume doğrulaması |
İlk paket BUG01–02: yalnız fiziksel Y tutarlılığı, AK33/35/36 AI davranışları aktarılmayacak. BUG03 ayrı tutulur. #89 adayındaki ilgili fizik kodu referans olabilir; körlemesine dal birleştirilmez.

## BUG01–02 kod adayı
Yalnız script 26 (isabet fiziği) ve 28 (oyuncu kotu köprüsü) değişti; mevcut kule görseli ve siegeY yürüyüş/düşüş kaynağı aynı. Bot hedef seçimi, hareket, silah dengesi ve menü aynı. Fiziksel görüş hattı ve dost gövde engeli gerçek Y ile hesaplanıyor. BUG03 yakın dövüş erişimi bu pakette çözülmedi. Yeni gerçek inline motor testleri eklendi; CI ve tarayıcı sonucu bekleniyor.

BUG01–02: PR #94 merged 4ab30f1450c6f3a3e7fc4c8b554c0375857a9ac8. 211/211 tests and Chromium runs 45811067088 / 45811067038 PASS. Manual elevated full battle still outstanding.

## BUG03–04 kod adayı
BUG03: gerçek 3B menzil ve 1.35 m dikey erişim sınırı; yer düzeyi ve yüksek hedeflerde gerçek görüş hattı, oyuncu cone ayak kotu. AI taktikleri değişmedi. BUG04: gerçek aktif maç saati, 50 ms fizik alt adımı, en fazla 200 ms kare başı telafi; ağır donmada fazla fizik süresi atılır ama maç saati gerçek zamanı sayar. Hit-stop maç saatini yavaşlatmaz; FPS gerçek kare üzerinden sayılır. 7 yeni test; CI/Chromium bekleniyor. BUG05–10 açık.

BUG03–04: PR #95 merged 875a3cfd107bb8f96a7a2d11e6d1dd8942ab0ac4. 218/218 tests and Chromium runs 45812273568 / 45812273395 PASS. Manual hardware / live battle outstanding.
