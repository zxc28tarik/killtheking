# Kill the King — AK31: Gerçek kuşatma iç avlusu ve sur savunması

25 Kasım 2026 • **Üçüncü harita: Kale Kuşatması** • Aynı tek FPS/G5.4 savaş motoru

## Amaç ve değişmeyen savaş kuralları

Kalenin içi görsel bir dekor değil; **askerleri hareket ettiren, saklayan, ateşi kesen ve iki tarafı alternatif yaklaşmaya zorlayan fiziksel bir savunma yapısı** olmalı.

- **70 kırmızı savunucu içeride, 70 mavi saldırgan dışarıda.** Ayrı savaş motoru veya birim/HP hilesi yok.
- **600 HP gerçek kapı, koçbaşı, mancınık, kuşatma kulesi** ve F6–F10 emirleri korunur.
- AK25'in **224×228,5 m kale ve 624×624 m savaş alanı** korunur; ayrı Arena/TDM ve Meydan geometrisine dokunulmaz.
- AK26'nın **19** mevcut fiziksel savunma kütlesi, AK27–28 gerçek asker komutları, AK29 görseli yerinde kalır.
- Işık, atmosfer/renk, çözünürlük, karakter görselliği ve animasyon sistemleri değiştirilmez.

## İç kale — oynanış planı

| Bölge | Gerçek savaş işlevi | Durum |
|---|---|---|
| Güney kapı / boğaz | 16m özgün kapı; koçbaşı ve kule yolları serbest, kapı gerisi merkez dogleg ile doğrudan baskın engelli | AK26 korunuyor |
| Yan iç sur ve dış avlu | Sol/sağ iki kanatta taş barikatlar; arasında gerçekten geçilebilen atış aralıkları, yan kuşatma manevrası | **AK31 fiziksel** |
| Kuzey iç geçit z≈42 | 16m gerçek açıklık; iki yanında iki korunaklı mevzi; hayali ikinci kapı yok | **AK31 fiziksel** |
| İkinci hat z≈62 | 24m merkez çekilme koridoru; iki taş savunma bloğu | AK26 korunuyor |
| Arka avlu z≈96–132 | 5m+ aralıklarla sur-dibi siperleri; çapraz ateş traversleri, merkez ve iki yandan ilerleme seçeneği | **AK31 fiziksel** |
| Son redüt z≈149–171 | Kademeli geri savunma setleri, açık ön girişli iki üç duvarlı nöbet odası, merkezden zorlanabilir çıkış | **AK31 fiziksel** |

### Açık geçit ve siper kuralı

Mazgalın dokuda koyu çizilmesi **ateş deliği sayılmaz**. AK31'de aralıklı gerçek collider parçaları vardır: taş bloğa mermi isabet eder; aradaki açıklıktan oyuncu veya mevcut G5.4 okçusu/tüfekçisi gerçekte vurabilir. Bu geometri hem gerçek FPS oyuncu swept collider'ına hem 140 G5.4 aktörün `setWorldObstacles` haritasına hem de `worldMeshes` üzerinden gelen FPS/ok görüş ve mermi çarpışmasına eklenir.

**34 yeni gerçek fiziksel kütle**, bunların 16'sı sur-dibi ateş istasyonu, 6'sı iki açık nöbet odasının duvarlarıdır. Kalanları kapı kanadı, kuzey geçidi, çapraz ateş ve geri çekilme traversidir. Yeni ışıklar ve kare başına çizim işleri yoktur. Önceden mevcut taş malzeme yeniden kullanılır; estetik kaplama ileride mevcut fizik/mesafe verilerine göre yapılabilir.

## Güzergâh kabulleri

Şu yollar yeni kütlelerle **kapatılmayacak**: koçbaşı x=0, kule x=28, mancınık x=-22; sağ/sol kapı sonrası x=±19; kuzey iç geçit x≈0 z≈50; gerçek arka çekilme x≈0 z≈62–171. Kırmızı yedek okçuların x≈8 z≈84 başlangıç bölgesi korunur. AK31 modülü yasak bölgeler için koridor kontrolleri uygular; canlı 6 G5.4 rota kabulü ve gerçek Chromium savaş testi ayrıca gereklidir.

## Teknik bağlantı

- `recovered/native-siege/native-siege-interior-v31.js`: salt kurulumda 34 gerçek geometri/collider, açık atış aralıkları ve koridor doğrulaması.
- `index.html`: aynı oyunda inline AK31; `nativeSiegeCastleGeometry(enabled)` ile yalnız kuşatma etkinken aktif, dünya meshes/colliders harita değişiminde çıkarılır.
- `playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html`: ana HTML ile aynı byte içeriği.
- `tests/siege-interior-v31.test.mjs`: 34 parça, gerçek collider/mesh eşliği, pasaj, açık port, mod ve HTML eşliği.
- `window.ktkSiegeInteriorStatus()`: kale aktif mi, 34 collider/16 mevzi/6 oda duvarı ve projectile-cover gerçekten dünya listesinde mi?

## Sıradaki, dürüstçe açık bırakılan mühendislik işleri

1. **Gerçek sur üstü yürüyüş yolları:** mevcut G5.4 aktörleri y=0 düzleminde rota hesaplıyor. Katmanlı yol grafiği, tutarlı eğimli çıkış, düşme ve karakter render yüksekliği doğrulanmadan üst sur mevzileri için "bot çıkıyor" denmeyecek. Oyuncu ve bot aynı fiziksel yükseklik/çarpışma kuralını kullanmalı.
2. **İki savunma yan merdiveni ve siper mazgalları:** açık kalan kapı/kule koridorlarını test ederek, yükseklik farkını gerçek oyuncu ve asker hareketiyle aşar hale getir.
3. **Savaş AI ve güç dengesi:** yeni mevzilerde gerçekten ateş fırsatı ve görünür hedef oluştuğunu, savunucuların kapı kırılınca oda oda gerilediğini canlı 140-asker koşusunda ölç. Şu anda AK31 yalnız fiziksel saha sunar; yeni yapay zekâ davranışı eklediğini iddia etmez.
4. **Gerçek FPS/Windows GPU denemesi:** otomatik test PASS olsa da görsel kalite, örtü/nişan, FPS düşüşü ve insan tarafından oynanabilirlik ayrı kabul gerektirir.

**Merge kararı:** PR'daki gerçek CI, Chromium/WebGL üç harita, G5.4 uzun kuşatma kontrolleri yapılmadan `main` dalına alınmamalı. Bunun dışında kullanıcı onayı olmadan sınıflar, silah dengeleri, oyun kuralları veya ışık/renkleri değiştirme.

## AK32 uygulaması — dört gerçek sur çıkışı (25 Kasım)

AK31'den sonraki büyük paket **ayrı bir HTML motoru veya kaplama hilesi değil**, mevcut üçüncü haritanın özgün FPS fizik sisteminde gerçek dört eğimli giriş oluşturur.

- Dış surların iç yüzünde **batı ön, doğu ön, batı arka, doğu arka** olmak üzere dört rampanın her biri 26 m ilerler ve gerçek oyuncuyu 0'dan 9 m sur üstüne çıkarır.
- Her rampada **1 gerçek eğimli taş platform + 2 ahşap yan kiriş** kullanılır (dört rampa toplam yalnız 12 çizim nesnesi). Gerçek eğim geometrisi ile oyuncunun sürekli interpolasyonlu yükselti fiziği aynı 9/26 oranını taşır. Basamak kutuları ve görünmez sıçrama yoktur.
- Her rampanın ucunda **surun üst yüzeyine fiziksel 9m kotunda bağlanan taş geçiş** vardır. Oyuncu mevcut FPS swept collision ve ramp side-entry engeline tabi olmaya devam eder. Duvarın içinden ışınlanma yoktur.
- Dış surun boyunca yükseltilmiş, **gerçek mermi çarpışmalı ve gerçek hareket engelli aralıklı mazgallar** vardır; düz boyanmış siyah çizgi/teatral mazgal yoktur.
- Mevcut dış surun üst yüzeyi y=9'dur; ilave dekoratif yer döşemesiyle tekrar üretilmez, ışık ve renk değiştirilmez.
- Kule, koçbaşı, mancınık, kapı, 70+70 özgün asker ve AK31 iç avlu bariyerlerinin kara seviyesi rotaları değişmez. Yeni üst köprü ve mazgal AABB'leri `minY>2.65` olur: G5.4 kara seviyesi bot engellerine ve yer düzlemi `nativeSiegeConstrainOriginalG54` kuralına sokulmaz.
- Kale modundan çıkıldığında hem yeni sur rampaları hem gerçek çarpışma/atış yüzeyleri ayrıştırılır. Arena ve Meydan'a sızan görünmez duvar olmamalıdır.

**Yeni dosyalar:** `recovered/native-siege/native-siege-wall-access-v32.js`, `tests/siege-wall-access-v32.test.mjs`. Oynanabilir kök `index.html` ile `playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html` byte-eşittir. Canlı sayfa durumu `window.ktkSiegeWallAccessStatus()` ile izlenir.

**Kesin sınır:** Bu paket **gerçek oyuncu sur yürüyüşü ve fiziksel atış örtüsü** sunar. **G5.4 botların sura çıkması, yükseltilmiş 3B atış göz hizası, siper mevzi tercih AI'sı ve güvenli geri iniş henüz uygulanmamıştır**; onaylı bir test olmadan uygulanmış gibi gösterilmeyecek. Bunlar AK33/AK34 içindir. Sadece bu paketle kalenin tüm üst hat savunmasının tamamlandığı söylenemez.

**Kabul:** `node --test tests/*.test.mjs`, canlı kaynak eşliği, üç haritalı Chromium/WebGL; özellikle rampanın sonundan gerçek y=9 sur üstüne geçişin manuel FPS testinde teyidi. Otomatik simülasyon yayılım ve bot AI davranışını tek başına kanıtlamaz.

## AK33 — G5.4 Gerçek Yer Seviyesi Savunma Kararları (25 Kasım)

**Sorun:** Orijinal G5.4 piyade ve yay/tüfek ışınları hedefi hâlâ `y=0` civarında hesaplıyor; yalnızca `u.siegeY` ve mesh matrisi yükseltmek sahte/yenilmez asker ya da havada ateş anlamına gelir. Yüksek sur AI'sı henüz uygulanmadı. Öncelik gerçek ve testlenebilir orijinal düşman birliği davranışı.

**Uygulandı:**
- Yeni `KTKSiegeGroundGarrisonV33` yalnız asli Kale Kuşatması modunda ve oyun başladığında etkin.
- **Mevcut kırmızı 10 tüfekçili G5.4 bölüğü**, düşmanın canlı x/z dağılımına göre batı/doğu kapı gerisi, kuzey iç geçit veya yedek atış mevzilerini seçer.
- Tüm mevzi geçişleri `ArenaArmyBattle.setDestination(state, id, x, z, true)` üzerinden gerçekleşir; orijinal gerçek çarpışma / `tacticalRoute` sonucu reddederse hiçbir konum veya can değiştirilmez.
- Yalnız kendi bölüğünü yönlendirir. Kırmızı mızraklı, kılıçlı ve okçu için AK27–28 mevcut rota/rezerve sistemi; mavi oyuncu F6–F10 emirleri aynen korunur.
- **AK27 acil kapı savunması önceliklidir:** Kırmızı tüfekçiler için özgün `hold` aktive olursa AK33 yeni geçiş emri vermez.
- Saniyede emir yağmuru yok: tehdit 2,8 saniyelik düşünme aralığında gözlemlenir; kabul edilmiş yeni emirler arasında en az 11 saniye vardır.
- Yeni isabet, hasar, reload veya hayali tüfek sesi kodu eklenmedi; gerçek G5.4 savaş ve mermi sistemleri ateşi hesaplamaya devam eder.
- `window.ktkSiegeGroundGarrisonStatus()` ile kurulan gerçek mevzi, verilen/reddedilen özgün emirler, grup canlı konumu ve öncelik raporlanır.

**Kapsam sınırı:** AK33, surların **içinde ve dibinde** gerçek savunma kararları üretir; 9m yüksekliğe çıkan botları veya okçu/tüfekçilerin sur tepesinden atışını tamamlamaz. Bu teknik sınırın giderilmesi için gerçek 3B gövde, G5.4 ok fizik ve birinci temas ışını, gerçek nav yükseltisi ve asker görsel matrisleri **birlikte** değiştirilip regresyonu sağlanmalıdır. Böyle yapmadan askerleri yüksek sura koyma.

**Kalite kapıları:** Yeni `tests/siege-ground-garrison-v33.test.mjs` özgün 140 asker, geçerli/geçersiz rota, komuta önceliği, hiçbir konum/HP mutasyonu ve kale-özel entegrasyonu denetler; `.github/workflows/ui32_menu_acceptance.yml` canlı Kale Kuşatması başlangıcında özgün 140 kişilik durumu doğrular. PR #86 taslak kalır, manuel Windows GPU ve yüksek sur robotları sonraki fazdır.
