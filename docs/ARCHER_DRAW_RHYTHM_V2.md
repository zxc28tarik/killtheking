# Okçu Germe ve Atış Ritmi V2 — 18 Ekim 2026

**Durum:** Kod + Node testleri başarılı; gerçek Chrome/Edge WebGL oynanış testi bu değişiklik özelinde henüz yapılmadı. Eski grafikler, kale, dört sınıf, 6 bot FFA, isteğe bağlı TDM, tüm hasar değerleri ve tüfeğin 15 saniyelik aralığı değişmedi.

## İstenen oynanış
- **Ok bırakıldıktan sonra yalnız 1 saniye toparlanma**. Bu sürede yeni yayı germe girişimi başlamaz.
- Oyuncu sol tuşa basılı tutunca germe başlayabilir. **İlk 2 saniye ateş edilemez**; erken bırakma yalnız yayı iptal eder, ok/hasar/shot timestamp üretilmez.
- **3 saniyelik germe = %100 güç (gövde 35)**. 2 saniyelik germe yaklaşık %67 güç üretir; mevcut güç→hasar eğrisi aynen korunur.
- Kullanıcının önceki **15 ok/dakika üst sınırı** (aynı silahtan iki atış arasında minimum 4 oyun saniyesi) korunur, fakat bu sürenin **3 saniyeye kadarlık kısmı germe esnasında geçer**, sonradan ilave 4 saniye beklenmez.
- *Zaman örneği*: Ok atışı t=10.0 → t=11.0 tekrar germe mümkün → t=13.0'te minimum 2 saniyelik germe tamamlanır ama dakikalık sınırdan **1 saniye kalmışsa** gösterge `ATIŞA 1.0s` yazar → t=14.0'te tam güçle bırakabilir. t=13.0'te bırakırsa atış iptal olur. Bu açık bir tercih: hem 1 saniyelik boş toparlanma hem 15/dk üst sınırı korunur.
- İlk maçta veya okçuya henüz o maç hiç atış yapmamışken 2 saniyelik germe sonrasında, istenirse daha düşük güçlü ilk ok atılabilir. Tüm zamanlar oyun saati üzerinden ilerler; ESC/sekme bulanıklığı gibi duraklamalarda germe temizlenir.
- Bot okçular da aynı ritimle **1 saniye toparlanır + 3 saniye atış hazırlığı** yapar. Keskin hedef değişimi, görüş kaybı, ölüm ve birinci sınıf atış sınırı kontrolleri korunur.

## Test ve kabul
- `tests/archer-draw-cadence-v2.test.mjs` gerçek `releaseChargedBow` fonksiyonunu izole VM'de çalıştırır: erken bırakmada ok yok, 2 saniyede ilk ok, 1 saniye toparlanma, 4 saniye üst hız kuralı, sınıf değiştirme/pause temizliği ve bot animasyonuna hazırlık.
- Tüm otomatik testler 282/282 PASS; offline HTML/inline JavaScript doğrulaması başarılı.
- Gereken kullanıcı doğrulaması: ilk 2 saniye bırakma; 2–3 saniye ve 3 saniye germe; 1 saniye sonra yeniden germe; dördüncü saniyeye kadar beklerken gösterge; FFA/TDM bot okçular ve ESC/tekrar oyna. Kalan görsel/germe hissi buna göre ayarlanabilir.

Bu sürüm önceki bot zekâsını, dost ateşini, hasar bölgelerini veya oyuncu hareketini değiştirmez.
