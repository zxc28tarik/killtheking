# Kill the King — AK25: Gerçek Kale Savunması, 4× Kale ve 8× Kuşatma Haritası

## Oyuncunun kararı
Üçüncü oynanabilir harita olan **Kale Kuşatması**'nda iki ordunun birlikte kalede başlamaması gerekir. Kırmızı taraf savunucudur ve kalenin **içinde**, mavi taraf saldırgandır ve **dışında** başlar. Oyuncu mavi saldırı tarafında başlar. Kale boyutu en az dört katına, kuşatma savaş alanı en az sekiz katına çıkarılır.

## Ölçek — ölçüm yöntemi
| Alan | Eski referans | AK25 fiziksel sınırları | Hesaplanan alan çarpanı |
| --- | --- | --- | --- |
| Kale yerleşim/zemin alanı | 110 × 110 | 224 × 228,5 | 4,23× |
| Kuşatma navigasyon/zemin alanı | 220 × 220 | 624 × 624 | 8,04× |

**Önemli:** 4× ve 8× burada *toplam yüzey/yerleşim alanı* olarak tanımlanmıştır; doğrusal kenar uzunluğunun 4 veya 8 katı değildir. Yeniden boyama/scale hilesi değil; yeni fiziksel duvar, geçit, arka avlu ve gerçek dünya engelleri vardır. Oyun içi F10 harita ve radar, geniş alana uyarlanır.

## A — Gerçek saldırgan/savunucu doğma sistemi
- [x] Orijinal G5.4 140 asker ve 8 bölük korunur; yeni birlik yaratılmaz.
- [x] Mavi **70 saldırgan** orijinal gerçek güney kapısının dışında (`z ≤ -54`) başlar.
- [x] Kırmızı **70 savunucu** güney surunun iç tarafında (`z ≥ -36`) başlar; eski kırmızı tüfekçinin dış karakol `z=-54` doğması kaldırılır.
- [x] Oyuncu mavi tarafta sur dışında `z=-69` konumunda başlar.
- [x] Başlangıç 70/70 ayrımı gerçek askerlerin dünya koordinatlarından ölçülür; testte sahte asker enjekte edilmez.
- [ ] Gerçek tarayıcıda tüm başlangıç konumlarının doğrulanması.

## B — Gerçek fiziksel kale ve arazisi
- [x] Orijinal 110×110 kalenin çevresine 224×228,5 sınırında dış sur, dört fiziksel köşe kulesi eklenir.
- [x] Güney cephesinde ana **600 HP'li gerçek kapı** aynen kullanılır, yandaki surlar genişletilir.
- [x] Mevcut iç kalenin kuzey duvarında yalnız kuşatmada çalışan **16m gerçek arka geçit** açılır; iki tarafındaki duvarlar fiziksel çarpışmalı.
- [x] Büyük arka avluda fiziksel kışlalar ve gerçek engel geometrileri.
- [x] 624×624 harita zemini, kuşatma yaklaşım yolu, uzak ağaç hatları ve devriye/rotalar için geniş alan.
- [x] G5.4 bot ve FPS oyuncu çarpışma setine gerçek duvar/kışla kutuları verilir; kuşatma dışı haritalarda eski colliderlar geri gelir.
- [x] Yalnız kuşatmada kamera görüşü ve nav/radar/taktik harita sınırları genişler.

## C — Değişmeyen onaylı sistemler
- Tek orijinal FPS motoru, aynı **Arena / Meydan / Kale Kuşatması** seçimleri.
- İlk **28 özgün script bayt eşit**; yalnız 29. yerleşik scriptte kuşatma haritasına ait patch çalışır.
- Silahların hasarı, hızı, bot AI tanımları, takım sınıfları, F6–F10 komutları değişmez.
- Koçbaşı, mancınık, kuşatma kulesi ve kapı 600HP; orijinal kırılma, kuşatma emri, gerçek asker yolculuğu ve galibiyet kullanılır.
- Arena kalesinin orijinal haritası ve Meydan'ın açık çimenliği **yeniden ölçeklenmez**.
- FPS/performance optimizasyonu daha sonra; yayıncı pitch deck kullanıcı isteyince.

## D — Kabul ölçütleri / kalıcı kontrol
- [x] `native-siege-expansion-v25.js` görsel + fiziksel dış sur/zemin modülü.
- [x] `siege-expansion-patch-v25.mjs` ile orijinal 29. script için strict anchor'lı dönüşüm.
- [x] `test_native_siege_expansion_v25.mjs` oranlar, gerçek colliderlar, orijinal 28 script ve taraf ayrımını test eder.
- [x] Gerçek Chromium üç harita ve 120 sn hızlandırılmış G5.4 kuşatma akışına 70 iç / 70 dış, kapı ve alan kontrolleri eklendi.
- [x] GitHub orijinal tek `index.html` üretimi, kanonik oyun testi ve uzun kuşatma iş akışlarına AK25 kaydı.
- [ ] PR son commit'inde genel oyun, 3 harita Chromium/WebGL ve 140 asker uzun kuşatma/replay testleri PASS.
- [ ] Birleştirilen `main` üzerinde aynı 3 test PASS.
- [ ] Fiziksel Windows GPU ve kullanıcının bizzat oynayarak kale/alan kabulü.

## Kaynaklar
- Geliştirilen oyun: `recovered/native-siege/build_canonical_three_maps.mjs` ile üretilen **tek** `index.html`.
- Geliştirme dalı: `codex/siege-v25-defender-deployment-expanded-fortress`.
- Son onaylı arayüz kalitesi V24 / PR #60 korunur.

**Not:** Alanın büyük olması, otomatik olarak genişletilmiş savaş süresi veya farklı birlik sayısı anlamına gelmez. Bunlar ayrı kullanıcı kararı gerektirir.
