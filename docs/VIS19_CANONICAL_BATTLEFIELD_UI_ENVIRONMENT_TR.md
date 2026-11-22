# Kill the King — VIS-19 Kanonik Meydan/Kale Görselliği + Savaş HUD

Tarih: 22 Kasım 2026  
Kaynak: `main` kanonik tek oyun, özgün 28 FPS/G5.4 savaş scripti + kontrollü 29. script entegrasyonu.  
PR: https://github.com/zxc28tarik/killtheking/pull/54

## Değişmeyen sözleşme
- **Üç harita, aynı orijinal oyun:** Serbest Arena, 140 G5.4 askerli Meydan Savaşı ve 140 askerli Kale Kuşatması.
- Yalnızca görsel/arayüz katmanı. Mevcut bot AI, silah dengesi, süngü, okçuluk, kamera, özgün hareket, F6–F9 emirleri, koçbaşı ve mancınık fiziği, oyuncu/asker çarpışmaları ve G5.4 zafer koşulları aynen korunur.
- G8.4, 200–280 asker ve fiziksel GPU optimizasyonu **tamamlanmış sayılmaz**.
- Kuşatma ayrı iframe/oyun değildir; kanonik tek HTML içinde 29 script, özgün ilk 28 byte-eşitliğinde korunur.

## VIS-19-A — Düzgün 140 asker arayüzü
- Normal Arena'nın özgün HUD ve 6 bot görünümü korunur.
- Meydan ve Kale Kuşatması aktifken gösterişli eski üst logo, ilgisiz FFA öldürme serisi ve oyuncu kontrolü olmayan sahte sohbet görsel olarak gizlenir.
- Ordu emirleri iki ordu haritasında da **varsayılan küçük panel** olarak açılır; F10 ile tüm özgün komutlar gösterilip yeniden küçültülebilir. F6–F9 kale makinelerini, eski G/J/K/L/Z/X/P gibi asker emirlerini korur.
- Meydan paneli sola, kale paneli sağa daha küçük ve okunaklı yerleşir. Küçük ekran CSS ayrı ayarlanır.
- Sonuç ekranındaki HUD gizleme ve yeniden başlatma temizliği VIS-19 tarafından değiştirilmez.

## VIS-19-B — Gerçek 3B Meydan çevre silueti
- Orijinal 1697×1697 düz çimenlik, 14.700 mevcut çim instanceleri, G5.4 spawn/navigasyon ve görüş korunur.
- Yalnız savaşın merkezinden uzakta, 12 grup hâlinde **180 adet deterministik dekoratif ağaç**. 3 adet InstancedMesh render grubu: gövde, alt ve üst taç.
- Değişen ahşap yeşili/yoğunluğu, küçük tilt, farklı ağaç yükseklikleri. Testte merkeze minimum mesafe kontrol edilir; merkez 70v70 hareket alanına müdahale yok.
- Yeni colliders, nav/walkable rampa, atışa engel mesh veya balistik obje **yok**. Bunlar gerçekten korunaklı orman değildir; uzak arka plan öğesidir.

## VIS-19-C — Kale Kuşatması fiziksel kapısına görsel giydirme
- Gerçek G5.4 yıkılabilir kale kapısı mesh'inin **çocuğu olarak** ahşap tahta sıraları, demir traversler ve perçinler eklendi. Kapı açılınca yeni dekor da aynı native görünürlükle kaybolur.
- Sur ön yüzlerine toplu instanced render ile yatay derz ve şaşırtmalı dikey taş sıraları eklendi; surların aynı blok görüntüsü yumuşatıldı.
- Eklenen dekorlar `worldMeshes`, `colliders`, A* nav ve fizik taş ışını listelerine eklenmedi. Kapı canı (600) ve gerçek koçbaşı/mancınık isabet koşulu değişmedi.

## Kanıt kapıları
- [x] Kaynak ve sahte Three.js (mock) Node regresyonları eklendi: `test_native_visual_v19.mjs`.
- [x] Gerçek Chromium/WebGL üç harita testi V19 için ağaç, duvar/kapı, HUD görünürlüğü, oyun içi F10 aç/kapat kontrolleriyle genişletildi.
- [x] V19b son kaynakta 3 harita gerçek Chromium/yazılımsal WebGL PASS, hata sayısı 0; gerçek ekran görüntüsü incelendi: [run #45044651947](https://github.com/zxc28tarik/killtheking/actions/runs/45044651947). Meydan çevresindeki 180 ağaç merkezi alandan en az **367 metre** uzakta; uzaktaki ağaçlık sıra artık merkez kamerada görünür; Arena'da gizlidir.
- [x] Özgün G5.4 140 asker/koçbaşı/mancınık erken zafer, kapı dekorunun gerçek kapıyla beraber yıkılması ve yeni maçta geri gelmesi, uzun hızlandırılmış WebGL testinde PASS: [run #45044652074](https://github.com/zxc28tarik/killtheking/actions/runs/45044652074).
- [x] Normal ana oyun 175 regresyon kontrolü ve çevrim dışı root HTML senkronizasyonu PASS: [run #45044651988](https://github.com/zxc28tarik/killtheking/actions/runs/45044651988).
- [ ] Gerçek Windows Chrome/Edge GPU ile FPS, 1%-low, 4–8 dakika insan oynanışı ve görsel kabul.
- [ ] Gerçek yürünebilir iç tepeler ve vadiler: bunun için asker Y, G5.4 nav, bot ve kurşun/ok arazi kesişimi ayrı kabul gerektirir.

## Kaynak dosyalar
- `recovered/native-siege/native-battlefield-visual-v19.js`
- `recovered/native-siege/build_canonical_three_maps.mjs`
- `recovered/native-siege/test_native_visual_v19.mjs`
- `recovered/native-siege/browser_canonical_three_maps.mjs`
- Derlenmiş `index.html`: kaynakla senkron, indirilebilir tek orijinal oyun.

## Takip
Bir sonraki görsel geçiş: Uzaktan gerçek ağaç siluetleri ve kapı malzemelerinin ekran görüntüsüyle yorumlanması, ardından gerçek 3B iç tepe/yer yüksekliğinin asker fiziğine ve mermi hattına birlikte bağlanması. Oyuncu doğrulanmış hareket/AI dengesi bozulmadan.

## V19b görsel ekran incelemesi
- 1000×680 gerçek yazılımsal WebGL görüntüsünde Meydan komuta HUD'u 310×108 piksel ve ekranın sol üstünde; 500 piksel yüksekliğindeki eski panel artık oyun görüşünü kaplamıyor.
- Meydan çevre ağaçları 180 adet/3 instanced çizim, en yakın mesafe 367 m. Yalnız uzakta bir orman hattı gibi algılanıyor, engel/çarpışma unsuru değil.
- Kale ön cephesinin taş derzleri ve kapı plakaları görüntüde mevcut. Devam eden görsel kalite çalışmasında silah/koçbaşı ön plandaki kaba siluet de ayrıca ele alınmalı; V19 onu kaldırmadı.
