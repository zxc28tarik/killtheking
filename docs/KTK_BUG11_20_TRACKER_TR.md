# Kill the King — BUG11–20 takip kaydı

Başlangıç: 38313f68117efd7fd32f9ccc4bd07ce5fcce48a6. Kullanıcının aktardığı ikinci hata taraması; 13/14/16/20 önceki sohbetin fonksiyon testi raporuna dayanır, burada henüz tekrar doğrulanmadı.

| ID | Sorun | Öncelik | Durum |
|---|---|---|---|
| BUG11 | TPS saldırı başlangıcı | Kritik | Kod adayı, CI bekliyor |
| BUG12 | Kalkan çarpması farklı katlar | Kritik | Kod adayı, CI bekliyor |
| BUG13 | Eğilme isabet hacmi | Kritik | Açık |
| BUG14 | Ölen okçunun etkisiz oku | Yüksek | Açık |
| BUG15 | Fıçı isabet önceliği | Yüksek | Açık |
| BUG16 | Dikey tavan çarpışması | Kritik | Açık |
| BUG17 | Yeniden doğuş hareketi | Yüksek | Açık |
| BUG18 | Maç sıfırlama | Yüksek | Açık |
| BUG19 | Fıçı durumunun taşınması | Orta | Açık |
| BUG20 | Ters uçan ok modeli | Orta | Açık |

BUG11: oyuncunun göz kotundaki gerçek konumu tek fizik başlangıcı; yön mevcut kamera quaternion'ından. TPS nişangâh yakın mesafe paralaks kalibrasyonu ve gerçek namlu modeli ayrı iş; hasar/silah menzili değişmedi. Ok ilk 0.9 m'yi atlamadan fizik adımına girer. BUG15 fıçı/asker önceliği bu aşamada bilinçli olarak değişmedi.
BUG12: aynı BUG03 dikey sınırı (1.35) ve 3B 6.5 menzil; mevcut yatay yön eşiği korunur, duvar kontrolü gerçek ayak kotu+1.6 üzerinden. Arena ve ordu motoru aynı fizik kontrolünü kullanır; 85 hasar ve itme değiştirilmedi.
Test: tests/bug11-12-player-attack.test.mjs; gerçek inline fonksiyonlar, Three r128, kaynak bağlantı kontrolleri. Canlı FPS/TPS kuşatma kabulü henüz yapılmadı. Bot taktikleri, menü, ışık ve renk değiştirilmedi.
