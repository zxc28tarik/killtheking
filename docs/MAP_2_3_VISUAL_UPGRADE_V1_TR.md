# Harita 2 ve 3 — Görsel İyileştirme V1
Tarih: 21 Kasım 2026. Durum: uygulama başladı; gerçek tarayıcı kabul testi bekliyor.

## Sabit kurallar
- Üç mod tek oyun; mevcut Arena / G5.4 Ordu / Kale Kuşatması oynanışı ve menüsü korunur.
- 70v70, komuta sistemi, dört sınıf, denge, kapı/merdiven/koçbaşı/mancınık ve çarpışma değişmez.
- Main, tarihî kaynaklar ve eski sürümler korunur.

## Harita 2 — Meydan Savaşı
- [ ] Mevcut çimenlikte düşük poligonlu doğal renk varyasyonları ve uzak zemin katmanları.
- [ ] Asker siluetleri ve savaş alanı okunurluğu için ışık/kontrast düzenlemesi.
- [ ] Mevcut rotalar ve görüş/atış hatları dışında küçük çevre detayları.
- [ ] G5.4 ordu HTML'sinin kaynak bütünlüğü korunarak izole görsel adaptör ve doğrulama.
- [ ] Chromium ve 70v70 komuta/çarpışma regresyonu.

## Harita 3 — Kale Kuşatması
- [x] Çarpışmasız alçak poligon toprak ton kırılmaları; merkezi geçiş korundu.
- [x] Sur taş sıraları ve iç kale üst kenar detayları; yeni collider yok.
- [ ] Kapı, kule, merdiven, koçbaşı, mancınık materyal ve siluet iyileştirmeleri.
- [ ] 140 asker ve mevcut üç modlu oyunun gerçek Chromium/GPU testleri.

## Kabul
İlk kod değişikliği sadece Harita 3 görsel katmanında. Harita 2 henüz kodda değiştirilmedi. Testler çalıştırılmadan PASS denmez. Ana dala birleştirme ve yayımlama için ayrıca kullanıcı kabulü gerekir.