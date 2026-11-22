# KILL THE KING — V24 / Savaş Meclisi Arayüz Kompozisyonu

23 Kasım 2026. V21 → V22 → V23 onaylı arayüzlerinin **orijinal tek AK09/G5.4 FPS oyunu** içinde nitelikli görsel bütünlük geliştirmesi.

## Değiştirilemez ilkeler
- Arena / Meydan 70v70 / Kale Kuşatması 70v70 **aynı mevcut FPS motoru, aynı 29 script/ilk 28 bayt-eşit script**, aynı savaş ve kontrol sözleşmeleri.
- Sınıf isimleri ve gerçek menü: ŞÖVALYE, PİYADE (MIZRAK), OKÇU (UZUN YAY), TÜFEKÇİ (1600). Görsel motifler bu gerçek sınıfları kapatmaz, başlıkları değiştirmez.
- F6–F9 kuşatma emirleri, F10 bölük komutları, 140 asker, 600 HP kapı, animasyonlar, kamera, hasar, AI, collision, 3B harita görüntüsü aynen korunur.
- V24 yalnız **sunum/örtüşmeyen CSS**; bağımsız iframe, oyun modu, yeni buton/timer/listener, sahte istatistik, farklı shader/savaş nesnesi yok.
- Performans/FPS optimizasyonu son aşamaya bırakıldı; publisher pitch deck ancak kullanıcı açıkça isteyince yapılır.

## V24-A — Ana menü kompozisyonu
- [x] Ana panel için koyu mürekkep/mat taş ve yumuşak bronz kenarlı çerçeve, görsel hiyerarşi, sade negatif alan.
- [x] Başlık ve menü şeridinde altın tonları, belirgin bölüm başlıkları ve okunaklı puntolar.
- [x] **Üç gerçek harita kartı için birbirinden farklı özgün SVG gravürleri**: Arena iç kale/surlar, Meydan tepeler-ağaç silueti, Kuşatma duvar/ana kapı.
- [x] Her harita kartının seçili/hover/düşük ekran yüksekliği/dar ekran görünümleri; mevcut Romen rakamı ve ✓ kimlikleri korunur.
- [x] Dört gerçek sınıf kartında V23 armalarını büyütmeden netleştiren doku/kontrast, rol rengine göre kenar, metin ve seçili hiyerarşi.
- [x] Tek asıl başlangıç düğmesinin tipografi, kontrast ve seçili ayarlar ile malzeme uyumu.

## V24-B — Savaş HUD ve taktik arayüz
- [x] Savaş HUD kutularında az yer tutan okunaklı yüzeyler; dinamik sağlık, cephane, süre değerleri asla değiştirilmez.
- [x] Gerçek Meydan emirleri ve Kale kuşatma F6–F9 butonlarında pasif/seçili/klavye odağı hiyerarşisi.
- [x] Taktik ekranındaki harita çerçevesi, panel ayrımı ve tıklanabilir mevcut eylemlerin görsel kalitesi.
- [x] Canlı skor ve maç sonucu ekranlarında açık sayı/metin, ölçülü satır bölücüler.
- [x] 390px tek sütunlu menü, 730px altı kısa ekran; yüksek kontrast ve reduced-motion desteği.

## V24-C — Teknik kabul
- [x] `recovered/native-siege/native-ui-v24.js` yeni CSS modülü (yalnız `<style>` ve body class), V21/V22/V23'ten sonra yüklenir.
- [x] `recovered/native-siege/build_canonical_three_maps.mjs` önceki korunan 28 script dışına dokunmadan aynı son scriptte V24'ü kurar.
- [x] `recovered/native-siege/test_native_ui_v24.mjs` bağımsız üç harita gravürü, dört mevcut arma, CSS/DOM, tek kurulum, erişilebilirlik, script bütünlüğü doğrular.
- [x] Gerçek Chromium 3 harita ve 390px tarayıcı kabulüne V24 stil, 3 bağımsız gravür, 4 arma ve savaş paneli sözleşmeleri eklendi.
- [x] Otomatik kanonik `index.html` senkronizasyonu ve 140 asker uzun süreli kuşatma regresyon akışında V24 izlenir.
- [x] PR #60 son uygulama `f1ac994a8` için üç GitHub Actions akışı PASS (23.11.2026): genel oyun `45078996183`; özgün üç haritanın gerçek Chromium/SwiftShader kabulü `45078996237`; 140 asker uzun kuşatma ve replay `45078996188`.
- [x] PR #60 `ee068c51` olarak `main` dalına birleştirildi (23.11.2026). Aynı merge SHA için üç test PASS: genel oyun `45079202713`, üç harita Chromium/WebGL `45079202655`, 140 asker uzun kuşatma ve tekrar oynama `45079202648`.
- [ ] Kullanıcının fiziksel Windows ekran kartında oynanış ve görsel kabulü tamamlanmadı.

## Kayıtlar
- Önceki onaylı paket: `docs/V23_UI_COMMAND_HERALDRY_TR.md`, PR #59, ana dal merge `b830f6f5`.
- Modül: `recovered/native-siege/native-ui-v24.js`.
- Test: `recovered/native-siege/test_native_ui_v24.mjs`.
- Tarayıcı kontrolü: `recovered/native-siege/browser_canonical_three_maps.mjs`.
- Gerçek tek dosya HTML: repo kökündeki otomatik oluşturulan `index.html`.

**Dışarıda:** FPS performansı, yeni mod, silah/savaş dengesi değişimi, orijinal scriptlerde yeniden yazım ve yayıncı sunumu.

## V24 son görsel inceleme / teslim notu
- Üç SVG harita gravürü **arka planın ön yüzeyine** alındı. Mat koyu malzeme gradyanı önce çizimi kapatabiliyordu; yeni tarayıcı/kaynak testleri sadece URL varlığını değil, görselin CSS katmanında gerçekten en önde boyanmasını da kontrol ediyor.
- Bu adım orijinal harita geometrisi, malzemeler, asker/atış veya render performansını değiştirmez.
- Üretilen `index.html` yalnız resmi kaynak derleyiciden gelir. Hızlı ardışık commitlerde oluşan CI non-fast-forward çakışmasına karşı güvenli en fazla beş denemelik senkronizasyon eklendi; asla force-push yok.

## V24 ana dal kapanış
- V24 mühendislik ve sunum katmanı testleri tamamlandı. Üç farklı gravür, orijinal dört sınıf arması, mevcut sınıf/harita seçimleri, F6–F10 komutları, tek HTML ve 28 korunan özgün script korunuyor.
- PR dalındaki ilk birkaç CI hatası, kod commit'i ardından kanonik `index.html` senkronizasyonu henüz güncellenmediği için geçici oluştu. Eşzamanlı commit çakışması için güvenli retry eklendi; **son PR ve ana dal testleri yeşil**.
- Kullanıcının Windows fiziksel GPU estetik kabulü hâlâ açık; CI/SwiftShader testi buna eşdeğer değildir. FPS/perf optimizasyonu ve pitch deck üzerinde çalışılmadı.
