# Harita 2 ve 3 — Görsel İyileştirme V1
Tarih: 21 Kasım 2026. Durum: uygulama başladı; gerçek tarayıcı kabul testi bekliyor.

## Sabit kurallar
- Üç mod tek oyun; mevcut Arena / G5.4 Ordu / Kale Kuşatması oynanışı ve menüsü korunur.
- 70v70, komuta sistemi, dört sınıf, denge, kapı/merdiven/koçbaşı/mancınık ve çarpışma değişmez.
- Main, tarihî kaynaklar ve eski sürümler korunur.

## Harita 2 — Meydan Savaşı
- [ ] Mevcut çimenlikte düşük poligonlu doğal renk varyasyonları ve uzak zemin katmanları (G5.4 büyük HTML kaynağının güvenli erişimi açık).
- [ ] Asker siluetleri ve savaş alanı okunurluğu için ışık/kontrast düzenlemesi.
- [ ] Mevcut rotalar ve görüş/atış hatları dışında küçük çevre detayları.
- [x] İzole G5.4 dört bölük taktik haritasında okunaklı, yakınlaştırmayla ölçeklenen koordinat ızgarası ve yön işareti (yalnız UI).
- [ ] Chromium ve 70v70 komuta/çarpışma regresyonu.

## Harita 3 — Kale Kuşatması
- [x] Çarpışmasız alçak poligon toprak ton kırılmaları; merkezi geçiş korundu.
- [x] Sur taş sıraları ve iç kale üst kenar detayları; yeni collider yok.
- [x] Kule mazgal dişleri ve kapıya ahşap/metal yüzey detayları; mevcut kapı dekoru ile birlikte saklanır.
- [x] Batı/doğu merdivenlerine işlevsel mesh'e bağlı ahşap yan raylar ve bağlantı kelepçeleri (sadece görsel, yeni collider yok).
- [x] Gerçek G5.4 mürettebatlı koçbaşına ahşap çapraz destekler, tekerlek göbekleri ve çatı çıtaları eklendi (yalnız mesh).
- [x] Gerçek G5.4 mürettebatlı mancınığa destekler, tekerlek göbekleri ve üst travers ayrıntıları eklendi (yalnız mesh).
- [ ] 140 asker ve mevcut üç modlu oyunun gerçek Chromium/GPU testleri.

## Kabul
İlk kod değişiklikleri Harita 3 kale dekorasyonu ve Harita 2 canlı taktik haritasının görsel katmanında. Harita 2'nin 3B çevresi henüz değiştirilmedi. Testler çalıştırılmadan PASS denmez. Ana dala birleştirme ve yayımlama için ayrıca kullanıcı kabulü gerekir.
## 21 Kasım — V3 ara doğrulama
- İki değişen JavaScript dosyası sözdizimi kontrolü PASS: `siege-preview.js`, `g54-field-four-squad-runtime.js`.
- Tam üç modlu çevrim dışı HTML yeniden derlenmedi; Chromium/GPU/regresyon testleri çalıştırılmadı. Oynanış PASS iddiası yok.
- Meydan 3B motoruna erişim sağlanmadan görsel geometri yazılmadı; taktik harita V1 güncellemesi kaydedildi.

## 21 Kasım — V4
- `siege-ram.js` ve `siege-catapult.js` gerçek AK-05 makinelerinin mountVisual fonksiyonlarında kozmetik detaylar eklendi. Yeni silah, makine veya oyun modu oluşturulmadı.
- Her iki JavaScript kaynak dosyasının sözdizimi `new Function` ile PASS; tarayıcı, GPU, 140 asker ve üç modlu HTML yeniden paketleme kabulü henüz gerçekleştirilmedi.
- Meydan Savaşı'nın özgün büyük G5.4 HTML gövdesi GitHub dosya içerik uç noktasından boş geldi; mevcut 3B sahnesine güvenli müdahale henüz gerçekleştirilemedi. Harita 2 görsel işlerinin geri kalanı açık.

## 21 Kasım — V5 kuşatma çevre katmanı
- [x] Kale dış kuşatma arazisinin sağ/sol kenarlarına üç malzeme grubunda toplam 144 instanced düşük poligonlu bitki eklendi. Merkez koridor, koçbaşı ve mancınık mevzileri, avlu ve asker yollarının üstüne eklenmedi.
- [x] Görsel bitkiler dünya çarpışma listesine veya G5.4 yol/atak hesaplarına bağlanmadı.
- [ ] Büyük G5.4 arşiv HTML'si GitHub dosya arabiriminden yine boş geldi; mevcut 3B Meydan sahnesi değiştirilemedi.
- [ ] Üç modlu HTML oluşturma, gerçek Chromium ve GPU testi hâlâ yapılacak. Sözdizimi kontrolü PASS tek başına oynanış kabulü değildir.

## V6 — 2. harita yüksekliği için ilk kod teslimi
- [x] `recovered/army/modules/meadow-terrain-heightfield.js`: merkezi savaş alanını koruyan, tepe ve vadiyi yerel alan fonksiyonlarıyla hesaplayan deterministik yükseklik modeli eklendi (kuzey +12m, doğu +8m, merkez +5m, güney +10m, batı -3m).
- [x] Örneklenebilir 3B mesh, normal hesabı, sınırda sıfırlanan yükseklik ve kaynak temizleme fonksiyonu yazıldı.
- [x] `test_meadow_terrain_heightfield.mjs` içinde 6 test senaryosu eklendi.
- [ ] Test dosyası Node üzerinde henüz çalıştırılmadı; gerçek Chromium/GPU kabulü yok.
- [ ] Özgün G5.4 geniş HTML çekilemediği için bu modül **henüz oyuna bağlanmadı**. Görsel tepeler ile asker Y koordinatları, görüş hattı, ok/kurşun ve nav birlikte bağlanıp sınanmadan açılmayacak.

## V7 — Yükseklik modelinin hesaplama doğrulaması ve görsel renkler
- [x] Mevcut tepe fonksiyonu GitHub'dan güncel kaynak okunarak çalıştırıldı: 5 tepe/vadi hedef yüksekliği doğru, 14.641 örnek noktada sonlu değerler; sınır yüksekliği 0.
- [x] Örneklenen en yüksek eğim ~18,91°; 2 metre boyunca en büyük yükselti değişimi ~0,613 metre (halfSize=240 parametreli örnek). Bunlar mevcut G5.4 haritasının gerçek boyutuna bağlanmadan geçici ölçümlerdir.
- [x] Altı yükseklik regresyon kontrolünün eşdeğeri JavaScript değerlendirmesinde 6/6 PASS (resmî Node CI çalışması değil).
- [x] Görsel mesh'e vadi, çayır, sırt ve kurak tepe geçişli vertex color desteği eklendi. Mock Three.js ile 625 tepe noktası, 1.152 üçgen, sonlu renk değerleri ve geometri temizliği doğrulandı.
- [ ] Büyük tarihî G5.4 ana HTML dosyası elde edilip zemin/yol/silah/soldier Y sözleşmeleri tespit edilecek.
- [ ] Bu modül hâlen canlı 70v70 oyuna bağlı değil; gerçek tarayıcı/GPU ve 70v70 regresyonu bekleniyor.

## V8 — Zemini gerçek asker fiziğine bağlamak için köprü
- [x] `recovered/army/modules/meadow-terrain-bridge.js` bağımsız ve isteğe bağlı hesaplama katmanı: yükseklikten asker ayak/göz konumu, eğim sınırı, alt-adımlı yürüyüş ve arazinin 3B görüşü kapatması.
- [x] `test_meadow_terrain_bridge.mjs` içine 7 regresyon vakası kaydedildi. Canlı kaynaktan değerlendirilen eşdeğer 7/7 kontrol PASS (resmî Node CI değildir).
- [ ] Büyük G5.4 HTML tarihi kaynak dosyası içerik API'sinde boş döndüğünden mevcut asker renderer/hareket/atış API'siyle bağlama henüz yapılmadı. Git erişimi denemesi DNS nedeniyle başarısız. Canlı oyunda gerçek 3B yürüyüş ve ateş doğrulanmadı.
- [ ] Güncel üç modlu tek dosyalık HTML yeniden paketleme ve gerçek tarayıcı/GPU kabulü yapılacak.

## V9 — Meydan çim yüzeyinin görsel kalite geçişi
- [x] 3 ölçekli deterministik renk kırılması: geniş doğal çimen lekeleri, orta ölçekli varyasyon ve hafif ince doku. Yüksek alanlarda kuru ton; alçak alanlarda daha koyu/nemli yeşil.
- [x] Tekrarsız sabit dağılımla 2.700 kısa, düşük poligonlu 3B çim demeti; 3 InstancedMesh çizim grubu, bağımsız katı engel veya balistik nesne yok.
- [x] Görsel nesneler için kaynak temizleme ve iki kez güvenle dispose edebilme.
- [x] İşlevsel Three.js mock denemesinde 8.192 üçgenli zemin, 2.700 çim, geçerli renkler ve kaynak temizliği doğrulandı. Dört Node regresyon testi kaynak dosyası eklendi; CI çalıştırılmış değil.
- [ ] Çok önemli: bu hâlâ G5.4 gerçek Meydan oyununun içine bağlanmış değil; orijinal büyük HTML oyun kaynağı indirilemedi. Oyuna eklenmiş veya tarayıcıda ekran görüntüsü alınmış gibi sunulmayacak.

## V10 — Gerçek G5.4 Meydan çim entegrasyonu (kaynak düzeyinde)
- [x] G5.4 arşivinin 1.257.893 karakterlik özgün kaynağı GitHub Blob SHA ile okunabildi. Gerçek `buildMeadowSquare()` ve `ArenaMeadowGrass.createInstancedTufts` bulundu; tarihî sahnede bu çimlerin kasıtlı olarak kapatıldığı doğrulandı.
- [x] `build_three_mode_launcher.mjs` yalnız çalışma anında çözülen G5.4 Meydan HTML'sinde belirli ve tekil kaynak işaretinden 2700 adet native düşük poligonlu `InstancedMesh` çimi tekrar sahneye ekliyor. FFA ve Kale modlarına uygulanmıyor. Orijinal gömülü ordu HTML kaynak SHA'sı korunuyor.
- [x] 3B çimler `meadowMapData.visuals` içine alındığı için orijinal harita değişiminde görünürlüğü asıl motor tarafından yönetiliyor. Dünya collider/atış/AI sistemleri değiştirilmedi.
- [x] Kaynak işareti 1 kez eşleşiyor, derleyici JavaScript sözdizimi doğrulandı. İki regresyon testi kaynak dosyası yazıldı.
- [ ] Üç modlu HTML henüz yeniden derlenmedi ve gerçek Chromium/WebGL başlatma testi yapılmadı; bu aşama **kod entegrasyon adayıdır, oynanış PASS değildir**.
- [ ] Daha önce hazırlanan tepecikli yükseklik mesh'i G5.4'te etkin değil. Çünkü flat soldier physics devam ediyor; görünür yamaçların yere basma/mermi fiziğiyle uyumlu olması ayrı kabul gerektiriyor.

## V11 — Gerçek üç modlu tarayıcı kabul kapısı
- [x] Kaynak erişimi çözüldü: tarihî G5.4 1,26 milyon karakterlik HTML blob'undan gerçek `buildMeadowSquare` ve önceden var olan `ArenaMeadowGrass.createInstancedTufts` doğrulandı.
- [x] Orijinal G5.4 çalışma kopyasının içinde `2700` çim InstancedMesh'ini doğrudan gerçek `scene` içine ekleyen korumalı görsel yama yazıldı. Arşiv ve üçüncü mod aynı kalır.
- [x] Chromium smoke testine Meydan modunda `2700` gerçek görünür instanceli native çim mesh kontrolü eklendi. Yama beklenen tekil kaynağı bulmazsa dosya üretimi hata verecek.
- [x] Üç modlu CI workflow'u yalnız görsel feature dalı için de push ile koşacak ve yeni arazi testlerini kapsayacak şekilde güncellendi.
- [ ] Workflow'un SUCCESS sonucu ve gerçek Chromium ekran görüntüsü henüz doğrulanmadı; oyunda çalıştığına ilişkin son kabul verilmedi.
- [ ] Önceki yükseltili tepe 3B görseli canlı oyunda henüz bağlı değil; bugünkü entegrasyon düz çimenlikteki native grass içindir.

## V12 — G5.4 gerçek Meydan'da yakın kamera çimleri
- [x] Gerçek 1.257.893 karakterlik orijinal HTML kaynak blob'u ile kontrollü derleyici çalışma-zamanı enjeksiyonu doğrulandı.
- [x] G5.4 Meydan modunda yerleşik ArenaMeadowGrass görsel sistemine 2.700 uzak + **12.000 oyuncu çevresi** çim demeti bağlandı (iki InstancedMesh çizim grubu). createNearbyTufts ve updateNearbyTufts gerçek yerleşik oyun kodu.
- [x] Yakın çimler yalnız Meydan durumunda oyun animate() döngüsünde oyuncu konumuna göre, yaklaşık 20 birimlik karolar geçildiğinde güncellenir. Kurulumda scene içine girer ve orijinal harita görünürlük sistemiyle kapatılıp açılır.
- [x] Görsel yama derleyicide gerçek özgün meadowNearGrass ve renderer.render kaynak işaretleri **birer kez** doğrulandı, frame.srcdoc üzerinde yürütüldü. Sonuçtaki HTML içinden çıkarılan **29 script'in tamamı JavaScript derlemesini geçti**. Kaynak orijinal saklı base64 içerik değişmedi.
- [x] Chromium kabul senaryosu uzak ve yakın instance sayısını, görünürlüğünü ve lastTileX güncellemesini açıkça sınayacak biçimde genişletildi.
- [ ] Henüz tam 3 modlu HTML artefaktı bu ortamda yeniden üretilip tarayıcıda çalıştırılmadı. CI SUCCESS ve gerçek GPU görsel kabulü henüz teyit edilmedi.
- [ ] Tepeler canlı G5.4 sahnesine bağlanmış değildir. Yalnızca gerçek çimenlik görünümü genişletildi; savaş fiziği değiştirilmedi.

## V13 — Meydan'ın gerçek 3B dış tepe siluetleri ve ufuk atmosferi
- [x] Özgün 300x ölçekli G5.4 çimen meydanı çevresine 3B alçak çokgenli yumuşak tepeler eklendi. İşlem oynanabilir haritanın içindeki zemine veya asker Y yüksekliğine uygulanmıyor.
- [x] Dış tepe halkası 325 köşe / 512 üçgen tek yüzey mesh'idir; yüksekliğe göre 5 düşük doygunluklu doğal arazi rengi ve düzensiz sırt silueti var.
- [x] Kaynak gerçek boyutunda bütün tepe köşeleri meydanın kare sınırının en az 38,89 birim ötesinde; bot/oyuncu/mermi colliders ve nav verileri değiştirilmedi.
- [x] Kale modunun orijinal turuncu sis ve gökyüzü görünümü korunuyor. Meydan seçildiğinde sis yoğunluğu 0.0046'dan 0.00065'e düşürülüyor ve daha doğal gökyüzü/sis tonları kullanılıyor; kale moduna dönülünce eski değerler geri geliyor.
- [x] G5.4 oyununun orijinal HTML blob'u değiştirilmeden, üç modlu çalışma kopyasında yeni sahne mesh'i yaratılıyor. Doğrulama: oluşturulan HTML'deki 29 JS script sözdizimi PASS, gerçek geometri sonlu koordinatlar PASS, sahne nesnesi kaynak temizleme PASS.
- [x] Chromium senaryosuna 325 köşe, 512 üçgen ve sahne görünürlüğü kontrolü eklendi. CI'ya yeni geometri testleri bağlandı.
- [ ] Gerçek Chromium/GPU çizim sonucu ve tek dosyalı tam HTML artefaktının başarılı paketlemesi henüz doğrulanmadı. Bu sürümü ekran görüntüsü veya kabul edilmiş oynanış sürümü olarak değerlendirmeyin.
- [ ] Mevcut oyun içinde üzerinde yürünebilir gerçek tepeler ve vadi hâlâ yok; bunun için asker/fizik ve atış uyumu gerekir. Bu adım yalnız dış tepe görselliğidir.

## V14 — Meydan'ın iç çimenliğine doğal büyük yüzey geçişleri
- [x] Orijinal G5.4 Meadow grass CanvasTexture aynen korunarak yalnızca kendi zemin mesh'ine çok ölçekli vertex color görsel katmanı eklendi. Yüzeyde dalgalı açık/koyu ot alanları, mevsimsel kuru renk farklılıkları ve çok hafif aşınmış çim izi bulunuyor.
- [x] 144x144 segmentte 21.025 renk köşesi kullanıldı. Yüzey yüksekliği Y=0 kalır; hiçbir yapay yokuş, asker çarpışma hacmi, mermi engeli, bot davranışı veya mekanik değiştirilmedi.
- [x] Eski düz PlaneGeometry kaynak temizliği yapılıyor; özgün renkli doku, tekrarlama/filtreleme ve yerleşim korunuyor. Ayrı gölge kaplamaları veya binlerce tek tek zemin nesnesi oluşturulmuyor.
- [x] G5.4 kaynak blob'unun orijinali saklı tutularak yalnız çalışma anında oluşturulan Meydan iframe koduna entegre edildi. Derleyicinin ürettiği çalışma kopyasında 29 JavaScript bölümü sözdizimi PASS; mevcut uzak tepeler ve yakın çimler de korunuyor.
- [x] Bağımsız Three.js mock testinde 21.025 köşe, 41.472 üçgen, ton aralığı farkları, doku kimliği ve Y=0 doğrulandı.
- [x] Gerçek Chromium kabul senaryosuna zemin renk geometrisi kontrolü eklendi ve ilgili CI workflow kapsamı genişletildi.
- [ ] Henüz güncel üç modlu HTML bu oturumda gerçek Chromium/WebGL içinde açılıp ekranda doğrulanmadı; görsel kalite kabulü verilmedi.
- [ ] Üzerinde yürünebilir gerçek iç tepeler mevcut değil; bu V14 yalnızca düz zeminin doğal görünümünü iyileştirir.

## V15–V16 — Gerçek Chrome/WebGL kabulü ve görüntü üzerinden düzeltme
- [x] GitHub Actions üç modlu derleme, kaynak SHA koruma ve tüm paketleme/regresyon testleri PASS. İlk engeller değişmiş çalışma kopyasına ayarlanmamış iki test beklentisiydi, oyun derleme sorunu değildi; testler düzeltildi.
- [x] GitHub run 44965947604: hem paketleme hem gerçek SwiftShader Chromium üç mod/sahne geçişi SUCCESS. İndirilebilir tek çevrimdışı HTML ve FFA/Ordu/Kuşatma ekran görüntüleri üretildi.
- [x] Gerçek Meydan görüntüsü incelendi. Aşırı iri ve sivri çim biçimleri görüldü. V16'da G5.4'ün yerleşik yakın ve uzak çim ölçekleri küçültüldü; büyük ot yüzeyindeki aşırı açık renkler daha dengeli ve yeşil olacak şekilde yeniden ayarlandı. Çim sayıları 2.700 uzak + 12.000 yakın, fizik ve tüm özgün motorlar aynı kaldı.
- [x] Son güncel run 44966251580: paketleme ve gerçek SwiftShader Chromium kontrolü **ikisi de SUCCESS**; 2.700 + 12.000 native grass, 325 vertex/512 triangle dış tepeler ve 21.025 köşeli zemin gerçek çalışmada doğrulandı. GitHub Actions artifact: KillTheKing-3-Mod-Arena-Ordu-Kale-Kusatmasi-Tek-HTML-NOT-Final.
- [ ] Gerçek ekran görüntüsündeki geçici büyük yarı saydam gri ön-plan nesnesi/efekti ve genel sahne ışık dengesi ayrıca estetik kalite incelemesi istiyor. Smoke/mesh kaynağı saptanmadan oyunun fiziğine veya oynanışına müdahale edilmeyecek.
- [ ] Windows fiziksel GPU ve oyuncu tarafından görsel kabulü bekleniyor. Bu geliştirici adayı, son yayın sürümü değildir.

## V17 — Gerçek görüntüdeki dev gri blok düzeltildi
- [x] V16 Chromium screenshot'unda ön plandaki büyük yarı saydam gri prizma tespit edildi. 3B tanı ile tüm saydam mesh'ler kapanınca prizmanın kaybolduğu; gökyüzü kubbesi tek başına kapanınca kaybolmadığı gözlendi.
- [x] Saydam nesneler ikiye ayrıldı: eski bulut BoxGeometry grubu (opacity 0.85) kapatılınca blok sürüyor; diğer saydam nesneler kapatılınca blok gidiyor. Asıl kaynak: eski tüfek atışında doğrudan kamera çevresinde oluşan 22 adet volumetrik barut dumanı küpü.
- [x] Oyunun 140 askerli MEYDAN SAVAŞI görsel çalışma kopyasında tüfek dumanı kamera konumundan nişan doğrultusunda 5 birim ileri taşındı; 22 -> 8 görsel parça, 3.0 -> 1.0 saniye. FFA/TDM kaynakları ve diğer silah/AI/fizik davranışları korunuyor.
- [x] Meydan'ın gerçek büyüklüğüne göre sky dome ölçeği düzeltildi; mod geçişinde native G5.4'ün 8x'e geri çekmesini önleyen ikinci kaynak yaması eklendi. Kale modunda eski atmosfer korunuyor.
- [x] Uygun olmayan blok biçimli eski skyCloud grupları yalnızca Meydan modunda gizleniyor; diğer moddaki orijinal bulutlar korunuyor.
- [x] Duman düzeltmesinin gerçek Chromium screenshot'unda dev gri blok tamamen kaybolduğu gözlemlendi; askerler ve açık savaş alanı artık net. Tanı modülleri ve geçici sahne inceleme kancası son üç modlu HTML'den çıkarıldı.
- [x] Son güncel GitHub Actions run 44970283131: tek HTML paketleme + gerçek SwiftShader Chromium üç mod testi **PASS/PASS**. Oynanabilir HTML ve 3 mod ekran görüntüleri artifact olarak üretildi. 29 game script syntax PASS; kaynak orijinal saklı base64 korunuyor.
- [ ] Kullanıcı görsel kabulü ve Windows donanım GPU testi ayrı yapılmalı. Bu aday son yayın onaylı oyun değildir.

## V18 — Meydan'a özgü doğal gün ışığı ve gökyüzü
- [x] Orijinal G5.4 üç atmosfer seçeneğini (gün batımı/öğle/gece) koruyan, yalnız Meydan modunda kullanılan `g54-meadow-natural-lighting.js` eklendi. Gökyüzü renk geçişleri, güneş renginin/şiddetinin ve konumunun dengelenmesi, hemisferik dolgu ışığı, sis ve ton eşleme pozlaması birlikte ayarlandı.
- [x] Kale'ye dönülünce özgün `setAtmosphere(currentAtmosphereIdx)` eski parametreleri geri yüklüyor. [H] ile üç atmosfer seçeneği Meydan'da da seçilebiliyor.
- [x] 3 birim test, güncel üç modlu çalışma kopyası 29/29 JS sözdizimi ve Chromium'da gerçek `PASS_MAP2_NATURAL_LIGHTING` + `PASS_MAP2_ORIGINAL_H_DAY_CYCLE` doğrulandı.
- [x] GitHub Actions run 45022149047: paketleme SUCCESS, üç modlu Chromium/WebGL SUCCESS, sayfa/konsol hataları yok. Tek offline HTML ve gerçek ekran görüntüleri üretildi.
- [ ] Gözle yapılan incelemede ufuk gökyüzü öncekinden daha nötr ama zemin hâlâ fazla parlak; sonraki görsel adım yalnız çim tonu ve zemin materyalinin doğal görünümü olacak.

## V19 — Tek parçada ağaç, çalı ve çimen mega görsel güncellemesi
- [x] Meydan gerçek native G5.4 sahnesine 250 farklı boy/renkte low-poly ağaç (1 gövde ve 3 katmanlı taç) eklendi. 64'ü görünür kenar kuşağında, 186'sı dış orman kuşağında.
- [x] Savaş alanının içine 860 alçak çalı ve 1.050 küçük kuru ot/çiçek kümesi dağıtıldı; dağılım deterministik ve InstancedMesh ile **yalnız dört çizim grubu** kullanıyor.
- [x] Orman tabanında çimenlik geçiş yüzeyi eklendi; ana zemin materyaline daha doğal yeşil çarpan (0xa3b58c) uygulandı.
- [x] Yeni bitkiler yalnız 3B dekorasyon: gerçek G5.4 bot AI, çarpışmalar, mermiler, spawns, ordu komutu ve FFA/Kale kaynakları korunuyor. İçteki 64 ağaç şimdilik çarpışmasızdır; görsel yerleşim fiziksel kabul değildir.
- [x] Güncel CI 45036353698 **paketleme PASS, gerçek Chromium/SwiftShader üç mod PASS**. Görsel 250 ağaç, 860 çalı, 1.050 küçük bitki sayısı ve görünürlük tarayıcıda denetlendi. Sayfa ve konsol JS hatası yok.
- [x] Tek çevrimdışı HTML ve gerçek Chromium ekran görüntüsü üretildi, ana dala birleştirme yapılmadı.
- [ ] Görsel incelemede bitkiler oyuna eklenmiş olsa da ağaçlar başlangıç kamerasından hâlâ uzakta ve tepeler genel manzarada az fark ediliyor. Daha iyi kompozisyon, fiziksel ağaç çarpışması ve tüm haritada görülebilen ağaç kümeleri ayrı etap gerektirir.

## V20 — Görünür orman kuşakları ve büyük bitki çeşitliliği
- [x] Önceki V19 tek tip kenar ağaçlarının kompozisyonu değiştirildi: gerçek G5.4 Meydan'da **18 farklı ağaç kümesi**, toplam **460 ağaç** (280 geniş taçlı yapraklı ve 180 iğne yapraklı), **1550 çalı**, **2350 ot/çiçek**, **380 alçak kaya**.
- [x] Geniş yapraklı ağaçlar üst üste binen dört asimetrik çokgen taç parçasından; iğne yapraklılar üç katmandan oluşuyor. Daha belirgin gövde, 7 yaprak tonu, boy/en varyasyonları ve kümelenmiş çalı geçişleri eklendi.
- [x] **260 ağaç** daha yakın manzara kuşağında (merkeze 600 birimden yakın), **200 ağaç** uzak kuşakta. En yakın ağaç merkeze **389,88 birim**; ordu diziliş merkezindeki 250 birimlik koridorda dekoratif ağaç yok.
- [x] Her üç boyutlu bitki grubu tekil ağaç başına yeni çizim çağrısı açmak yerine toplam **6 InstancedMesh** (gövde/geniş taç/ibreli taç/çalı/çiçek/kaya) ile çiziliyor.
- [x] Bitkiler ve taşlar dekoratif. AI, gerçek navigasyon, mevcut G5.4 çarpışmaları, mermi fiziği, bölük komutları, FFA ve Kale modları değiştirilmedi. Yeni ağaçlar fiziken engel değil.
- [x] GitHub Actions **run 45037020355**: tek offline HTML paketleme ve özgün kaynak korunumu **PASS**, gerçek Chromium SwiftShader üç-mod/motor kontrolü **PASS**. Bot/oyun kontrolleri korunuyor.
- [x] Gerçek tarayıcı raporunda: `treeCount:460`, `groveTrees:260`, `deepCenterTrees:0`, `batchCount:6`, `visible:true`. Ekran görüntüsünde ağaçlar savaş alanının kenarlarında belirgin.
- [ ] Estetik kabul kullanıcının kendi GPU'sunda yapılmalı. Hedef gerçekçi orman değil, mevcut oyunun stiline uyumlu stilize dış doğa kuşağıdır.

## V21 — Meydan orman zemini + Kale dış çevre bitki örtüsü
- [x] V20'nin 18 orman kümesinin çevresine **460 yere sıfır yaprak örtüsü parçası ve 320 yosun geçişi**, toplam **780 yeni orman zemin detayı** eklendi. İki InstancedMesh çizim grubu kullanılır. Yollar, zemin yüksekliği, asker fiziği ve navigasyon etkilenmez.
- [x] Kale Kuşatması'nın gerçek oyun sahnesi olan `recovered/siege/siege-preview.js` içine **80 görsel ağaç, 220 çalı, 430 alçak ot, 96 taş** dış çevre dekorasyonu eklendi. Beş instanced çizim grubu; kuşatma kapısı, surlar, asıl asker yolları ve oyuncu çarpışmaları değişmedi.
- [x] İki haritanın görsel bileşenleri doğrudan üç modlu çevrimdışı HTML içinde; özgün FFA ve G5.4 ordu arşivi değişmedi.
- [x] GitHub Actions **45037653280** paketleme / kaynak koruma PASS, gerçek Chromium SwiftShader üç mod kabulü PASS. Tarayıcıda `forestFloorPatches:780`, `batchCount:8`, Kale için `trees:80,shrubs:220,grass:430,stones:96,batches:5` doğrulandı. Ekran görüntüleri ve HTML artifact üretildi.
- [ ] Kale dış bitkileri sınırlı kamera açısında, büyük HUD panelleri arkasında gizlenebilir; daha iyi objektif görsel karşılaştırma için harita kamerasından ayrıca görüntü gerekir.
- [ ] Yeni ağaç ve taşlar yalnız görseldir; fiziksel engel olarak kabul edilmez. Gerçek oynanış mekaniğini bozmayacak şekilde bırakıldı.
