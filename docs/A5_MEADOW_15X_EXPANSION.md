# A5 / Harita 2 — zemin 15 kat büyütüldü

- Önceki alan: 20 × orijinal 98×98 ölçüsü; yaklaşık 438×438 birim.
- Yeni alan: öncekinin 15 katı (**toplam 300 × orijinal**); kenarlar yaklaşık **1697.41×1697.41** birim (kenar 3.873 kat).
- 4 kenar çiti, ağaç ve siperler yeni `sqrt(300)` katsayısıyla yerleştirildi; görsel nesnelerin fiziksel enleri büyütülmedi.
- 16 güvenli doğuş noktası merkezde korunur: maçın 2/4/8 dakikalık FFA/TDM akışı boşa dağılmaz.
- A* step boyuta orantılı ölçeklenir; harita grid'i yaklaşık 5000 hücre altında kalır; çarpışma ve raycast aktif haritaya özeldir.
- Uzak çizim mesafesi 2400, gökyüzü ölçeği 8, sis yoğunluğu çarpanı .12 olarak ayarlanır; kale değerleri değişmez.
- Zemin dokusunun tekrarı sqrt(15) ölçeğinde artırılır (çim liflerinin ölçüsü değişmez).
- Uzak alanda 32.000 / 14.000 görsel çim, oyuncu yakınında ilave 12.000 / 4.500 deterministik dünyaya sabitlenmiş çim tek bir instanced mesh olarak görünür. Yakın bölge yalnızca oyuncu 20 birimlik hücre değiştirdiğinde yenilenir. Hiçbiri katı engel değildir.
- Testler: harita alanı / sınır / 240 spawn yolu / dokular / yakındaki çimin dünyaya sabitlenmesi / harita geçişleri.
- Gerçek Chrome/Edge GPU görsel kabulü ayrıca yapılmalıdır.
