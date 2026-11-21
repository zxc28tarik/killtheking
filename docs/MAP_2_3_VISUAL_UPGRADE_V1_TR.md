# Harita 2 ve 3 — Görsel İyileştirme V1
Tarih: 21 Kasım 2026. Durum: uygulama başladı; gerçek tarayıcı kabul testi bekliyor.

## Sabit kurallar
- Üç mod tek oyun; mevcut Arena / G5.4 Ordu / Kale Kuşatması oynanışı ve menüsü korunur.
- 70v70, komuta sistemi, dört sınıf, denge, kapı/merdiven/koçbaşı/mancınık ve çarpışma değişmez.
- Main, tarihî kaynaklar ve eski sürümler korunur.

## Harita 2 — Meydan Savaşı
- [ ] Mevcut çimenlikte düşük poligonlu doğal renk varyasyonları ve uzak zemin katmanları (G5.4 büyük HTML kaynağının güvenli erişimi açık).
- [ ] Asker siluetleri ve savaş alanı okunurluğu için ışık/kontrast düzenlemesi.
- [ ] Mevcut rotalar ve görüş/atış hatları dışında küçük çevre detayları.
- [x] İzole G5.4 dört bölük taktik haritasında okunaklı, yakınlaştırmayla ölçeklenen koordinat ızgarası ve yön işareti (yalnız UI).
- [ ] Chromium ve 70v70 komuta/çarpışma regresyonu.

## Harita 3 — Kale Kuşatması
- [x] Çarpışmasız alçak poligon toprak ton kırılmaları; merkezi geçiş korundu.
- [x] Sur taş sıraları ve iç kale üst kenar detayları; yeni collider yok.
- [x] Kule mazgal dişleri ve kapıya ahşap/metal yüzey detayları; mevcut kapı dekoru ile birlikte saklanır.
- [x] Batı/doğu merdivenlerine işlevsel mesh'e bağlı ahşap yan raylar ve bağlantı kelepçeleri (sadece görsel, yeni collider yok).
- [x] Gerçek G5.4 mürettebatlı koçbaşına ahşap çapraz destekler, tekerlek göbekleri ve çatı çıtaları eklendi (yalnız mesh).
- [x] Gerçek G5.4 mürettebatlı mancınığa destekler, tekerlek göbekleri ve üst travers ayrıntıları eklendi (yalnız mesh).
- [ ] 140 asker ve mevcut üç modlu oyunun gerçek Chromium/GPU testleri.

## Kabul
İlk kod değişiklikleri Harita 3 kale dekorasyonu ve Harita 2 canlı taktik haritasının görsel katmanında. Harita 2'nin 3B çevresi henüz değiştirilmedi. Testler çalıştırılmadan PASS denmez. Ana dala birleştirme ve yayımlama için ayrıca kullanıcı kabulü gerekir.
## 21 Kasım — V3 ara doğrulama
- İki değişen JavaScript dosyası sözdizimi kontrolü PASS: `siege-preview.js`, `g54-field-four-squad-runtime.js`.
- Tam üç modlu çevrim dışı HTML yeniden derlenmedi; Chromium/GPU/regresyon testleri çalıştırılmadı. Oynanış PASS iddiası yok.
- Meydan 3B motoruna erişim sağlanmadan görsel geometri yazılmadı; taktik harita V1 güncellemesi kaydedildi.

## 21 Kasım — V4
- `siege-ram.js` ve `siege-catapult.js` gerçek AK-05 makinelerinin mountVisual fonksiyonlarında kozmetik detaylar eklendi. Yeni silah, makine veya oyun modu oluşturulmadı.
- Her iki JavaScript kaynak dosyasının sözdizimi `new Function` ile PASS; tarayıcı, GPU, 140 asker ve üç modlu HTML yeniden paketleme kabulü henüz gerçekleştirilmedi.
- Meydan Savaşı'nın özgün büyük G5.4 HTML gövdesi GitHub dosya içerik uç noktasından boş geldi; mevcut 3B sahnesine güvenli müdahale henüz gerçekleştirilemedi. Harita 2 görsel işlerinin geri kalanı açık.
