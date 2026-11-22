# KILL THE KING — KANONİK ANA OYUN / ÜÇ HARİTA BİRLEŞTİRME PLANI
Tarih: 22 Kasım 2026 · Çalışma dalı: codex/canonical-native-three-maps · Hedef: main

## Kilit karar
**Kale Kuşatması, Arena ve Meydan Savaşı'ndan farklı bir oyun/motor/iframe değildir.** Tek orijinal Kill the King FPS kamera, hareket, silah, HUD, G5.4 ve Three.js oyun döngüsünün **üçüncü harita/savaş seçeneği** olacaktır. FFA/TDM, 140 askerlik meydan ve kale kuşatması aynı HTML/oyun döngüsünde açılır.

## Main'in geride kalma nedeni ve kaynak
- Ekim'deki main'i korumak için işler taslak PR'larda kaldı; kalıcılaşan bu yöntem sürüm birikimi yarattı.
- 21 Kasım native dalı main'den 503 commit ileride; 22 Kasım visual dalı bunun 79 commit ilerisinde. Bu dallar, aynı commit hattının birikmiş sürümleridir.
- Eski recovered/army/integration/build_three_mode_launcher.mjs, S3D1 ayrı kuşatma iframe'ini paketliyor; kullanıcı onayı olan üçüncü-harita tasarımının tersidir.
- **Tek kanonik temel:** recovered/native-siege/KillTheKing_AK_NATIVE_09_original_game_siege_map.html. AK09, özgün 28 script, aynı FPS/G5.4 kamera/silah/AI, 140 asker, gerçek 3 seçim ve kuşatma makineleri barındırır.
- G8.4 orijinal oyun kaynağı geri kazanılmış değildir; G5.4 ile karıştırılmayacak.

## Büyük aşamalar ve kabul kapıları

### KTK-MAIN-01: Tek oyunun kanonik derlemesi
- [x] Native AK09 ana kaynak olarak seçildi; eski S3D1 arşivde kalacak.
- [x] Yeni kanonik entegrasyon dalı açıldı.
- [ ] AK09'un tek HTML'si üzerine Meydan görselleri eklenecek; üç ayrı iframe oluşturulmayacak.
- [ ] Orijinal 28 script byte-eşitliği ve 29. scriptin görsel değişiklikleri test edilecek.
- [ ] Tek ana menü: normal Arena/TDM, 70v70 Meydan, 70v70 Kale Kuşatması.

### KTK-MAIN-02: Görsel iyileştirmeleri gerçek motora taşı
- [ ] Meydan'da 2.700 uzak + 12.000 yakın, küçük instanced çim; kalede görünmeyecek.
- [ ] Meydan düz fizik zemini üzerindeki doğal ton kırılması, sınır dışı tepe siluetleri.
- [ ] Meydan'a özel [H] ile seçilen üç doğal atmosfer; kale geri dönüşünde orijinal atmosfer.
- [ ] Askerlerin yürüyebileceği gerçek yükseltiler ayrı fizik/navigasyon/atış kabulü olmadan açılmayacak.
- [ ] Kale taş/ahşap/ekipman görselleri, etkileşimleri ve özgün çarpışma korunacak.
- [ ] Gerçek ekran görüntüsüyle HUD ve aşırı parlak çimen rengi yeniden değerlendirilecek.

### KTK-MAIN-03: Mod/oynanış regresyonu
- [ ] FFA/TDM: 6 bot, dört sınıf, solo bot okçusu 0,5 s hazırlık, oyuncu yayı minimum 2 s / tam 3 s, 4 s atış kadansı, tüfek 15 s.
- [ ] Meydan: orijinal 140 G5.4 asker / 8 bölük, canlı emirler ve güvenli taraf ayrımı.
- [ ] Kale: yine orijinal 140 asker, F6–F9 ekipman, F10 panel, kapı/koçbaşı/mancınık/kule ve avlu ele geçirme.
- [ ] Geçişlerde geriye görünmez collider, asker AI, kuşatma ekipmanı, HUD kalmayacak; kamera/silah hissi değişmeyecek.

### KTK-MAIN-04: Bağımsız doğrulama
- [ ] Node: kaynak hash, oyun script sözdizimi, menü/kimlik, mevcut native testleri.
- [ ] Chromium yazılımsal WebGL: normal arena -> Meydan 140 -> kuşatma 140 -> normal kale; 3D ve UI; sıfır sayfa/konsol hatası.
- [ ] Windows/Chrome/Edge gerçek GPU: manuel 4–8 dakika, ESC/işaretçi kilidi, F6–F10, silah/çarpışma, 1% low, ses.
- [ ] Eski S3D1 üç iframe çıktısı varsayılan oynanabilir oyun olarak dağıtılmayacak.

### KTK-MAIN-05: Ana dalı toparlama
- [ ] Ana dala hedeflenen PR; kanonik HTML ve testler doğrulandıktan sonra birleştirme.
- [ ] README ve release yolu, kanonik tek HTML + SHA + manifest içerecek.
- [ ] Yeni işler: güncel main'den kısa ömürlü özellik dalları, PR, test ve zamanında merge.
- [ ] G8.4 / 200–280 asker / donanım FPS henüz kabul edilmediyse tamamlandı yazılmayacak.

## Nihai kalite ölçütü
**Kale Kuşatması'na girince oyuncu başka bir oyuna geçmiş gibi hissetmemeli: aynı FPS/TPS hareketi, silah, kamera ve asker sisteminin üzerinde yeni harita/hedefler çalışmalı.**

## İlgili kanıtlar
- docs/AK_NATIVE_09_THREE_MAP_GL_QA.md
- docs/MAP_2_3_VISUAL_UPGRADE_V1_TR.md
- recovered/army/integration/build_three_mode_launcher.mjs (eski tarihî alternatif, kanonik değil)
