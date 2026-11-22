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
- [x] AK09'un tek HTML'si üzerine Meydan görselleri uygulandı; çıktı sıfır iframe ve 29 script içeriyor (GitHub CI 45035743238 PASS).
- [x] Orijinal 28 script byte-eşitliği ve yeni 29. script sözdizimi Node ile doğrulandı (CI 45035743238 PASS).
- [x] AK09 kanonik derlemesi tek menüde normal Arena/TDM, 70v70 Meydan, 70v70 Kale Kuşatması seçimlerini koruyor (kaynak testi PASS; son derleme için canlı kullanıcı kabulü açık).

### KTK-MAIN-02: Görsel iyileştirmeleri gerçek motora taşı
- [x] 2.700 uzak + 12.000 yakın instanced çim yeni native derlemeye bağlandı, geometri küçültüldü; kalede görünürlük/mekân son tarayıcı kabulü açık.
- [x] Meydan düz fizik zemini üzerinde V18 doğal ton kırılması ve sınır dışı tepe silueti kanonik derlemeye bağlandı; görsel nihai kabul açık.
- [x] Meydan'a özel [H] doğal ışık paleti kanonik derlemeye bağlandı; normal kale dönüşü için eski atmosfer geri yükleniyor (kaynak testi PASS; gerçek görsel kabul açık).
- [ ] Askerlerin yürüyebileceği gerçek yükseltiler ayrı fizik/navigasyon/atış kabulü olmadan açılmayacak.
- [ ] Kale taş/ahşap/ekipman görselleri, etkileşimleri ve özgün çarpışma korunacak.
- [ ] Gerçek ekran görüntüsüyle HUD ve aşırı parlak çimen rengi yeniden değerlendirilecek.

### KTK-MAIN-03: Mod/oynanış regresyonu
- [ ] FFA/TDM: 6 bot, dört sınıf, solo bot okçusu 0,5 s hazırlık, oyuncu yayı minimum 2 s / tam 3 s, 4 s atış kadansı, tüfek 15 s.
- [ ] Meydan: orijinal 140 G5.4 asker / 8 bölük, canlı emirler ve güvenli taraf ayrımı.
- [ ] Kale: yine orijinal 140 asker, F6–F9 ekipman, F10 panel, kapı/koçbaşı/mancınık/kule ve avlu ele geçirme.
- [ ] Geçişlerde geriye görünmez collider, asker AI, kuşatma ekipmanı, HUD kalmayacak; kamera/silah hissi değişmeyecek.

### KTK-MAIN-04: Bağımsız doğrulama
- [x] Node: native AK06-AK09 + canonical build testleri / SHA / 29 script / menü kimliği GitHub Actions #45035743238 PASS.
- [x] Chromium yazılımsal WebGL: native Arena, Meydan ve Kuşatma ayrı gerçek menü başlatmalarında açıldı; native FFA 6 bot, Meydan 140 ordu durumuyla ve kuşatma 140 canlı G5.4 askeriyle doğrulandı. Sayfa/konsol hataları yok. GitHub #45036335268 PASS.
- [ ] Aynı tarayıcı sekmesinde gerçek UI geçişlerinin uzun regresyonu ve dinamik maç sonu/tekrar oynama kabulü.
- [ ] Windows/Chrome/Edge gerçek GPU: manuel 4–8 dakika, ESC/işaretçi kilidi, F6–F10, silah/çarpışma, 1% low, ses.
- [x] Eski S3D1 üç iframe çıktısı arşiv olarak belgelendi; README, index.html ve varsayılan Python build yeni native oyuna bağlandı.

### KTK-MAIN-05: Ana dalı toparlama
- [x] PR #51 ana dalda birleştirildi: 71f80717b08bd7f46f2a5148f19d73f5a7b138af (22 Kasım 2026). Geliştirme baseline'ı; Windows donanımda final ürün kabulü değil.
- [x] Geliştirme dalındaki README son kanonik tek HTML/artifact adresini gösteriyor; eski iframe paketi arşiv olarak işaretlendi.
- [x] Varsayılan index.html kanonik HTML ile senkronlandı (GitHub Actions sync); aynı 29 scriptli, sıfır iframe'li kaynak. Gerçek GitHub Pages yayını ayrıca doğrulanacak.
- [x] tools/build_offline.py artık varsayılan olarak kanonik oyunu ve SHA manifestini üretiyor; eski Ekim sürümü yalnız --legacy ile üretiliyor. CI root index ve indirilen HTML'nin birebir aynı olmasını kontrol ediyor.
- [ ] Main'e merge sonrası main CI ve indirilebilir artifact kontrol edilecek.
- [x] Bundan sonra yeni işler için güncel main'den kısa özellik dalları ve PR yaklaşımı başladı (postmerge dokümantasyon dalı).
- [ ] G8.4 / 200–280 asker / donanım FPS henüz kabul edilmediyse tamamlandı yazılmayacak.

## Nihai kalite ölçütü
**Kale Kuşatması'na girince oyuncu başka bir oyuna geçmiş gibi hissetmemeli: aynı FPS/TPS hareketi, silah, kamera ve asker sisteminin üzerinde yeni harita/hedefler çalışmalı.**

## İlgili kanıtlar
- docs/AK_NATIVE_09_THREE_MAP_GL_QA.md
- docs/MAP_2_3_VISUAL_UPGRADE_V1_TR.md
- recovered/army/integration/build_three_mode_launcher.mjs (eski tarihî alternatif, kanonik değil)

## 22 Kasım kanonik derleme ilk teknik kabulü
- PR #51: https://github.com/zxc28tarik/killtheking/pull/51 (MERGED into main, 22 Kasım 2026).
- GitHub Actions #45035743238 PASS: https://github.com/zxc28tarik/killtheking/actions/runs/45035743238
- İndirilebilir artifact #14759696307: tek özgün FPS/3 harita HTML + SHA manifesti.
- Sıfır iframe; 29 script, 28 özgün kaynak scripti korunmuş; AI/hasar/klavye değişiklikleri yapılmadı.
- DİKKAT: Bu yeni çıktının gerçek 3 haritalı Chromium/WebGL ve Windows GPU ile uzun oynanış kabulü henüz yapılmadı. CI PASS ≠ kullanıcı yayın onayı.

## Kanıtlı güncel teslim yolu
- Native aynı-motor WebGL gerçek üç harita başarı: https://github.com/zxc28tarik/killtheking/actions/runs/45036335268
- Root HTML senkron iş akışı: https://github.com/zxc28tarik/killtheking/actions/runs/45037130874
- Kök index.html SHA-256: 82590f78165e8e4d9ffc77cf13add7fc2626d79b479548d35f203ac21937caec (kanonik üretici)
- Eski October kaynak testi arşivde: recovered/legacy/KillTheKing_October_Original_Source_Index.html. Bu testleri, güncel index.html ile karıştırma.
- Windows gerçek donanım FPS, farenin ESC/pointer lock davranışı, insan oynanışı ve son görsel/publisher kalite kabulü açık.

## 22 Kasım — Main'e geçiş
- Native asıl FPS üç harita ve default offline HTML aynı sürümdür. Main merge 71f80717b08bd7f46f2a5148f19d73f5a7b138af.
- Main CI/regresyon takibi: https://github.com/zxc28tarik/killtheking/actions/runs/45037651090
- Main gerçek yazılım WebGL kontrolü: https://github.com/zxc28tarik/killtheking/actions/runs/45037651080
- **Kalan önemli test:** Windows GPU 1%-low FPS, 4–8 dakikalık oyuncu oturumu, maç bitişi/yeniden başlatma, gerçek kullanıcının ESC/fare kilidi ve HUD görsel/UX kabulü.
