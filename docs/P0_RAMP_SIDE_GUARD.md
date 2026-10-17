# P0 harita kararlılığı — Rampa yan yüzeyi ve ani yükseklik atlaması

## Gerçekten yeniden üretilen hata
Sahnedeki rampalar yer yüzeyi olarak `getRampHeightAt(x,z)` ile modelleniyor. Rampa yan sınırındaki yükseklik, yandan giren bir oyuncu için 0 seviyesinden örneğin 3.5'e *aniden* değişebiliyordu. Bunu durduracak yan çarpışma kontrolü bulunmadığından ayak konumu bir karede yukarı taşınabiliyordu (özellikle hızlı slide-hop hareketinde).

## Düzeltme
- `ArenaPlayerCollision.limitRampEntry` hareket hattını oyuncunun ayak izi boyunca örnekleyerek sadece **ani ve büyük yukarı eğim süreksizliğini** engelliyor.
- Sürekli yükselen doğru rampa girişi korunuyor. Rampanın üzerinde zaten yüksek seviyede bulunan / üstünden düşen karakter aşağı ya da yana geçebiliyor.
- Yan duvarla temas ederken rampa boyunca kayma korunuyor.
- Mevcut surlar, kale çizimleri, dört rampanın mesafeleri, hız/hareket sınıfları, bot A* ve FFA korunuyor.
- Bir önceki PR #21'deki duvar içinden hızlı geçmeyi engelleyen sürekli swept AABB sistemi korunuyor.

## Test
- 6 sentetik rampa testi (yan giriş, doğru alt giriş, yüksek oyuncu, paralel hareket, kayma, düz arazi).
- Gerçek `buildCastleArena()` geometrisindeki 4 rampanın tamamında yan yüzeyden girip yukarı sıçrama girişimleri.
- Yerel kaynaklarla 130 test PASS; GitHub CI, HTML paketlemesi ve regresyon doğrulaması birleştirmeden önce gerekiyor.

## Kalan P0 kabul
Gerçek WebGL Chrome/Edge'de kısa güçlü duvar/rampa/slide-hop testi; özellikle dekoratif ancak solid olmayan objeler gözlemlenmeli. Bu onaydan sonra Maç Sistemi 1.0 ve diğer gerçek P1 işlere geçilecek.
