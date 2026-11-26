# KTK BUG01–10 — 2026-11-26
Kaynak: main HTML blob ad24dbde04012cc8d90b0cca0b4bb8fb560d71ab. Kullanıcı talimatı: hiçbir maddeyi atlama, sırayla ikili paketler halinde çöz. Bot karar/zeka sistemi, menü, ışık ve renk korunacak. Her paket: kod + regresyon + Chromium + canonical HTML eşliği; yalnız doğrulanmış sürüm main'e. Donanım ölçümü olmadan FPS artışı iddiası yok.
| ID | Sorun | Öncelik | Durum / kabul |
|---|---|---|---|
| BUG01 | Kuşatma kulesindeki askerlerin görsel Y kotu ile isabet silindiri uyuşmuyor | Kritik | Main'e işlendi; yüksek ve zemin hedeflerinin gerçek ray/ok isabeti |
| BUG02 | Oyuncu ayak kotu G5.4 motoruna aktarılmıyor | Kritik | Main'e işlendi; yüksek oyuncu gövdesi, ok/tüfek rayları ve sıfır kot regresyonu |
| BUG03 | Yakın dövüş dikey erişim kontrolü eksik | Kritik | Main'e işlendi; farklı kotlarda hayalet vuruş yok |
| BUG04 | dt 0.05 sınırı gerçek maç süresini FPS'e bağlı kılıyor | Kritik | Main'e işlendi; gerçek zaman, duraklama ve fizik adımı ayrımı |
| BUG05 | 3000 x 156 üçgen Meshy çim, frustum culling kapalı | Yüksek | Main'e işlendi; görünüm korunarak görünür alan işi ve ölçüm |
| BUG06 | Çim değişiminde tüm instance tamponları dirty | Yüksek | Main'e işlendi; değişen aralık aktarımı, aynı görünüm |
| BUG07 | Efekt havuzu yalnız boş nesneleri sınırlıyor | Yüksek | Main'e işlendi; aktif efekt yükü sınırlı, kritik efekt korunur |
| BUG08 | Kale pathClear yalnız örnek noktaları kontrol ediyor | Yüksek | Main'e işlendi; sürekli segment/süpürme testi |
| BUG09 | Hasar göstergeleri DOM/timer churn ve ekran dışı üretim | Orta | Main'e işlendi; ekran sınırları ve sınırlı yeniden kullanım |
| BUG10 | Duraklamada gereksiz WebGL çizimi | Orta | Main'e işlendi; duraklama/sonuç ekranı, resize/resume doğrulaması |
İlk paket BUG01–02: yalnız fiziksel Y tutarlılığı, AK33/35/36 AI davranışları aktarılmayacak. BUG03 ayrı tutulur. #89 adayındaki ilgili fizik kodu referans olabilir; körlemesine dal birleştirilmez.

## BUG01–02 uygulama kaydı
Yalnız script 26 (isabet fiziği) ve 28 (oyuncu kotu köprüsü) değişti; mevcut kule görseli ve siegeY yürüyüş/düşüş kaynağı aynı. Bot hedef seçimi, hareket, silah dengesi ve menü aynı. Fiziksel görüş hattı ve dost gövde engeli gerçek Y ile hesaplanıyor. BUG03 yakın dövüş erişimi bu pakette çözülmedi. Yeni gerçek inline motor testleri eklendi; CI ve tarayıcı sonucu aşağıda kaydedildi.

BUG01–02: PR #94 merged 4ab30f1450c6f3a3e7fc4c8b554c0375857a9ac8. 211/211 tests and Chromium runs 45811067088 / 45811067038 PASS. Manual elevated full battle still outstanding.

## BUG03–04 uygulama kaydı
BUG03: gerçek 3B menzil ve 1.35 m dikey erişim sınırı; yer düzeyi ve yüksek hedeflerde gerçek görüş hattı, oyuncu cone ayak kotu. AI taktikleri değişmedi. BUG04: gerçek aktif maç saati, 50 ms fizik alt adımı, en fazla 200 ms kare başı telafi; ağır donmada fazla fizik süresi atılır ama maç saati gerçek zamanı sayar. Hit-stop maç saatini yavaşlatmaz; FPS gerçek kare üzerinden sayılır. 7 yeni test; CI/Chromium sonucu aşağıda kaydedildi.

BUG03–04: PR #95 merged 875a3cfd107bb8f96a7a2d11e6d1dd8942ab0ac4. 218/218 tests and Chromium runs 45812273568 / 45812273395 PASS. Manual hardware / live battle outstanding.

## BUG05–06 uygulama kaydı
25 bölgesel batch x 2 malzeme, 9000 basit + 3000 Meshy, eski deterministik yerleşim korunur; 3000 sıfır ölçekli yinelenen basit çim kaldırıldı. Konservatif dünya AABB frustum testi ve r128 scalar updateRange birleştirme; görünmeyen gruplarda bekleyen aktarım korunur. Draw call artabilir; gerçek GPU kazancı ölçülmedi. OPT02/GR01 testleri yeni gerçek r128 topolojisine uyarlandı, kabul testleri aşağıda kaydedildi.

BUG05–06: PR #96 merged 46b91cc3cd1c3155c086a87f42add079510a139e; 222/222 tests and Chromium runs 45813544468 / 45813544317 PASS. Actual GPU FPS/visual acceptance outstanding.

## BUG07–08 uygulama kaydı
BUG07: 256 normal / 320 toplam aktif dekoratif parçacık; öncelikli kıvılcım, patlama ve atış izi için 64 rezerv; tüm 6 üretici girişinde kontrol. Okların fiziksel çarpışması, hasar ve diğer savaş kuralları aynı. Aşırı yükte öncelikli efekt de sınırda atlanabilir; gerçek FPS ölçümü yok. BUG08: AK26 ve AK31 sürekli segment/şişirilmiş AABB (konservatif kare ayak izi) testi, temas dahil; bozuk veri reddedilir, mevcut geometri değiştirilmedi. İki kaynak modül ve iki HTML eşlendi. Altı regresyon testi; CI/Chromium sonucu başarılı.

## BUG09–10 uygulama kaydı
BUG09: tüm NDC düzlemleri ve geçersiz projeksiyon reddedilir; 40 normal / 48 toplam DOM etiketi, kritik için 8 rezerv. 850 ms ömür ve aynı CSS animasyonu; tek kare süpürmesi, yeniden kullanım, yeni maç temizliği, etiket başına zamanlayıcı yok. BUG10: gerçek render kapısı; aktif oyun her kare, donmuş sahne tek çizim, menü sıfır; yeniden boyutlama/kalite/sınıf/kamera/atmosfer/harita/context restore yeniden çizim ister. 6 yeni regresyon testi ve gerçek Chromium DOM/render kabul kontrolü eklendi. Doğrudan test: 8 ekran dışı reddedildi, 48 üst sınır, 0 temizleme sonrası, node yeniden kullanımı; 100 sabit karede sıfır ek render. Gerçek GPU ölçümü yok. BUG07–08'in PR #97'si ile aynı dalda son paket; ayrı unutulacak dal açılmadı, son commit için tüm kabul testleri yeniden koştu ve başarılı oldu.

## Nihai kapanış — 2026-11-26
**10/10 kod düzeltmesi ve otomatik entegrasyon tamamlandı; açık BUG01–10 maddesi yok.**
- PR #97 merged: dceb8e4bc87ebcef6c2fca0c4b18d54c968ae9be; verified head f9fea21f4c48ae86ee3d1555c5334e76d54fd7c1.
- Browser game checks 45816465570: 234/234, 0 failures.
- UI32 45816465533: real Chromium BUG09/10 DOM and frozen renderer PASS at widths 1920, 1366, 390; all three maps start.
- Historical baseline 45816465575: PASS.
- Native siege endurance 45816465586: PASS.
- Root and playable HTML identical, SHA256 0851308b70c44fc9d5629d86f9efd1c4653f547b99ddf9f12b9143a456b21c48; Git blob 1a0b7aec135b17459ac8c0fd34f03731cd75101b.
- Manual real hardware FPS, visual review and elevated full battle remain separate validation, not claimed completed. No bot decision policy, lighting palette or menu artwork changes. This closes the ten-item audit only, not every possible issue in the game.
