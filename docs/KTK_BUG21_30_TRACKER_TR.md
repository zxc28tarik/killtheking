# Kill the King — BUG21–30 takip kaydı

2026-11-26. Ana dal: `main`. Kanonik oyun: `index.html`.

| ID | Sorun | Durum | Commit |
|---|---|---|---|
| BUG21 | Görünmez kuşatma duvarı/kapısı çarpışması | Main'e işlendi; hedefli Chromium PASS | 1f8333f |
| BUG22 | Taktik haritada istemsiz saldırı | Main'e işlendi; hedefli Chromium PASS | dd18416 |
| BUG23 | Meydan haritası sınırının aşılması | Main'e işlendi; hedefli Chromium PASS | cb7f7a1 |
| BUG24 | Odak/fare kilidi sonrası takılı kontroller | Main'e işlendi; hedefli Chromium PASS | cb7f7a1 |
| BUG25 | C tuşu eğilme/kare formasyonu çakışması | Main'e işlendi; hedefli Chromium PASS | fbf83e8 |
| BUG26 | Üçüncü şahıs kamerası duvarlardan geçiyor | Main'e işlendi; hedefli Chromium PASS | fbf83e8 |
| BUG27 | Fıçı patlamaları gerçek orduya hasar vermiyor | Main'e işlendi; hedefli Chromium PASS | 5051726 |
| BUG28 | Patlamalar duvar arkasına hasar veriyor | Main'e işlendi; hedefli Chromium PASS | 5051726 |
| BUG29 | Havadaki okun silah kimliği sınıf değişiminde yanlışlaşıyor | Main'e işlendi; hedefli Chromium PASS | e3fa2da |
| BUG30 | Ordu savaşlarında eski Arena skorları gösteriliyor | Main'e işlendi; hedefli Chromium PASS | e3fa2da |
| BUG31 | Taktik harita oyuncu işareti TDZ hatası | Main'e işlendi; hedefli Chromium PASS | 1deaf2e |

## Kabul koşulları
- BUG21–24: kuşatma kapısı ve harita geçişleri, taktik harita fare girişleri, meydan sınırları, odak kaybı.
- BUG25–26: C/O bağımsızlığı, kapalı/açık alanda kamera, köşeler ve rampalar.
- BUG27–30: gerçek ordu hasar yolu, patlama görüş hattı, ok fırlatma anındaki silah kimliği, modlara uygun skor kaynağı.
- Bot karar mantığına ve görsellere dokunulmaz. Gerçek tarayıcı kabulü yapılmadan tam doğrulandı denmez.

## İlk kod düzeltmesi durumu (tarihsel)
10/10 kod düzeltmesi main dalında. 31 inline klasik JavaScript bloğu sözdizimi kontrolünden geçti (e3fa2da); gerçek WebGL/tarayıcı kabulü henüz yapılmadı. BUG29 için atış anındaki silah ve konum saklanır; BUG30 için gerçek bölük ve bireysel oyuncu verileri ayrı etiketlenir.

## QA01 — Ana dal genel regresyon doğrulaması
- Doğrulanan oyun commit'i: `f433919c8e0bc0b11ad79315fdea02c047c15cb0`.
- [Browser game checks #45834008773](https://github.com/zxc28tarik/killtheking/actions/runs/45834008773): 263/263 regresyon testi başarılı, 0 hata, 0 atlanan test. BUG23 sınır testi dahil. Inline HTML sözdizimi ve kanonik HTML eşitliği başarılı; SHA-256 `d3973858106933829928193ca2e6c3fb837c95a3a5e9dead49b2e8f09fd76931`.
- [UI32 full-screen menu acceptance #45834008901](https://github.com/zxc28tarik/killtheking/actions/runs/45834008901): Chromium/Playwright, 1920/1366/390 genişliklerinde gerçek harita/sınıf seçimleri, Arena/meydan/kuşatma maç başlangıçları ve canlı simülasyon ilerlemesi başarılı; sayfa hatası yok.
- Bu sonuçlar genel entegrasyon kabulüdür; BUG21–30'un her birinin hedefli gerçek tarayıcı senaryosu değildir. BUG21–30 hedefli kabul maddeleri açık kalır. Yazılım WebGL tanılama FPS değerleri gerçek GPU performans kabulü sayılmaz.

## QA02 — Hedefli Chromium regresyon kapısı
- `50666b5`: `.github/workflows/bug21_30_acceptance.yml` ana dala eklendi; ana HTML değişmedi.
- Üç modda gerçek maç başlangıcı; BUG21–30 için hedefli çalışma zamanı kontrolleri. Fare kilidi ve odak kontrollü test girdileri; patlama için gerçek Three.js raycast kullanan sentetik duvar/asker konumları; kamera için gerçek kapı AABB üzerinde yardımcı fonksiyon testi. BUG29 atış anı kimliği ve Arena sınıf değişimini kontrol eder, tam uçuş/ordu isabet zinciri ayrıca kabul ister.
- İlk GitHub Actions sonucu henüz doğrulanmadı. Hedefli kabul açık; tam insan oynanışı ve donanım performansı yerine geçmez.

## QA03 — İlk hedefli test sonucu ve taktik harita düzeltmesi
- [45840026111](https://github.com/zxc28tarik/killtheking/actions/runs/45840026111): 15/15 hedefli mekanik kontrol PASS; genel sonuç FAIL (meydan ve kuşatmada `Cannot access 'player' before initialization`).
- Kök neden: `drawArmyTacticalMap` fonksiyonunda `const player=armyMapCanvas(player.pos.x,player.pos.z)` yerel isim gölgelemesi (TDZ). Yerel değişken `playerMarker` olarak yeniden adlandırıldı. İki kanonik HTML aynı blob ile güncellendi. BUG22 testine doğrudan taktik harita çizimi çağrısı eklendi, sayfa hata yığınları korunuyor.
- Yeni commit üzerinde hedefli Chromium ve genel regresyon sonuçları henüz doğrulanmadı; kabul açık.

## QA04 — Nihai otomatik kapanış
- Doğrulanan oyun commit'i `1deaf2efe733baecc27a17936e5c49a98b1f54e5`.
- [Hedefli Chromium #45842442134](https://github.com/zxc28tarik/killtheking/actions/runs/45842442134): 15/15 kontrol başarılı, sayfa hatası yok. BUG31 doğrudan çizim çağrısı BUG22 kontrolünde iki ordu modunda PASS.
- [Genel CI #45842442223](https://github.com/zxc28tarik/killtheking/actions/runs/45842442223): 263/263 PASS, 0 hata, 0 atlanan; kanonik dosyalar birebir aynı (1,849,739 bayt, SHA256 `2c411e0b971236f7706f9d5feb32a71abcf0348e76ceb8edd56e0dd2a72604b3`).
- [UI32 #45842442030](https://github.com/zxc28tarik/killtheking/actions/runs/45842442030): Arena, meydan ve kuşatma gerçek maç başlangıcı, canlı simülasyon, menü kabulü PASS.
- BUG01–31 kod ve otomatik entegrasyon kapsamı kapalı. Hedefli test sınırları QA02'de belirtilmiştir: gerçek kullanıcı fare kilidi/odak, tam TPS köşe/rampa turu, tam ok uçuş/isabet zinciri, uzun manuel savaş ve gerçek donanım FPS/görsel kabulü ayrı doğrulamalardır; bunlar tamamlandı sayılmaz. Bot kararları ve görseller değiştirilmedi.
