# Kill the King — VIS-20 Kale Kuşatması Görsel Kalite Paketi

**Tarih:** 22 Kasım 2026  
**Çalışma türü:** Orijinal tek FPS, üç harita, 140 gerçek G5.4 savaşçısı; yalnız 3B materyal, dekorasyon ve kuşatma araçlarının görsel yüzeyleri.

## Kesin öncelik ve sınırlar

Kullanıcı kararı: **FPS artırma, çizim çağrısı azaltma ve performans optimizasyonu en son aşamada.** Görsel kaliteyi performans için düşürme. Ancak kilitlenme/çökme ve oynanış bozulması çıkarsa hemen düzelt.

Bu aşama orijinal Arena/Meydan/Kale Kuşatması haritalarını tek HTML'de tutar. Krunker/G5.4 özgün 28 JS scripti birebir değişmeden kalır. Kuşatma ayrı bir oyun, iframe veya dördüncü mod değildir. Oyun denge değerleri (600 HP kale kapısı, 340 HP koçbaşı, 280 HP mancınık, orijinal AI 140 asker/8 bölük), oyuncu hareketi, kapı ve kuşatma ekipmanı yönlendirmesi ve gerçek zafer/yeniden başlatma akışı değiştirilmez.

## V20-A — Kale taş duvar ve kapı evi

- [x] Orijinal iki gerçek güney sur mesh'inin **kendi taş malzemesinde** rastgele fakat deterministik desenli, şaşırtmalı taş sırası, aşınmış derz ve ufak ton farkları; 512² canvas albedo/bump.
- [x] Mevcut malzemeler silinmedi. Gerçek sur material.map ve bumpMap bağlandı; G5.4 fizik ve collider aynı.
- [x] Güney suruna zemin ön yüzünde alçak kabartma taş düşey ayırıcıları, kapı söveleri, üst kiriş ve üst bitirme şeritleri.
- [x] 600 HP'lik **gerçek** kale kapısının üstüne baştan ayrı sahte kapı çizilmedi: mevcut kapı mesh'i üzerine ahşap grain ve menteşe, tokmak, perçinler eklendi. Kapı gerçekte kırılıp görünmez olduğunda çocuk nesneler de kaybolur.
- [x] Mevcut V19 taş derzleri korunur.

## V20-B — Orijinal kuşatma makineleri

- [x] Canlı ve fiziksel 340 HP koçbaşının özgün büyük, düz metal çatısının üstüne ahşap kiremit sırası, enlemesine metal sırt kirişleri, yan destekler ve tekerlek göbekleri.
- [x] Canlı 280 HP mancınığın şasisinde çapraz ahşap destek, demir sabitleme ve tekerlek detayları; deri taş kesesi **gerçek dönen mancınık koluna çocuk mesh** olarak bağlandı. Orijinal fırlatma/hasar hesaplaması hiç değişmedi.
- [x] Mevcut orijinal 8 metre çıkılabilir kuşatma kulesinin yalnız x ekseni yan panellerinde kaplama tahtaları, ahşap çapraz kirişler, bayrak ve metal sırt detayı eklendi. **Merkez çıkış rampası ve açılan gerçek köprü açık**; yeni yürüme engeli yaratılmadı.
- [x] Görsel parça bazında mevcut koçbaşı/mancınık/kule grubuna bağlama: vurulunca çöken gerçek araçla birlikte yıkılır, ayrı bir yapay zeka veya makine oluşmaz.

## V20-C — Kuşatma yaklaşma zemini

- [x] Gerçek 102×100 metre orijinal kuşatma arazi mesh'inin kendi malzemesinde 768² doğal toprak/çim renk ve bump geçişleri.
- [x] İki koçbaşı ve iki mancınık teker izi; zeminin üzerinde görsel yarı saydam izler, **hiçbir collider, yükselti, yol engeli veya ray hedefi yok.**
- [x] Meydan'ın mevcut 14.700 çim, 180 uzak ağaç ve Arena'nın 6 kişilik özgün FFA haritası olduğu gibi kalır.

## Kabul kapıları

- [x] `test_native_siege_visual_v20.mjs` — gerçek nesne referansları, 5 desenli orijinal malzeme, kinematik çocuk modeller, yenilemede tek install, 28 eski script birebir.
- [x] `browser_canonical_three_maps.mjs` — normal Arena, Meydan ve Kale Kuşatması gerçek Chrome/WebGL screenshot + V20 model/material sayım kontrolü.
- [x] `browser_siege_long_session.mjs` — gerçekte 140 asker, oyun zamanında 120 saniyeye kadar orijinal updateGame, kapı kırılması, kapının görselleri, gerçek zafer ve yeniden maçtaki görsel temizliği.
- [ ] Tam üç harita GitHub Actions sonuçları, ekran görüntüsü inceleme ve `main` kabulü bu PR'ın testlerine göre işlenecek.
- [ ] Windows fiziksel GPU ve 4–8 dakika canlı insan kabulü (performans ölçümü bu **geliştirme aşamasının işi değil**).
- [ ] İleriki aşama: üzerinde gerçekten yürünebilir Meydan tepeleri, bot Y/mermi/ok/nav birleşik fiziği. Sırf görsel yamaç koyup ayaklar havada sorununu yaratma.

## Kaynaklar

- `recovered/native-siege/native-siege-visual-v20.js`
- `recovered/native-siege/build_canonical_three_maps.mjs`
- `recovered/native-siege/test_native_siege_visual_v20.mjs`
- `recovered/native-siege/browser_canonical_three_maps.mjs`
- `recovered/native-siege/browser_siege_long_session.mjs`

**Not:** Bu bir performans optimizasyonu değildir. Texture ve materyal maliyeti FPS açısından şimdilik düşürülmüyor.
