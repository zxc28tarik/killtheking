# Kill the King — AK28 | Gerçek Kuşatma Güzergâhları ve Artçı Savunma

**Tarih:** 23 Kasım 2026  
**Kapsam:** Yalnız **Kale Kuşatması**, oyunun özgün üçüncü haritası.

## Amaç
AK25'in büyütülmüş 4,23× kale ve 8,04× alanı, AK26'nın 19 gerçek taş savunma engeli ve AK27'nin 140 gerçek G5.4 askerinin savunma AI'si korunarak kapı yıkılınca **gerçek insan ve botlar için kullanılabilir geçitler** ile gecikmiş savunucu birliklerine sınırlandırılmış yol kurtarma eklenir.

## A — Gerçek geçiş kabulü
Kale savaşı başladıktan ve orijinal `ArenaArmyBattle.setWorldObstacles` AK25/26 gerçek dünya engellerini aldığı anda, aşağıdaki **6 adet tamamen gerçek G5.4 `planSquadRoute`** sorgusu yapılır. Geçit testi dekoratif boşluk tahminine değil, oyunun gerçek rota grafiğine bakar.

| Rol | Başlangıç | Hedef | İşlev |
|---|---|---|---|
| Kızıl mızraklı | (-8,14) | (-18,10) | Kapı gerisi savunma |
| Kızıl kılıçlı | (24,4) | (24,10) | Sağ iç avlu sandıklarına takılmayan gerçek kapı savunması |
| Kızıl mızraklı | (-18,10) | (-5,50) | Gerçek 16m kuzey iç geçit |
| Kızıl kılıçlı | (24,10) | (5,50) | Aynı geçidin diğer kanadı |
| Kızıl mızraklı | (-5,50) | (-7,76) | İkinci savunma taş hattı |
| Kızıl kılıçlı | (5,50) | (7,76) | İkinci savunma taş hattı |

**Sınır:** G5.4 rotası olmadığı halde geçidi açık saymak veya askerleri duvarın öbür tarafına ışınlamak yasaktır.

## B — Gerçek fiziksel hareketin izlenmesi
- [x] Yalnız G5.4 AI'si `position` emrine verilmiş gerçek kızıl mızrak/kılıçlı kaptanlar izlenir. Mavi kullanıcı/oyuncu emirleri hiçbir zaman değiştirilmez.
- [x] **Her 2,6 oyun saniyesinde** mesafe ve safha değişimi ölçülür, her döngüde yeni emir basılmaz.
- [x] 13,5 oyun saniyesi boyunca **en az 1,35m gerçek ilerleme yoksa** orijinal `setDestination` ile alternatif geçerli hedef denenir.
- [x] **Her savunma safhasında en fazla iki yeniden rota emri**; ilerleme ve yeni duraksama bu hakkı sıfırlamaz.
- [x] Hedefe gerçekten 5,5m kadar yaklaşınca varış kayda geçer; keyfi `reached=true` kullanılmaz.
- [x] İki rota da reddedilirse yalnız ilgili kızıl kaptan `playerControlled=false` ile özgün G5.4 özerk AI'ye geri bırakılır. Birimler yer değiştirmez; HP/hasar/munisyon etkilenmez.
- [x] Maçın tekrar başlatılmasıyla denetçi ve önceki emir/retry sayıları sıfırlanır; ayrı savaş motoru eklenmez.

## C — Kalite güvencesi
- [x] `recovered/native-siege/native-siege-route-watch-v28.js`: özgün altı güzergâh ve gerçek ilerleme kontrollü iki sınırlı retry.
- [x] `recovered/native-siege/siege-route-patch-v28.mjs`: sadece özgün 29. oyun betiğine güvenli ekleme; ilk 28 script bayt-eşit.
- [x] `recovered/native-siege/test_native_siege_route_watch_v28.mjs`: 140 oyuncu/doğma/HP koruması, erken emir yasağı, en fazla iki retry, reddedilen rotada özgün AI'ye geçiş.
- [x] Üç haritalı gerçek Chromium testine altı G5.4 rotasının canlı yol engellerinde doğrulanması eklendi.
- [x] 140 askerli hızlandırılmış 120 oyun saniyesi kuşatma ve replay'e rota/aktor/doğma, yeniden başlatmada retry=0 kontrolü eklendi.
- [ ] Son PR dal commit'inde genel oyun, üç harita gerçek Chromium/WebGL ve uzun kuşatma/replay testleri PASS.
- [ ] `main` birleştirmesinden sonra aynı üç test PASS.
- [ ] Windows fiziksel GPU üzerinde gerçek oyun estetiği, kapı kırılmasından ikinci savunmaya geçiş ve insan gözüyle savaş dengesi kabulü.

### Özellikle değişmeyenler
- Arena ve Meydan haritaları, üç haritanın tek `index.html` dosyası.
- 70 orijinal kızıl savunucu içeride, 70 orijinal mavi saldırgan ve oyuncu dışarıda.
- Orijinal 600HP kapı, koçbaşı/mancınık/kule; AK26'nın 19 fiziksel sur ve savunma hattı.
- Mermi hasarı, sınıf dengesi, bot bireysel saldırı, kuşatma kazanma koşulu, F6–F10.
- FPS performans optimizasyonu ve yayıncı pitch deck kullanıcı ayrıca söyleyene dek açılmıyor.

**Gözlem:** Gerçek Chromium otomatik testleri başarıyla geçse bile bütün insan kuşatma senaryolarında mükemmel savunma dengesini kanıtlamaz. Ama artık en azından orijinal G5.4 yol planlayıcısından kapı, geçit ve ikinci hat için somut rota kanıtı alınır.

## Gerçek Chromium G5.4 hata keşfi ve AK28 onarımı

- İlk oynanış kabulü, AK27'den devralınan altı yürünebilir koridorun **yalnız dördünü** doğruladı: `frontPike=true`, `frontSword=false`, `posternPike=true`, `posternSword=false`, `rearPike=true`, `rearSword=true`. Kaynak: GitHub Actions `45088703411`, gerçek Chromium/SwiftShader ve özgün fizik colliderları.
- Neden: Kale içindeki özgün sandıkların sağ kanat güvenlik payı nedeniyle `(18,10)` hedefi gerçek G5.4 `planSquadRoute` tarafından reddediliyor. İlk AK27 statik/sahte veriye dayalı testler bu köşeyi kaçırmıştı.
- AK28 değişikliği: Mevcut G5.4 kızıl kılıçlı kaptanın **kapı gerisi mevzisi** `(18,10)` yerine açık sağ kanattaki `(24,10)` olarak ayarlandı. Kızıl gerçek asker sayısı, saldırgan yolu, orijinal sandıklar ve 19 AK26 savunma engeli **değiştirilmedi**. Hem `frontSword`, hem `posternSword` canlı rota testlerine bu gerçek komuta noktası işlendi.
- [ ] Yeni `(24,10)` noktasıyla altı rotanın gerçek Chromium'da tamamının PASS olması; onay verilmeden tamamlandı denmez.
