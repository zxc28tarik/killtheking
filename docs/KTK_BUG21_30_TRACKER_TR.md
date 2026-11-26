# Kill the King — BUG21–30 takip kaydı

2026-11-26. Ana dal: `main`. Kanonik oyun: `index.html`.

| ID | Sorun | Durum | Commit |
|---|---|---|---|
| BUG21 | Görünmez kuşatma duvarı/kapısı çarpışması | Kod düzeltildi, tarayıcı kabulü bekliyor | 1f8333f |
| BUG22 | Taktik haritada istemsiz saldırı | Kod düzeltildi, tarayıcı kabulü bekliyor | dd18416 |
| BUG23 | Meydan haritası sınırının aşılması | Kod düzeltildi, tarayıcı kabulü bekliyor | cb7f7a1 |
| BUG24 | Odak/fare kilidi sonrası takılı kontroller | Kod düzeltildi, tarayıcı kabulü bekliyor | cb7f7a1 |
| BUG25 | C tuşu eğilme/kare formasyonu çakışması | Kod düzeltildi: C kayma, O kare; tarayıcı kabulü bekliyor | fbf83e8 |
| BUG26 | Üçüncü şahıs kamerası duvarlardan geçiyor | Kod düzeltildi, 5 geometrik birim kontrolü geçti; tarayıcı kabulü bekliyor | fbf83e8 |
| BUG27 | Fıçı patlamaları gerçek orduya hasar vermiyor | Kod düzeltildi, tarayıcı kabulü bekliyor | 5051726 |
| BUG28 | Patlamalar duvar arkasına hasar veriyor | Kod düzeltildi, 5 hasar hesabı kontrolü geçti; tarayıcı kabulü bekliyor | 5051726 |
| BUG29 | Havadaki okun silah kimliği sınıf değişiminde yanlışlaşıyor | Kod düzeltildi, tarayıcı kabulü bekliyor | e3fa2da |
| BUG30 | Ordu savaşlarında eski Arena skorları gösteriliyor | Kod düzeltildi, sentetik sıralama kontrolü geçti; tarayıcı kabulü bekliyor | e3fa2da |

## Kabul koşulları
- BUG21–24: kuşatma kapısı ve harita geçişleri, taktik harita fare girişleri, meydan sınırları, odak kaybı.
- BUG25–26: C/O bağımsızlığı, kapalı/açık alanda kamera, köşeler ve rampalar.
- BUG27–30: gerçek ordu hasar yolu, patlama görüş hattı, ok fırlatma anındaki silah kimliği, modlara uygun skor kaynağı.
- Bot karar mantığına ve görsellere dokunulmaz. Gerçek tarayıcı kabulü yapılmadan tam doğrulandı denmez.

## Son durum
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
