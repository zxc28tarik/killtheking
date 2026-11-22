# Kill the King — V22 / Savaş Meclisi Arayüz Kalitesi

Başlangıç: 22 Kasım 2026. V21-A/B/C/D/E üstüne kurulan **orijinal tek FPS oyununa ait** görsel katman.

## Değişmez ürün sözleşmesi
- Tek orijinal AK09/G5.4 FPS motoru, üç gerçek seçim: Arena, Meydan Savaşı (70v70), Kale Kuşatması (70v70).
- İlk 28 `<script>` bloğu bayt eşit korunur; tüm V22 kodu 29. script içinde CSS kuran **salt sunum modülüdür**.
- Gerçek sınıf seçimleri, harita ve oyun modu düğmeleri, HUD değerleri, F6–F9, F10, asker sayısı, yapay zekâ, savaş dengesi, kamera ve çarpışma değişmez.
- Sanal oyun statüsü, sahte savaş seçeneği, bağımsız iframe veya ayrı HTML motoru eklenmez.
- Performans/FPS optimizasyonu son aşamaya bırakılır. Yayıncı pitch deck, kullanıcı söyleyince başlar.
- V21 tasarım kararları: `docs/V21_UI_DESIGN_SYSTEM_AND_ROADMAP_TR.md`.

## V22-A — Ana menü ve seçim kalitesi
- [x] Tarihî savaş meclisi / koyu taş / eskitilmiş pirinç görsel dili, menü çerçevesi ve başlık hiyerarşisi.
- [x] Üç gerçek harita butonunun yüksek kontrastlı, Romen rakamlı, seçili/onaylı kart stili.
- [x] Gerçek dört asker sınıfı kartına ince malzeme derinliği, hover/seçili durumu; gerçek içeriğin üstüne hayalî stat eklenmedi.
- [x] Başlatma eylemi, ayar ve maç modu seçeneklerinde tipografi ve geri bildirim tutarlılığı.

## V22-B — Gerçek maç HUD ve komuta panelleri
- [x] Mevcut sağlık/cephane/süre/radar görünümünde kontrast ve sayı okunurluğu.
- [x] Meydan G5.4 F10 komutları ve Kale F6–F9 ekipman/emir panellerinde seçili/pasif/focus ayrımı.
- [x] Taktik harita, skor paneli ve sonuç ekranında ortak malzeme ve hiyerarşi.
- [x] 390px kompakt ve 720px altı alçak pencere düzeni, reduced-motion koruması.

## V22-C — Test güvenilirliği ve teslim
- [x] `browser_canonical_three_maps.mjs` içinde kuşatmada sabit 500ms bekleme yerine **gerçek oyun durumunun** `realSoldiers===140` olmasını bekleyen salt-okuma kontrolü.
- [x] Bu düzeltme oynanış ya da askeri veri üretmez; daha önce V21-E ana dalında rastlanan erken snapshot hatasını hedefler. Ana dal başarısız test: `45065575034`; eski V21-E kuşatma dayanıklılık testi aynı commit'te PASS: `45065574976`.
- [x] `test_native_ui_v22.mjs` ile UI modülü idempotence, mevcut kontrol referansları, 28 özgün script ve no-listener sözleşmesi.
- [x] Kanonik Chromium 3 harita/390px UI kabulüne V22 kontrolleri eklendi.
- [x] GitHub üç haritalı/140 asker ve otomatik kök HTML senkronizasyon iş akışına bağlandı.
- [x] PR #58 son uygulama `b65d59e1d` için GitHub Actions PASS (22.11.2026): genel oyun `45066984657`, kanonik kaynak/3 harita gerçek Chromium/SwiftShader `45066984661`, 140 asker hızlandırılmış oyun-zamanı uzun kuşatma ve replay `45066984671`. Testleri üretim Windows fiziksel GPU kabulü olarak sunma.
- [ ] Birleştirme sonrasında `main` üstünde QA doğrula.
- [ ] Kullanıcının fiziksel Windows GPU üzerinde tasarım ve oynanış kabulü açık.

## Modüller
- Görsel: `recovered/native-siege/native-ui-v22.js`
- Derleme: `recovered/native-siege/build_canonical_three_maps.mjs`
- Regresyon: `recovered/native-siege/test_native_ui_v22.mjs`
- Tarayıcı: `recovered/native-siege/browser_canonical_three_maps.mjs`
- Kanonik HTML: `index.html`, yalnız derleyiciden üretilir; el ile farklı oyun halinde oluşturulmaz.

## Kabul ölçütü
Üç harita gerçek Chromium/SwiftShader üzerinde açılacak; üç oyun ve F10/F6–F9 korunacak; 140 asker uzun kuşatma + replay başarılı olacak; 390px seçim okunabilir olacak; 28 özgün script korunacak. Resmî Windows fiziksel GPU/FPS testi bunun yerine geçmez.
