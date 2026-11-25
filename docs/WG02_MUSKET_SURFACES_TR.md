# WG02 — Tüfek yüzeyleri / saten metal ve ceviz

- 64×64 ortak metal dokusunda yükseklik (R) ve pürüzlülük (G) ayrıldı; periyodik damar ve düşük kabartma ile gürültü azaltıldı.
- Demir ve pirinç için ayrı saten PBR değerleri; mevcut çevre yansıması kullanılır.
- 128×128 deterministik uzunlamasına ceviz dokusu; FPS ve TPS/ordu dipçiği aynı malzemeyi kullanır, eski ortak ahşap değişmez.
- Yeni geometri, ışık, gölge, kare başına hesaplama veya bot davranışı değişikliği yok. Tek ek RGBA8 doku (mipmap dahil yaklaşık 85 KiB), bir ortak malzeme; FPS ölçümü yapılmadı.
- Statik kontrol: dört dipçik/ahşap ataması ve tek malzeme tanımı doğrulandı. İki HTML aynı blob. Tarayıcı görsel kabulü ve FPS ölçümü bekleniyor.
