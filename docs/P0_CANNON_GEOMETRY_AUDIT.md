# P0 kale kararlılığı — Top arabaları, kule/kapı görsel çarpışma denetimi

## Kaynak denetiminde tespit edilen hata
Kale haritasının `buildCastleArena()` fonksiyonunda üç adet `createSiegeCannon(...)` bulunuyor. Fonksiyon, 4 tekerlek + top arabası + namludan oluşan 3B bir nesne çiziyordu ancak **hiçbir `colliders` girişi oluşturmuyor**, mesh'lerini de `worldMeshes` listesine koymuyordu. Sonuç: karakter topun içinden geçebiliyor, silah raycast'i de top modelini fiziksel engel kabul etmiyordu.

## Düzeltme
- Her top için mevcut 3B modelinin boyutlarını kapsayan, `rotY` ile dönmeyi hesaba katan statik XZ çarpışma ayak izi eklendi. Yaklaşık x ±0.95, z ±1.65, yükseklik y+0.04..y+1.50; varsayılan üç top rotasyonu 0.
- Mevcut top modellerinin bütün 6 parçalık mesh'leri `worldMeshes` içerisine eklendi. **Yeni veya değiştirilmiş grafik, gölge, karakter ve silah modeli yok.**
- Oyuncunun önceki swept çarpışması ve botların mevcut `ArenaNavigation` grafiği aynı top kutularını kullanıyor; normal hareket ve darbe/geri tepme güvenliği korunuyor.
- Kaynak taramasında bulunan **sancak, altın süs, ağaç yaprakları, çimen, zemindeki plakalar** gibi dekorlar kasıtlı olarak katı değil. Merkezi kapı önündeki demir parmaklık dekorunun arkasında zaten geniş **katı kale gövdesi** bulunuyor; yalnızca süs çarpışması ekleyerek geçilebilir bir kapı varmış gibi göstermiyoruz.
- Çatı konileri yüksekte ve özgün oyun yolu dışında; yaklaşık kutu çarpışması ekleyip oyuncunun kulelerde yanlış engelle karşılaşmasına neden olmamak için bu aşamada değiştirilmedi.

## Test kapıları
- 3 top için gerçek Three.js 3B model sınırlayıcı kutuları ile fiziksel collider sınırları eşleşiyor.
- Dünya raycast listesinde 3 topun 6'şar parçası mevcut; topun gövdesine gönderilen ray tarafından ilk engel olarak görülüyor.
- Oyuncu sur üzerindeki dar yürüyüş yolunda top arabasının içinden geçemiyor; bot navigasyonu aynı top alanlarını kapalı görüyor.
- **Gerçek kalede 90/90 rota** toplar fiziksel engele dönüştükten sonra da erişilebilir olmalı.
- Dekorların gereksiz çarpışma engeline dönüştürülmediği sınanıyor.

## P0 kabulünden önce
Chrome/Edge'de gerçek GPU WebGL ile toplara koşma/kayma, dar sur yolu, dört rampa, kule köşeleri, 6 botun kule/sur çevresindeki çarpışmaları doğrulanmalı. Gerekirse devamında diğer dekoratif nesneler için kullanıcı oynanışına göre kontrollü collider revizyonu yapılmalı. **Maç sistemi P1 henüz başlamıyor.**
