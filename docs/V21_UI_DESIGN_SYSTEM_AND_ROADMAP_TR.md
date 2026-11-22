# KILL THE KING — KALICI ARAYÜZ TASARIM KARARLARI / V21 UI

Karar tarihi: 22 Kasım 2026. Kullanıcı tarafından istenen kapsamlı panel/HUD iyileştirme planının kalıcı proje kaydı.

## Onaylı tasarım sistemi (ilerleyen oturumlarda da geçerli)

- Tüm üç oyun seçeneği (Arena, 70v70 Meydan, 70v70 Kale Kuşatması) **AYNI özgün FPS motorunun** arayüzü. Hiçbir zaman bağımsız HTML/iframe/ayrı runtime ile değiştirilmez.
- **Tarihî savaş/komuta estetiği**: mat koyu mürekkep-mavi / taş-siyah yüzeyler, eskitilmiş pirinç/bronza yakın ince çerçeveler, kemik beyazı metin, çok ölçülü deri/taş dokusu izlenimi.
- Durum renkleri: dost/başarılı yeşil, tehlike/düşman kırmızı, seçili komut altın/amber, pasif bilgi mavi-gri. **Uygulamada yalnız dekoratif durum gösterimi; hiçbir yeni stat uydurulmaz.**
- Mevcut oyun kontrolleri ve oyuncu hareket/AI/140 asker, komut, hasar, raycast, F6–F10 kısayol sözleşmeleri **birebir korunacak**. Oyun döngüsüne veya güç dengesine dokunulmayacak.
- Görsel kalite öncelikli. FPS ve performans optimizasyonları **geliştirmenin SON aşamasında**, yalnız ağır çökme/kitlenme anında zorunlu düzeltme yapılır.
- HUD/paneller alana hakim olmamalı. Sağlık, silah/cephane ve seçili komut okunur; gereksiz dikkat dağıtan sahte sohbet/kalabalık tekil savaş modlarında bastırılır.
- Butonlar için tek tip normal/hover/selected/disabled/focus-visible; klavye ve küçük ekranlar için duyarlı tasarım. Renk tek bilgi sinyali değildir, metin de korunur.
- Stil tümüyle sunum katmanı; eski 28 özgün JS etiketi içerik olarak **bayt eşitliğiyle korunur**. Son kanonik 29. script'e yalnız dekoratif modül eklenir.
- Yayıncı pitch-deck hazırlanmayacak, kullanıcı söyleyince başlanacak.

## Uygulama sırası / tik listesi

### V21-UI-A — ortak tasarım sistemi
- [x] Tasarım ilkeleri GitHub'da kalıcı kaydedildi.
- [ ] Ana CSS tokenleri: renk, kenar, radius, gölge, tipografi/spacing ölçeği.
- [ ] Yeniden kullanılabilir buton stilleri ve durumları.
- [ ] Tarihî-war stili menü başlığı ve arayüz kimliği, orijinal tıklama/id'ler korunur.
- [ ] 1000×680 ve 390×844 ekran boyutlarında taşma/okunurluk.

### V21-UI-B — gerçek oyun içi HUD
- [ ] Üst radar/süre/durum HUD'ları aynı stil ailesine alınır.
- [ ] Sağlık/cephane/roller net ve kontrastlı; çapraz nişangah aynı mekanikle.
- [ ] Meydan G5.4 komut paneli, F10 genişle/daralt ve formasyon/ateş düğmeleri.
- [ ] Kale gerçek kuşatma F6 kule, F7 koçbaşı, F8 mancınık, F9 taarruz emirleri, aktif/pasif görselleştirme.
- [ ] Taktik harita, canlı skor, maç sonuçlarının aynı panel sistemi.

### V21-UI-C — menü ve sonuç
- [ ] Gerçek üç harita/oyun modu seçimi, sınıf kartları ve başlangıç eylemi.
- [ ] Sonuç ekranı ve ana menüye/tekrar oyna butonları.
- [ ] Kontrol ve yardım bilgisi düzgün hiyerarşi, kullanıcıyı sahte statlarla yanıltmama.

### V21-UI-D — son görsel rötuş
- [ ] İkon, klavye focus görselliği, ince motion/fade ve prefers-reduced-motion.
- [ ] Farklı çözünürlüklerde ekran üstüne taşma ve kontrol çakışmalarını giderme.
- [ ] Resmi GitHub kaynak/Node doğrulaması; gerçek Chromium/SwiftShader üç harita kabulü; 140 asker uzun kuşatma tekrarı.
- [ ] Kullanıcının fiziksel Windows GPU estetik kabulü, henüz yapılmadı.

## Kabul kanıtları
- Uygulama dosyası: `recovered/native-siege/native-ui-v21.js`.
- Kanonik derleyici: `recovered/native-siege/build_canonical_three_maps.mjs`.
- Statik regresyon: `recovered/native-siege/test_native_ui_v21.mjs`.
- Gerçek tarayıcı: `recovered/native-siege/browser_canonical_three_maps.mjs`.
- Akış: `recovered/native-siege/browser_siege_long_session.mjs`.
- Test sonucu olmadan PASS/merge iddiası yok. Alt aşamalar ilerledikçe bu kayıt güncellenecek.

## Görsel harita dalı notu
`codex/visual-meadow-siege-pass1` dalında ana sürüme taşınması gereken zengin orman/kuşatma çevresi çalışmaları mevcuttur (Meydan: 460 ağaç, 18 koruluk, 780 orman zemini detayı; Kale: 80 ağaç, 44 dış tepe). Önceki V21 scenery **yalnız yerel aday HTML** üzerinde geliştirildi; otomatik `main` parçası değildir. UI çalışmalarında bu geliştirmelerin kaybolmamasına dikkat edilecek. Ayrı motorlu/iframe eski sürüm doğrudan ana oyunun yerine konulmayacak.
