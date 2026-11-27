# KTK — OPT-MASTER / Harita bazlı kalite koruyan optimizasyon

2026-11-27. Başlangıç kanonik HTML blob: 11eda8d606c290773b04b62ea682f404b354d57a. Kullanıcı onayı: optimizasyona başla, her haritayı ayrı iş kolu olarak ele al. Bot karar sistemi, 140 asker, fizik/hasar, harita boyutları, ışık/renk ve yakın görsel kalite korunacak. FPS artışı donanım karşılaştırması olmadan ilan edilmez.

## İş kolları ve sıra

| ID | Alan | İş | Durum |
|---|---|---|---|
| A0 | Ortak QA | Arena dakika ofseti ve isteğe bağlı ekran görüntüsü; ordu 600s kabulü | 3/3 uzun test PASS (600s+) |
| A1 | Ortak QA | 3 harita x 2 çözünürlük; CPU profiler, fizik, çim, render çağrısı, varsa GPU timer query, kaynak sayaçları | 6/6 baseline ve 6/6 OPT02 profil PASS; donanım kabulü açık |
| A2 | Ortak QA | Gerçek GPU ve aynı kamera/kalite ile tekrarlanabilir baseline | Açık |
| O1 | Ortak motor | Uzun karede gerçek maç saati/simülasyon farkı; ayrı saat/iş yükü politikası, spiral-of-death engeli | Açık |
| O2 | Ortak motor | Sahiplik, dispose, pooling, transient ve tekrar maç temizliği | Açık |
| O3 | Ortak motor | Fizik broadphase/raycast ve HUD iş yükü; karar mantığı sabit | Açık |
| O4 | Ortak motor | Statik matris ve materyal paylaşımı; gölge maliyeti, kaliteyi koru | Açık |
| AR1 | Arena | 280→947 geometri, 27→46 texture artışının kaynak atfı; sınıf/death/replay ayrımı | Açık |
| AR2 | Arena | Sabit mimari batch, bot/weapon mesh kaynak paylaşımı, efekt maliyeti | Açık |
| AR3 | Arena | Sabit kamera ve savaş senaryosu; 10 dk iki doğal maç kabulü | Açık |
| ME1 | Meydan | Meshy/ucuz/uzak çim ve asker üçgen yükünü ayrı ölç | Açık |
| ME2 | Meydan | Görünürlük ve mesafeye bağlı LOD; siluet/yoğunluk korunur | Açık |
| ME3 | Meydan | 140 asker instancing/animasyon ve fizik yükü; komuta/harita korunur | Açık |
| ME4 | Meydan | 10 dk aktif oynanış, komuta/formasyon kabulü | Açık |
| KU1 | Kuşatma | 910 draw call tepe; duvar/kule/ekipman/asker ve shadow-pass atfı | Açık |
| KU2 | Kuşatma | Bölgesel statik batch, ortak geometri/materyal; collider/raycast/kapı ayrı kalır | Açık |
| KU3 | Kuşatma | Kale içi görünürlük, ekipman ve animasyon optimizasyonu | Açık |
| KU4 | Kuşatma | 10 dk aktif savaş, kapı/kuşatma makineleri/replay kabulü | Açık |
| H1 | Nihai | 263+ regresyon, 3 harita UI, hedefli BUG21–31 testleri, önce/sonra profili | Açık |
| H2 | Nihai | Gerçek donanım 1080p, ortalama/1% low/p99, görsel eşlik | Açık |

## A0/A1 kapsamı
Önceki QA07 raporunda Arena ikinci maçının saniye ofseti ms'ye çevrilmemişti. Düzeltildi. Ekran görüntüsü hatası isteğe bağlı uyarı; ordu testinde yalnız hedef süre sonunda screenshot. Kalan 600s kabulü gerçek aktif frame süresiyle yapılır. Araçların önceki eksik süreleri yeniden koşulacak. Profil işi gerçek oyun kodunu değiştirmeden yalnız QA tarayıcı oturumunda fonksiyonları ölçer; CPU örnekleyici, render çağrısı duvar süresi ve GPU extension varsa sorgu sonucu farklı metriklerdir. Draw kategorileri yaklaşık atıf; üçgen tahmini renderBufferDirect çağrılarına dayanır, gölge ve ana kamera ayrıdır. 960×540 ve 1920×1080, orta kalite yazılımsal WebGL; gerçek GPU benchmark değil. Isınma 10s, ölçüm hedefi 35s; çok ağır karelerde örnek sayısı düşük olabilir. Asıl oyun kodu değiştirilmedi.

## Kabul politikası
Her paket küçük bağımsız değişiklik, önce/sonra aynı test, kanonik HTML eşitliği, gerçek Chromium, regresyon; FPS farkı ölçülmediyse yalnız kaynak azalışı bildirilir. Harita özel sonuçlar ayrı kapanır; diğer haritalarda regresyon kabulü olmadan tamamlanmış sayılmaz. Eski dallarda unutulacak iş bırakılmaz, bu tablo güncellenir.

## OPT-A1 sonuçları ve OPT-O2/AR2/KU2 ilk kod paketi
- [45975077384](https://github.com/zxc28tarik/killtheking/actions/runs/45975077384): 6/6 profil PASS. Yazılımsal WebGL, çok az gerçek kare; 1080p ölçüm örnekleri Arena 29, Meydan 4, Kuşatma 8. Arena GPU timer yalnız 1 örnek 1416ms; ordu haritalarında geçerli GPU timer örneği yok. CPU updateGame ortalama alt adım 1.57/15.48/8.46ms. GPU/kompozit beklemesi ile CPU çağrı süresi ayrıdır; gerçek donanım sonucu değildir.
- Gölge kategorisi Arena'da kare başına ~150 statik kale çağrısı; kuşatmada ~354 statik kale+kuşatma mimarisi gölge çağrısı. Her iki ordu haritasında diğer instanced kategori kare başı 138 çağrı / 951992 üçgen; bu kategori asker veya diğer dekor ayrımı henüz kesin değil. Meydan çim kategorileri ayrıca gözleniyor. Bu sonuçlarla AR2/KU2 statik kaynak ve gölge birleştirme, ME1 asker geometrisi atıf önceliklendirildi.
- İlk gerçek oyun kodu değişikliği: addBox ve nativeSiegeMesh yalnız aynı boyutlu BoxGeometry paylaşır; taş materyali aynı UV repeat çiftini paylaşır; oyuncu okları sabit iki geometriyi paylaşır, release ortak kaynakları dispose etmez. Mesh kimliği, raycast, collider, UV, renk/gölge ve şekil korunur. Yeni 4 regresyon testi; önce/sonra gerçek tarayıcı ve kaynak sayısı henüz bekleniyor. Bu paket draw call azalması veya FPS kazancı garanti etmez.
- `ktkStaticResourceStatus()` gerçek oluşturma/önlenen kaynak sayaçları. Uzun test A0 tekrarları halen devam ediyor.

## OPT-02 — A0 kapanışı, AR2/KU2 ve ME3/KU3 başlangıcı
- A0: [Arena 45975077366](https://github.com/zxc28tarik/killtheking/actions/runs/45975077366) 600s maç saati, 590.96s kare aralığı; [ordu 45975077624](https://github.com/zxc28tarik/killtheking/actions/runs/45975077624) Meydan 604.94s / Kuşatma 604.48s aktif kare aralığı; üçü PASS, tüm 10 dakika binleri dolu. Screenshot uyarıları sürüyor ama test artık durmuyor. Yazılımsal FPS 0.67 / 0.33 / 0.25, maksimum gecikme 6249.7 / 11132.9 / 11849.6 ms. OPT01 öncesi aynı HTML, değişim koşu varyasyonu; FPS kazanımı değil.
- OPT01 genel test 266/267: BUG20 literal `head.position.z = -0.68` formatı değişmiş; aynı değerle önceki yazım geri getirildi. UI32 PASS. Hedefli Chromium kurulum hatası (apt exit 100); oyun başarısızlığı kanıtı değil.
- Arena + Kuşatma ortak kale tabanında yalnız addBox non-solid dekorasyonları aynı geometri/materyal/gölge/katman ve bölge bazında instancing. Fiziksel duvar, barrel, kuşatma mekanizması ve raycast listesi etkilenmez. r128 instance sınırı nedeniyle frustumCulled=false, bölgesel gruplama; gerçek draw call kazancı profil ile ölçülmeli. Orijinal dekorlar sahneden çıkar, batch map visibility listesine dahil olur.
- Meydan + Kuşatma: mevcut 96 kapasiteli görsel ok batch'i yalnız aktif uçuş sayısını çiziyor. Simülasyon, ok slot güncellemeleri ve kapasite korunur. Ölü asker sıkıştırma ve LOD henüz yapılmadı.
- Profil kategorisinde asker grubu ve oklar artık ayrı işaretleniyor. Gerçek kaynak sayaçları eklendi. 3 yeni regresyon testi, yeni CI ve aynı profil karşılaştırması bekleniyor.

## OPT-03 — Arena / ortak kale sabit fiziksel geometri görsel batching
- OPT02 exact commit 31366e1: 4/4 workflow PASS ([regresyon](https://github.com/zxc28tarik/killtheking/actions/runs/45977260578), [UI](https://github.com/zxc28tarik/killtheking/actions/runs/45977260315), [hedefli](https://github.com/zxc28tarik/killtheking/actions/runs/45977260481), [6 profil](https://github.com/zxc28tarik/killtheking/actions/runs/45977260467)). Kaynak sayacı 702 kutu isteği / 139 geometri = 563 önlenen allocation, 12 önlenen texture clone; 25 dekor 6 batch, 19 potansiyel çağrı azalması. Arena statik gölge çağrıları 150→149/kare (dekorların çoğu gölge atmaz); asker ana kamera kategori ~950840 üçgen/kare. Yazılımsal FPS iyileşmesi doğrulanmadı.
- Yeni kod: yalnız addBox kaynaklı opaque static solid kutular için aynı materyal/gölge/layer ve bölge içinde pozisyon/normal/UV birebir birleştirme. Orijinal fizik meshleri sahnede ve worldMeshes listesinde kalır; görünürlük flag'i değişmez, aynı side özellikli invisible proxy material kullanılır. Gölge yalnız batch'te kalır. Orijinal değişken güney/kuzey duvarları hariç, bütün dinamikler hariç. Böylece raycast kimliği ve kuşatma duvar swap korunur. 2 regresyon testi gerçek r128 raycast, attribute, transform ve visibility denetimi. Bu aşamada kuşatma ek mimarisi henüz batch edilmedi.
- Yeni profil sayaçları ile gerçek batch ve gölge kazancı doğrulanacak. İnsan görsel karşılaştırması ve fiziksel GPU FPS açık. Kaynak optimizasyonları tamamlandı olarak işaretlenmez.

## OPT-04 — Meydan / görünmeyen askerlerin tam geometri maliyetini eleme
- OPT03 commit 4f4d240: [genel](https://github.com/zxc28tarik/killtheking/actions/runs/45978691174), [hedefli](https://github.com/zxc28tarik/killtheking/actions/runs/45978691187), [UI](https://github.com/zxc28tarik/killtheking/actions/runs/45978691213), [6 profil](https://github.com/zxc28tarik/killtheking/actions/runs/45978691221) PASS. 64 solid→8 batch, 56 shadow draw azaltımı; profilde Arena 149→93 statik gölge çağrısı/kare, Kuşatma 147→91. FPS kazancı henüz tekrarlanabilir değil.
- ME3: r128 eski model batch'lerinde frustumCulled=false ve her role kapasitesi tam çiziliyordu; ölüm sıfır scale bile vertex işi. Render-only compaction: orijinal model parça bounding sphere + joint konumu/scale ile muhafazakar role yarıçapı, kamera frustum ve alive testi, görünür instance prefix; geçici matrisler finally ile eksiksiz geri yüklenir. Boş batch görünmez. Orijinal asker slotları, bütün simülasyon/AI/animasyon/140 roster, mesh ve materyaller değişmez. Sadece Meydan'da aktif; elevated kuşatma actor bounds sonraki KU paketi. 4 gerçek r128 regresyon testi ve profiler görünür/culled/triangles sayacı. Görsel piksel karşılaştırması, kabul testleri ve performans kazanımı bekliyor.

## OPT-05 — OPT04 regresyon kabulü ve çizim kapsamı doğrulaması
- OPT04 exact SHA 45224e4: [genel](https://github.com/zxc28tarik/killtheking/actions/runs/45981234766) 271 PASS / 2 FAIL; [hedefli](https://github.com/zxc28tarik/killtheking/actions/runs/45981234749), [UI](https://github.com/zxc28tarik/killtheking/actions/runs/45981234710), [6 profil](https://github.com/zxc28tarik/killtheking/actions/runs/45981234751) PASS. Genel testin iki hatası: BUG04 VM kaynak dilimi yeni window bağımlı fonksiyonları da çalıştırıyordu; BUG10 eski doğrudan renderer çağrısını arıyordu. Saat testinin kapsamı yeniden izole edildi; BUG10 yeni çağrı zinciri ve finally temizliği doğrulanıyor, eski koşullar kaldırılmadı.
- Gerçek ArenaArmyRender.getPartBatches kaynak kontrolü: asker batch'leri castShadow=false, receiveShadow=false. Bu sürümde önceki gölge kaybı şüphesi kaynakla desteklenmiyor. Bu özellik regresyon testine bağlandı. Gerçek poz sınırı ve CPU/GPU maliyeti açık.
- Yeni davranış testi: Arena/Kuşatma/gizli grup/boş state doğrudan render, aktif Meydan prepare→render→restore, render exception durumunda restore. Bu tur üretim HTML'si değişmedi. Yeni CI ve donanım kabulü bekleniyor.

## OPT-06 — AK25/AK26/AK31 statik kuşatma mimarisi bölgesel çizim batch
- Sadece üç hareketsiz genişleme root'unun doğrudan child BoxGeometry mesh'leri; 48 birim hücre, malzeme UUID/gölge/receiveShadow/renderOrder/layer koşulları birebir korunur. Gerçek orijinal mesh, geometri, worldMeshes referansı, visible flag ve collision kaydı kalır; görünmez, aynı yüz yönlü materyal proxy çizimi devreder ve shadow yalnız birleşik mesh'ten gelir. Sahnede hareketli kapı/koçbaşı/mancınık/kule ve mevcut V20 skin tamamen hariç. Yalnızca statik opak yüzeyler, orijinal UV ve normal transformuyla batch edilir; instanced ağaçlar ve çim hariç. İki kanonik HTML dosyası eşit tutulur.
- 4 yeni Node testi: raycast kimliği, görünürlük/gölge, vertex/normal/UV eşliği ve dinamik/şeffaf/geometri dışlama. Yeni testler, CI, üç harita 6 profil, gerçek GPU, piksel eşliği ve 10 dk kuşatma oyunu doğrulamasından geçmeden nihai kabul değil.

### OPT-06 kabul ara raporu — exact SHA 3a36bc9, 27 Kasım
- [Genel regresyon](https://github.com/zxc28tarik/killtheking/actions/runs/45983204137) **282/282 PASS**; [UI32](https://github.com/zxc28tarik/killtheking/actions/runs/45983203975) PASS; [6 harita/çözünürlük profil](https://github.com/zxc28tarik/killtheking/actions/runs/45983203951) **6/6 PASS**. Dört yeni kaynak/fizik/render testiyle her iki kanonik HTML birebir eşit.
- Gerçek runtime sayaçları: **329** uygun statik mimari mesh; **265** orijinal mesh **52** statik bölgesel görsel gruba aktarıldı; teorik tam görünümde **213** ana kamera draw ve **213** shadow draw azaltımı. Kaynak mesh'ler fizik/raycast için tutulduğu için geometriler mutlaka azalmaz.
- Ölçülen KU mimari shadow-pass: **206→135 çağrı/kare** (71 / yaklaşık %34,47 azalma), hem 960×540 hem 1920×1080 profilde, ısınma/hareket/savaş fazlarının her birinde. Bu sayılar aynı siege-architecture shadow kategorisinden, sabit 91/kare castle-static shadow kategorisiyle kare sayısı normalize edilerek hesaplandı. Bazı fazlarda ana kamera çağrısı düşmeyebilir (geometri frustum/nesne kümeleri etkisi).
- Yazılımsal WebGL 960p frame-time ortalama **3158,96ms (11 kare)** → **3513,19ms (10 kare)**; 1080p **5475,71ms (9 kare)** → **6209,74ms (5 kare)**. Bu aşamada FPS iyileşmesi **kanıtlanmadı**, hatta ölçülen yazılımsal süreler daha kötü; küçük örneklem ve farklı kamera/maç durumu yüzünden donanım regresyon hükmü de verilemez. Gerçek donanım FPS/1% low/p99, fotoğraf/piksel karşılaştırma, 10dk üç harita insan kabulü açık; üretim ışık/renk, asker ve bot kararları değişmedi.

## OPT-07 — Asker matrisleri, aktif ok tamponu ve ayrı ordu CPU profili
- Statik opt olmayan gerçek ordu görsel sisteminde her kare 140 asker için gereksiz Y ekseni Vector3 allocation kaldırıldı; yön dönüşü matematiği birebir aynı. Ölmüş ve önceki karede zaten sıfır ölçeğe alınmış askerlerin 7 rig parçasının tekrar matris hesaplama/yazması atlanıyor. KarakterMotion.update yine her askerde çağrılıyor (animasyon fazı/revival korunuyor); yeni battle state durumunda bütün slotlar yeniden yazılıyor. AI, hasar, oyuncu komutları, 140 asker ve silah/renk/model sabit.
- 96 kapasiteli ok instance buffer artık yalnız Math.min(96,projectiles.length) kadar slot yazar. count aynı canlı prefix kuralı ile doğrudan update içinde korunur; zero-count upload yok, mevcut syncArmyArrowDrawCount yine etkin.
- QA yalnız test tarayıcısında ayrı armySim, armyVisual, siegeEquipment, siegeTowerRender süreleri ve armyVisualCpuPolicy sayaçlarını kaydeder. Üretim kodunda bu ölçüm sarıcıları yok. Gerçek GPU, 1% low/p99, görsel piksel ve 10 dk maç kabulü henüz açık. Testlerde gerçek r128 mesh matrisleri, ölme/geri canlanma, seed state değiştirme ve ok sırası kontrol edilir.

### OPT-07 ek görüş testi (yalnız QA)
- Önceki SwiftShader profilinde Meydan görünür asker sayısı 0/140 çıktı; oyuncunun kamera yönünün mü yoksa frustum hatasının mı neden olduğu doğrulanmadı. Yeni 3 harita x 2 çözünürlük profiline, ilk canlı askere kamera 12 birimden baktırılıp orijinal kamera state'i ölçüm öncesi geri yüklenen **gerçek oyun içi** culling testi eklendi. Bu yapay kamera duruşunda en az bir asker mutlaka görünmeli; aksi halde QA FAIL, performans kabulü engellenir. Bu teste kadar sıfır sonucu görsel hata kanıtı sayılmaz.
