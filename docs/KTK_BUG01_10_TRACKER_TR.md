# KTK BUG01–10 — 2026-11-26
Kaynak: main HTML blob ad24dbde04012cc8d90b0cca0b4bb8fb560d71ab. Kullanıcı talimatı: hiçbir maddeyi atlama, sırayla ikili paketler halinde çöz. Bot karar/zeka sistemi, menü, ışık ve renk korunacak. Her paket: kod + regresyon + Chromium + canonical HTML eşliği; yalnız doğrulanmış sürüm main'e. Donanım ölçümü olmadan FPS artışı iddiası yok.
| ID | Sorun | Öncelik | Durum / kabul |
|---|---|---|---|
| BUG01 | Kuşatma kulesindeki askerlerin görsel Y kotu ile isabet silindiri uyuşmuyor | Kritik | Açık; yüksek ve zemin hedeflerinin gerçek ray/ok isabeti |
| BUG02 | Oyuncu ayak kotu G5.4 motoruna aktarılmıyor | Kritik | Açık; yüksek oyuncu gövdesi, ok/tüfek rayları ve sıfır kot regresyonu |
| BUG03 | Yakın dövüş dikey erişim kontrolü eksik | Kritik | Açık; farklı kotlarda hayalet vuruş yok |
| BUG04 | dt 0.05 sınırı gerçek maç süresini FPS'e bağlı kılıyor | Kritik | Açık; gerçek zaman, duraklama ve fizik adımı ayrımı |
| BUG05 | 3000 x 156 üçgen Meshy çim, frustum culling kapalı | Yüksek | Açık; görünüm korunarak görünür alan işi ve ölçüm |
| BUG06 | Çim değişiminde tüm instance tamponları dirty | Yüksek | Açık; değişen aralık aktarımı, aynı görünüm |
| BUG07 | Efekt havuzu yalnız boş nesneleri sınırlıyor | Yüksek | Açık; aktif efekt yükü sınırlı, kritik efekt korunur |
| BUG08 | Kale pathClear yalnız örnek noktaları kontrol ediyor | Yüksek | Açık; sürekli segment/süpürme testi |
| BUG09 | Hasar göstergeleri DOM/timer churn ve ekran dışı üretim | Orta | Açık; ekran sınırları ve sınırlı yeniden kullanım |
| BUG10 | Duraklamada gereksiz WebGL çizimi | Orta | Açık; duraklama/sonuç ekranı, resize/resume doğrulaması |
İlk paket BUG01–02: yalnız fiziksel Y tutarlılığı, AK33/35/36 AI davranışları aktarılmayacak. BUG03 ayrı tutulur. #89 adayındaki ilgili fizik kodu referans olabilir; körlemesine dal birleştirilmez.
