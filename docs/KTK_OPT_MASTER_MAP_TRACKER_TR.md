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
