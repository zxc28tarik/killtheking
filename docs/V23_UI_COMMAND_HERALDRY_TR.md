# Kill the King — V23 / Komuta Armaları ve Taktik Arayüz Kalitesi

Başlangıç: 22 Kasım 2026. Sıradaki arayüz kalite aşaması; V21 ve V22 onaylı görsel dili üzerinde yalnız **özgün tek FPS oyununun** sunumuna uygulanır.

## Değişmeyen kararlar
- Tek orijinal AK09/G5.4 FPS oyunu, aynı üç harita: Arena, 70v70 Meydan Savaşı, 70v70 Kale Kuşatması.
- Korunan 28 özgün JS scripti bayt eşit olmalı; V23 kodu 29. script içinde salt görünüm modülüdür.
- Mevcut sınıf kartları, oyun içi HUD, F6–F10 tuşları, botlar, askerler, silahlar, atış sistemi, yapay zekâ, kamera ve harita çarpışmaları değişmez.
- FPS/perf optimizasyonu son aşamaya ayrılmıştır; pitch deck yalnız kullanıcı istediğinde başlar.
- V23, V22'yi değiştirmek veya ikinci bir oyun açmak yerine onun üstüne CSS yükler; mevcut HTML dışında iframe, sahte menü, sahte savaş istatistiği yoktur.

## V23-A — dört sınıfın görsel kimliği
- [x] Şövalye, Piyade (Mızrak), Okçu (Uzun Yay), Tüfekçi (1600) için **özgün tek renkli vektör arma**.
- [x] Arma, var olan sınıf kartının yazılı başlığından okunarak atanır; açıklama metninden yanlış sınıf çıkarılmaz. Şövalye için ayrıca kalkan arması vardır; eski bir sürümdeki Kılıçlı varsayımı kullanılmaz.
- [x] Kartlar için rol rengiyle ince alt kenar, seçili durumda vurgu, klavye focus görünümü ve okunur başlıklar.
- [x] Arma `::before` üzerinden dekoratif gösterilir; orijinal butonlara ikinci tıklama/dinleyici eklenmez.
- [x] Bilinmeyen başlıklar görsel süsleme olmadan korunur, oyun seçimi asla engellenmez.

## V23-B — taktik komuta ve maç HUD
- [x] Meydan F10, Kale F6–F9 panel butonları için kontrast, hover/seçili/pasif durumlar.
- [x] Taktik harita için baskı-altın kenar ve ölçülü derinlik; görüntü/kontrollerin üzerine ek oyun paneli bindirilmez.
- [x] Skor/maç sonuçları için aynı yüzey sistemi; satırlarda hafif ayrım.
- [x] Ana menü harita seçimleri, başlatma düğmesi, HUD sağlık/cephane/süre yüzeyleri ortak tasarım dili.
- [x] 390px ve düşük pencere yüksekliğinde ikon boyutları; reduced-motion ve yüksek kontrast modları.

## V23-C — kod ve gerçek tarayıcı kabulü
- [x] `recovered/native-siege/native-ui-v23.js` salt dekoratif V23 kodu.
- [x] `recovered/native-siege/build_canonical_three_maps.mjs` V23 kurulumu tek 29. scriptte, V21/V22 sonrasında.
- [x] `recovered/native-siege/test_native_ui_v23.mjs` arma, kimlik, tekrar kurulum ve korunan 28 script doğrulaması.
- [x] `recovered/native-siege/browser_canonical_three_maps.mjs` gerçek dört sınıf ve özgün vektör görseli, üç oyun modu, savaş HUD, 390px testleri.
- [x] Kanonik kök `index.html` otomatik senkronizasyonu ve 140 askerli kuşatma testi iş akışına V23 ekleme.
- [x] V23 son uygulama `bd4a7f7` üzerinde üç GitHub Actions akışı PASS (22.11.2026): genel regresyon `45069033538`, gerçek 3-harita Chromium/SwiftShader (4 arma ve 390px menü dahil) `45069033534`, 140 asker hızlandırılmış oyun-zamanı kuşatma/replay `45069033531`.
- [x] PR #59 `b830f6f5` ile `main` dalına birleştirildi (22.11.2026); aynı commit için üç test PASS: genel oyun `45069289743`, orijinal üç haritanın Chromium/SwiftShader kabulü ve 390px görünümü `45069289790`, 140 asker uzun kuşatma ve replay `45069289814`.
- [ ] Kullanıcının Windows üzerinde gerçek GPU estetik kabulü.

## Önceki doğrulanmış temel
- V22 / PR #58 birleştirme: `02d63a7b`; `main` testleri PASS: genel oyun `45067270845`, üç harita Chromium `45067270854`, 140 asker uzun savaş `45067270931`.
- Mevcut son arayüz planı: `docs/V22_UI_WAR_ROOM_IMPLEMENTATION_TR.md`.

**Yayıncı sunumu ve performans ölçüm işi bu geliştirme paketinin parçası değildir.**

## Gerçek Chromium sırasında bulunan sınıf kimliği düzeltmesi
- İlk V23 browser testi `45068499926` dört karttan üçünü tanıdı; bu, oyun hatası değil süsleme eşleştirme eksikliğiydi.
- Gerçek kart başlıkları `ŞÖVALYE`, `PİYADE (MIZRAK)`, `OKÇU (UZUN YAY)`, `TÜFEKÇİ (1600)` olarak Chromium konsolundan doğrulandı.
- Şövalye için özgün kalkan arması eklendi ve test fixture'ı tam gerçek isimlere güncellendi. Tüm sınıf isimleri Türkçe harf kurallarıyla tanınır.

## V23 son kabul notu
- Şövalye, Piyade, Okçu ve Tüfekçi rozetleri gerçek Chromium'da dörtte dört doğrulandı. Üç haritanın oyun motoru ve 140 asker verisi değişmedi.
- İlk Chromium turundaki `3/4` arma teşhis edildi ve gerçek **ŞÖVALYE** başlığıyla düzeltildi. Sonraki turdaki mobil rapor `v23` alanı eksikliği giderildi; güncel `bd4a7f7` üç ana testte PASS.
- Bu kabul, gerçek Windows ekran kartında estetik değerlendirme veya FPS/performans optimizasyonu anlamına gelmez.

## Main kapanış (22.11.2026)
- **V23 mühendislik/test aşaması tamamlandı.** Vektör Şövalye/Piyade/Okçu/Tüfekçi armaları 29. script içindeki özgün CSS görsel katmanıdır, 28 korunan script bayt eşit kalmıştır.
- Fiziksel Windows GPU üzerindeki görsel beğeni/kabul testi kullanıcıyla yapılacak; **FPS optimizasyonu başlatılmadı**.
- Sonraki UI geliştirmelerinde bu V21 → V22 → V23 katmanları ve geçmiş kazanımlar korunacak.
