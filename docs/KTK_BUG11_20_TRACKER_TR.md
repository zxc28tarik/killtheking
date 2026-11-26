# Kill the King — BUG11–20 takip kaydı

Başlangıç: 38313f68117efd7fd32f9ccc4bd07ce5fcce48a6. Kullanıcının aktardığı ikinci hata taraması; 13/14/16/20 önceki sohbetin fonksiyon testi raporuna dayanır, burada henüz tekrar doğrulanmadı.

| ID | Sorun | Öncelik | Durum |
|---|---|---|---|
| BUG11 | TPS saldırı başlangıcı | Kritik | Main'e işlendi; CI ve Chromium PASS |
| BUG12 | Kalkan çarpması farklı katlar | Kritik | Main'e işlendi; CI ve Chromium PASS |
| BUG13 | Eğilme isabet hacmi | Kritik | Main'e işlendi; CI ve Chromium PASS |
| BUG14 | Ölen okçunun etkisiz oku | Yüksek | Main'e işlendi; CI ve Chromium PASS |
| BUG15 | Fıçı isabet önceliği | Yüksek | Kod adayı; CI bekliyor |
| BUG16 | Dikey tavan çarpışması | Kritik | Kod adayı; CI bekliyor |
| BUG17 | Yeniden doğuş hareketi | Yüksek | Açık |
| BUG18 | Maç sıfırlama | Yüksek | Açık |
| BUG19 | Fıçı durumunun taşınması | Orta | Açık |
| BUG20 | Ters uçan ok modeli | Orta | Açık |

BUG11: oyuncunun göz kotundaki gerçek konumu tek fizik başlangıcı; yön mevcut kamera quaternion'ından. TPS nişangâh yakın mesafe paralaks kalibrasyonu ve gerçek namlu modeli ayrı iş; hasar/silah menzili değişmedi. Ok ilk 0.9 m'yi atlamadan fizik adımına girer. BUG15 fıçı/asker önceliği bu aşamada bilinçli olarak değişmedi.
BUG12: aynı BUG03 dikey sınırı (1.35) ve 3B 6.5 menzil; mevcut yatay yön eşiği korunur, duvar kontrolü gerçek ayak kotu+1.6 üzerinden. Arena ve ordu motoru aynı fizik kontrolünü kullanır; 85 hasar ve itme değiştirilmedi.
Test: tests/bug11-12-player-attack.test.mjs; gerçek inline fonksiyonlar, Three r128, kaynak bağlantı kontrolleri. Canlı FPS/TPS kuşatma kabulü henüz yapılmadı. Bot taktikleri, menü, ışık ve renk değiştirilmedi.

BUG11–12: PR #98, main bef561e003d60888256b6a61bf5fdf909884aead; 239/239, CI 45820542623 / 45820517677 ve Chromium 45820542616 başarılı. Yakın mesafe TPS nişangâh ve canlı kuşatma manuel kabulü açık.

BUG13: üç köprüde currentHeight; 2.35 göz kotunda eski 3.55 hacim, 1.35 göz kotunda 1.9 hacim; sürekli geçiş, oranlı anatomik Y eşikleri. Ayak kotu ve yatay yarıçap korunur; AI nişan seçimi, hasar, Arena motoru değişmedi.
BUG14: aktif projectile kaydı ve orijinal okçu kimliği/takımı doğrulanır; ölü okçu yeni atış veya normal hasar üretemez. Havadaki ok önceki gibi dost/duvar engeline takılır, hasar ve öldürme kredisi korunur. 6 yeni test; CI ve Chromium bekleniyor.

BUG13–14: PR #99, main 1943ea8a1332c680938415b50845f0e749494bb1; 245/245, CI 45821703077 / 45821709985, Chromium 45821710064 PASS. İlk build hash onayı yenilendi. Manuel canlı kabul açık.

BUG15: tek en yakın dünya/fıçı/bot/ordu isabeti, dost asker atışı durdurur. Hasar ve menzil değişmedi.
BUG16: üst yüzey altına fiziksel tavan sınırı, yukarı hız iptali, ayak kotu sabit crouch/stand geçişi, hızlı düşüşte platform yakalama. Var olan XZ/ramp çözümü korunur. 7 yeni test; CI ve canlı kabul bekleniyor.
