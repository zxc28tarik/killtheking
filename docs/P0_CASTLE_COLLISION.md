# P0 — Kale / sur / duvar içinden geçme kararlılığı (swept player collision)

## Tespit edilen kök neden
Önceki `resolvePlayerCollisions(dt)`, oyuncunun X ve Z koordinatlarını doğrudan `vel * dt` kadar ilerletip **yalnızca son konumdaki** AABB örtüşmesini kontrol ediyordu. Hızlı slide-hop, zıplama veya patlama/hücum itişinde ince duvarın bir ucundan diğer ucuna tek karede geçmek mümkündü. Çapraz hareket özellikle duvar köşelerinde kararsızdı.

## Düzeltilen
- Bağımsız, Three.js gerektirmeyen `src/player-collision.js` saf çarpışma modülü.
- Oyuncunun yatay çarpışma ayak izi, duvar kutularının oyuncu yarıçapıyla genişletildiği **sürekli iki boyutlu segment–AABB kesişimi** üzerinden sınanıyor; hızla duvarın içinden geçmek mümkün değil.
- İlk temas zamanı seçiliyor; kalan hareket duvarın **teğet doğrultusunda** kaydırılıyor, sonraki duvar için tekrar kontrol ediliyor. Duvara doğru hız bileşeni sıfırlanıyor; kayma/slide-hop için paralel hareket korunuyor.
- Önceki yanlış koordinatlardan bir duvarın içinde başlama durumunda oyuncu kontrollü biçimde en yakın boş tarafa çıkarılıyor.
- Mevcut oyuncu boyu/çömelmesi, zıplama, düşme, rampalar, kale platformlarının üstünde yürüyüş, 4 silah sınıfı, bot A* navigasyonu ve tüm grafikler korunuyor.
- Bu adım **oyuncunun yatay çarpışması** içindir. Dekoratif, katı olmayan sahne geometrilerinin yan duvar/rampla örtüşmesi ayrıca gerçek görsel QA gerektirir.

## Kanıt
- Sentetik regresyonlar: ince duvarın yüksek hızla geçilememesi, negatif yön, çapraz kale köşesi, duvar boyunca kayma, serbest hareket, düşük engel üzerinden zıplama, yüksek duvarda çarpışma, sur üstünde takılmadan yürüme, engel içindeki geçersiz başlangıcı düzeltme, yanlış koordinatların reddi.
- Haritanın **gerçek `buildCastleArena()` çarpışma kutuları** kullanılarak 200 deterministik yüksek hızlı kare testinde oyuncunun son konumunun katı engel içinde olmaması doğrulandı. Bu test son konum güvenliğini ölçer; oyun görüntüsünün tamamı değildir.
- Bütün kod değişiklikleri CI testinden ve depo kaynaklarından otomatik tek HTML üretiminden geçmeden `main` dalına alınmaz.

## Harita kararlılığı kapanış koşulları
1. Kullanıcının GPU destekli Chrome/Edge'inde **en az 10 dakika** slide-hop, duvar/köşe, sur, rampa ve dar geçit testleri.
2. Kule, mazgal, duvar dekorları ile oyun içi çarpışma geometrisinin eşleşmesi kontrolü.
3. Çıkarsa rampanın yanından üst yüzeye ani yükseklik atlaması veya koridor kenarında saplanma ayrıca düzeltilecek.
4. Bu P0 kabulü sonrası **Maç Sistemi 1.0** gibi gerçek P1 işlere geçilecek; oynanış grafik tarzı değiştirilmeyecek.
