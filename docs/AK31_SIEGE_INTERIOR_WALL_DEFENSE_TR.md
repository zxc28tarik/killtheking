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
