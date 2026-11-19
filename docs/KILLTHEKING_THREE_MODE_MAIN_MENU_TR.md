# Kill the King — Üçüncü Oyun Modu: Kale Kuşatması

**Tarih:** 19 Kasım 2026  
**Kaynak dalı:** `codex/s1-siege-castle-phase1`  
**PR:** [#50, DRAFT](https://github.com/zxc28tarik/killtheking/pull/50). `main` ve özgün FFA/G5.4 kaynakları değiştirilmedi. **Merge/yayın onayı yoktur.**

## Kullanıcının kesin hedefi

**Kale Kuşatması ayrı bir oyun değil; Kill the King'in Arena ve Ordu Savaşı'ndan sonra ÜÇÜNCÜ oyun modudur.** Bu sözleşme sonraki çalışmalarda korunmalıdır:

1. **Serbest Arena / TDM:** Eski FFA modu, dört sınıf, kale/çimenlik meydan, orijinal A5 oynanışı, kullanıcı kararına göre yalnız arena **BOT okçusu** 0,5 saniyelik germe; normal oyuncu yayı 2 saniye minimum, 3 saniyede tam germe, 4 saniyede bir ok ve 1 saniye toparlanma.
2. **140 Askerli Ordu Savaşı:** Mevcut kurtarılmış G5.4 70 mavi / 70 kırmızı ve komuta/formasyon sistemi; mevcut ordu oyunu korunur.
3. **Kale Kuşatması:** Aynı **ana menüden** seçilir; 70 kırmızı hücumcu, 70 mavi savunmacı, gerçek askerle kale kapısı kırma, iki merdiven yapma/surdan inme, avlu/iç kale ele geçirme, S3D1 FPS/TPS oyuncu (100 gerçek G5.4 HP, dört zemin silahı). Önceki modları bozmaz.

## Bu adımda gerçekten yapılan

- **`recovered/army/integration/build_three_mode_launcher.mjs`**: Mevcut kabul adayı `build_isolated_launcher.mjs` tarafından üretilen orijinal **iki modlu** FFA+Ordu HTML ve gerçek S3D1 `build_siege_player_candidate.mjs` HTML'sini alıp **tek çevrim dışı üç modlu HTML** içinde paketler. FFA ve Ordu'nun özgün kaynakları **bayt olarak** korunur; kuşatma da kendi 15 scriptli adayının **baytları korunarak** eklenir.
- Ana menüde **`⚔ SERBEST ARENA/TDM`**, **`🛡 140 ASKERLİ ORDU SAVAŞI`** ve **`🏰 KALE KUŞATMASI`** düğmeleri bulunur. Üçü de aynı `#stage` alanında açılır, üst menü ve açılış sayfası ortaktır.
- Mod değiştirilince açık maçın biteceği konusunda **onay** istenir; eski iframe tamamen kaldırılır, yeni mod kendi bağımsız çalışma ortamında sıfırdan başlar. Kullanıcının yanlışlıkla diğer modu seçmesi maçı bozmamalı; iptal halinde eski maç devam etmelidir.
- Çevrim dışı çalışır: kaynak HTML'ler tek dosyada base64/UTF-8 **pasif** saklanır, ilgili oyun yalnız o mod seçilince açılır. Dış JavaScript veya internet indirmesi gerekmez; Chrome/Edge'de yerel HTML olarak açılır.
- **`test_three_mode_launcher.mjs`** gerçek açılış denetleyicisinin üç modunu, içerik eşitliğini, üçüncü tuşu, mod değiştirmede önceki çerçevenin temizlenmesini, iptal ve çift tıklama durumlarını doğrular.
- **`browser_three_mode_smoke.mjs`** gerçek Chromium/SwiftShader ile üçünü art arda açar: Arena'nın **6 botlu gerçek oynanışı**, Ordu'nun gerçek WebGL 140 kişilik seçili modu, Kale Kuşatması'nın gerçek **140 G5.4 askeri, 100 HP ve FPS oyuncusu**, en sonunda kuşatmadan Arena'ya sorunsuz dönüş. Sayfa ve konsol JavaScript hata sayısı sıfırdır.
- Geriye dönük orijinal mod testi + S3D1 gerçek savaş testi aynı CI içinde korunur. **İçerik değiştirilmiş veya adı kuşatma olup gerçek 140 askeri olmayan sahte bir HTML derleme kapısından geçemez.**

## Başarılı CI / indirilebilir tek HTML

- [**Üç modlu tek HTML CI #44524696649 — source + browser iki iş SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44524696649).
- **34/34 Node testi PASS:** 7 yeni üç modlu menü testi, 7 eski iki modlu paket testi, 5 mevcut iki modlu çalışma/iptal testi, 15 S3D1 gerçek oyuncu kaynak testi. (S3C3'ün 97 regresyonu önceki S3D1 ayrı CI ile doğrulanmıştı.)
- **Chromium PASS:** `PASS_MAIN_GAME_BOOT_THREE_CHOICES_ONE_HTML`; `PASS_ORIGINAL_FFA_NATIVE_CHROMIUM_GAME_RUNNING` (6 bot); `PASS_ORIGINAL_140_ARMY_CHROMIUM_MODE_STILL_PLAYABLE`; `PASS_THIRD_SIEGE_REAL_140_AI_GATE_LADDERS_KEEP_100HP_3D`; `PASS_THIRD_MODE_ACTUAL_FPS_HUMAN_AND_NO_FAKE_VICTORY_BUTTONS`; `PASS_SIEGE_TO_FFA_RETURN_CLEANS_UP_IFRAME`. `pageErrors=[]`, `consoleErrors=[]`.
- **Headless sınırlama:** Eski FFA pointer-lock, Chromium yazılım render'ında ESC'den sonra kilitli kalabildiği için önceki iki modlu testtekiyle aynı test-özel `exitPointerLock` adımı gerekmiştir. **Kullanıcının Windows ESC/pointer-lock manuel kabulü açık**; bu bir sahte oyun düğmesi veya oyun kodu değişikliği değildir.
- [**İndirilebilir üç modlu tek HTML dosyası, Actions artifact #14528493467**](https://github.com/zxc28tarik/killtheking/actions/runs/44524696649/artifacts/14528493467).
  - Dosya: `KillTheKing_3_Mod_Arena_Ordu_Kusatma_Oyna.html`
  - **4.258.277 byte** HTML, SHA-256: `5fcd3f11076414cc23f2cc7201ef6cbe406c86149ccf9ccdd646c59735039685`
  - İçinde tek HTML, ayrıca `.build.json` manifest bulunur.
- [**Chromium gerçek ekran görüntüleri ve JSON, artifact #14529872113**](https://github.com/zxc28tarik/killtheking/actions/runs/44524696649/artifacts/14529872113).

## Önemli: üç modlu ana menü tamam, görsel/oynanış eşitliği henüz değil

Bu güncelleme **tek ürünün üçüncü seçilebilir savaş modu** koşulunu gerçekleştirir. Ancak bunun **tek birleşik render motoru / aynı karakter kontrolü / aynı estetik** anlamına geldiği söylenemez. Tarihî FFA ve G5.4 modlarının ayrı WebGL oyunları var; S3D1 Kuşatma sahnesi de ayrı Three.js belge ve daha sade asker modellerini kullanıyor. Üçü aynı HTML ve menü içindedir, fakat **yalnız oyun çalışma ortamları izoledir**.

**Şimdi yapılması gerekenler:**
- [x] Ana menüde tam üç mod; FFA ve ordu korunur; kuşatma ayrı oyuna bağlantı değil, aynı HTML'nin üçüncü ekranı.
- [x] Gerçek Chromium'da üçü de açılır, önceki sahne atılır, sonrasında FFA'ya dönülür.
- [x] Üç mod kaynak SHA ile kayıtlı, sistemler birbirinin kodunu değiştirmez.
- [ ] **Görsel/parite entegrasyonu:** Kuşatmada **Arena/Ordu model, animasyon, kamera ve HUD** görünümünü ortaklaştır; kale hedeflerini koru. Kullanıcının “kale kuşatması niye diğer ikisinden farklı” itirazını çözecek asıl adım budur.
- [ ] **Ortak FPS karakter/parite:** FFA gerçek zıplama/kayma/nişan/ölüm/respawn ve gerçek 3B ok/mermi/hitbox fiziklerinin uygun, testli ortak kuşatma uyarlaması (S3D2).
- [ ] **S4 Savunma AI:** Mavi ordunun kalenin iç kısmını boş bırakması, sur okçu/tüfekçi savunması, kılıç/mızrak rezerv kuvvetleri ve anti-sıkışma.
- [ ] **Kalıcı ayarlar / ortak UI / gerçek modlar arası kayıt:** Kullanıcı tasarım onayı gerektiren özellikler.
- [ ] **S5/S6:** Windows GPU, gerçek ESC/pointer-lock, 30 dakika stres, 140 asker sahnesi ve son oyuncu kabulü.
- [ ] **Birleştirme/yayın:** Kullanıcı açık onayı olmadan `main` merge, release veya denge sabitleme YOK.

**Oyun sözleşmesi:** Bundan sonra ayrı bağımsız Kale Kuşatması oyunu yapılmayacak; bütün kuşatma geliştirmeleri ana Kill the King'in **ÜÇÜNCÜ MODUNU** iyileştirecek. Kaynak izole tutulabilir, ancak kullanıcıya tek oyun/tek menü teslim edilmelidir.


### S3V1 görsel yakınlaştırma adayı (19 Kasım)

Kuşatma S3D1'in 140 gerçek asker görüntüsü, Arena'nın sınıf/zırh/silah siluetine benzer **sınıfa özgü parçalı InstancedMesh** katmanına taşınıyor. Bu, Arena'daki özgün yüksek detaylı modelin birebir taşınması veya FPS ortak motoru **değil**. Üç mod aynı menüyle açılmaya devam eder; eski Arena ve G5.4 ordu kaynaklarına dokunulmaz. Gerçek Chromium ve oyuncu kabulü tamamlanmadan görsel parite onayı verilmez.

### S3D2a — Arena tarzı kale hareketi (19 Kasım 2026)

Yalnız üçüncü modda Space zıplama, Shift/C kayma ve sınırlı slide-hop eklendi. Bu özgün FFA fizik/renderer kaynaklarını değiştirmez ve aynı motorun birebir paylaşımı anlamına gelmez. Oyun motorları izole kalır. Kuşatmanın fiziksel kale kapısı/duvarları ile 140 gerçek G5.4 askeri ve zemin savaş dengesi korunur. Havada ve sur yüksekliğinde gerçek 3B ok/kurşun balistiği halen yapılmadı; S3D2'nin sonraki alt aşamasına aittir. Kullanıcı kabulü sonrası birleştirme yapılacaktır.


**S3D2a doğrulaması (19 Kasım):** [Üç modlu CI #44532599418](https://github.com/zxc28tarik/killtheking/actions/runs/44532599418) iki iş **SUCCESS**: üç modlu paket + gerçek Chromium/SwiftShader 140 asker, Space zıplama (1 gerçek keydown, havalanma, iniş), Shift kayma ve Arena'ya dönüş. `pageErrors=[]`, `consoleErrors=[]`. 7 yeni/eski menü + 7 eski iki-mod + 5 runtime + 15 canlı HP + 3 sınıf görsel + **8/8 yeni hareket testi** = **45/45 test PASS**. [Birleşik HTML artifact #14533937466](https://github.com/zxc28tarik/killtheking/actions/runs/44532599418/artifacts/14533937466); ekran görüntüleri [#14533443427](https://github.com/zxc28tarik/killtheking/actions/runs/44532599418/artifacts/14533443427). Fiziksel Windows GPU/manuel FPS hissi kabulü açık; orijinal FFA tam hareket motoru ve 3B balistik paylaşılmıyor.



### S3D2b — Üçüncü mod FPS silahları ve gerçek savaş geri bildirimi

Kuşatmada kılıç/mızrak/yay/tüfek için kameraya bağlı ilk şahıs Three.js modelleri, gerçek G5.4 atış olayına göre kozmetik geri tepme, **pozitif gerçek hasar** halinde isabet işareti ve **gerçek HP düşüşü** halinde hasar uyarısı eklendi. Orijinal Arena'nın mesh'i aynen taşınmadı; bu yeni çizimler görsel entegrasyona ilk adımdır. Üç modlu çevrimdışı tek HTML korunur, FFA ve Ordu gerçek motoru değiştirilmez; 3B balistik ve tam FPS/TPS uyumu henüz tamamlanmamıştır.


**S3D2b son doğrulama — 19 Kasım 2026:** [Üç modlu CI #44534271432](https://github.com/zxc28tarik/killtheking/actions/runs/44534271432) **SUCCESS** (paket kaynak testleri + gerçek Chromium/SwiftShader). İlk şahıs dört 3B silah modeli, FPS kılıç ve tüfek kamera görselleri, S3D2a zıplama/kayma, 140 asker, modlar arası dönüş ve gerçek motor kaynak sınırları PASS. Chromium `pageErrors=[]`, `consoleErrors=[]`. S3D2b altı yeni unit testiyle önceki 45 test birlikte **51/51 Node PASS**. Ayrıca [ayrı S3D1 Chromium/silah kabulü #44534221465](https://github.com/zxc28tarik/killtheking/actions/runs/44534221465) SUCCESS. [Tek HTML artifact #14534499256](https://github.com/zxc28tarik/killtheking/actions/runs/44534271432/artifacts/14534499256); [görsel ekran görüntüleri #14535028178](https://github.com/zxc28tarik/killtheking/actions/runs/44534271432/artifacts/14535028178). Windows fiziksel GPU, oyuncu kabulü, özgün FFA tam mesh/fizik paylaşımı, gerçek 3B atış fiziği ve S4 mavi kale AI **AÇIK**.



### S3D2c — 3B oyuncu menzilli atışı (19 Kasım 2026)

- [x] Gerçek 140 G5.4 askerin canlı x/z/siegeY konumları ve S1 kale kapı/duvar/çatı AABB yüzeyleri kullanılarak ilk 3B temas bulunur. Dost asker ve taş duvar atışı keser.
- [x] Tüfek: anlık 3B ilk temas. Yay: 70m/s başlangıç hızı, 22m/s² yerçekimi, gerçek uçuş zamanı ve okun Three.js sahnede görünümü. G5.4 orijinal hasar/öldürme yetkisi ve onaylı kadans korunur.
- [x] E ile kurulu merdivene çıkınca S3D2c oyuncusu sur tepesindeki güvenli konuma varır; yalnız S3D1/üç modlu aday bu opsiyonu kullanır. Eski S2 prototipi ve ordu merdiven AI korunur.
- [x] 13/13 yeni 3B atış testi, toplam 64/64 üç modlu kaynak testi ve gerçek Chromium/SwiftShader PASS. [CI #44537068976](https://github.com/zxc28tarik/killtheking/actions/runs/44537068976); console/page hata sayısı 0. [Ayrı S3D1 Chromium #44536988594](https://github.com/zxc28tarik/killtheking/actions/runs/44536988594) PASS.
- [x] [Üç modlu çevrimdışı HTML #14535847718](https://github.com/zxc28tarik/killtheking/actions/runs/44537068976/artifacts/14535847718); [Chromium ekran görüntüleri #14536752123](https://github.com/zxc28tarik/killtheking/actions/runs/44537068976/artifacts/14536752123).
- [ ] ÖNEMLİ SINIR: Yalnız oyuncu menzilli balistiği gerçek 3B. G5.4 asker AI'sının kendi nişanı/yer düzlemi hâlâ tam 3B değil; oyuncuya sur üzerinden adil 3B karşı ateş sonraki aşama. FFA ortak motoru/animasyonu, gerçek Windows GPU ve S4 savunma AI tamamlanmadı.


### S4A — Gerçek G5.4 mavi kale savunma koordinasyonu (19 Kasım 2026)

- [x] Savunan 70 mavi askerin sınıf odaklı mevzi koordinasyonu: kılıç/mızrak **kapı ve geçit ön hattı**, okçu/tüfek **arka destek hattı**; gerçek konum/rol ve özgün G5.4 sınıf hızları kullanılır.
- [x] G5.4 yaşayan kırmızı askerler gerçek kapı/merdiven geçişiyle iç avluya girdiğinde savunma avlu hattına, S1 gerçek KEEP fazında iç kale hattına geçer. Bu kararlar **hasar, asker ölümü, faz veya bölge varlığı üretmez**.
- [x] Yakın düşmanla doğrudan çarpışmayı eski G5.4 AI'ya bırakır; oyuncunun kontrol ettiği mavi bölük için koruma vardır. Yeni mevzilere gidiş gerçek kale süpürmeli çarpışmasından geçer, asker ışınlaması/yeniden doğurma yoktur.
- [x] S4A yalnız yeni S3D1/üç modlu HTML derlemesine **opt-in**; eski 2-mod, S1/S2, S3C3 doğal zafer regresyonu ve özgün G5.4 kaynağı ayrı kalır.
- [x] 9 yeni Node testi **PASS**; önceki 64 ile beraber **73/73**. İlk S4A [kaynak ve bağımsız Kuşatma Chromium koşusu #44540582382](https://github.com/zxc28tarik/killtheking/actions/runs/44540582382) SUCCESS. Birleşik üç modlu tarayıcı kabulü ve güncel HTML artifact son kontrolleri ayrı izleniyor.
- [ ] S4B: **gerçek 3B sur okçu/tüfekçi yerleşimi, 3B yükseklikli karşı ateş ve şiddetli kuşatma savunması** henüz yapılmadı; G5.4 bot atışı hâlâ zemin düzlemi üzerinde. Windows gerçek GPU ve kullanıcı oynanış testi de açık. S4A bir başlangıçtır, tam S4 tamamlandı iddiası değildir.


**S4A son doğrulama — 19 Kasım 2026:** [Üç modlu HTML üretim + gerçek Chromium/SwiftShader CI #44540884900](https://github.com/zxc28tarik/killtheking/actions/runs/44540884900) **SUCCESS / SUCCESS**; `PASS_S4A_AUTHENTIC_BLUE_GROUND_DEFENSE_ROLES_OPT_IN`, `PASS_THREE_MODES_ONE_OFFLINE_HTML_CHROMIUM_SOURCE_ISOLATED`, `pageErrors=[]`, `consoleErrors=[]`. 9 yeni S4A regresyonu ile toplam 73/73 Node testi PASS. [S4A son bağımsız S3D1 Chromium #44540885295](https://github.com/zxc28tarik/killtheking/actions/runs/44540885295) SUCCESS. Güncel [üç modlu HTML ZIP artifact #14537572739](https://github.com/zxc28tarik/killtheking/actions/runs/44540884900/artifacts/14537572739) ve [görsel kanıt artifact #14538956288](https://github.com/zxc28tarik/killtheking/actions/runs/44540884900/artifacts/14538956288). S4B yüksek sur bot atışları, fiziksel GPU, oynanış ve PR merge kullanıcı onayına açık.



### S4B1 — Gerçek mavi sur okçu/tüfekçileri ve 3B karşı ateş (19 Kasım 2026)

- [x] **8 gerçek G5.4 asker (4 okçu + 4 tüfekçi)** kendi orijinal kimlikleri ve HP'leriyle savaşın başlangıcında güney surundaki geçerli 13,035 m yüksekliğindeki taş mevzilere yerleştirildi. Oyunun ortasında rastgele ışınlama veya yapay asker üretimi yok; 140 asker / 8 bölük değişmedi.
- [x] Sadece bu sur askerleri için eski G5.4'ün yanlış yükseklikteki **zemin düzlemi atışları bastırıldı**. Asıl bot nişanına kuşatmaya özgü ilk 3B kale/asker teması, dost gövde engellemesi ve gerçek S1 kapı/duvar yüzeyleri eklendi.
- [x] Tüfek 15 sn, ok 4 sn özgün kadansı ve onaylı silah hasarı; ok için 70 m/s uçuş ve 22 m/s² yerçekimi. İsabet hasarı yalnız özgün G5.4 damageSoldier (attackerId, zone, weapon) üzerinden yazılır. Oklar gerçek sahnede render edilir.
- [x] S4A kara savunma sınıf koordinasyonu devam eder; oyuncunun mavi bölüğüne müdahale edilmez. Eski S3C3 doğal kuşatma ve özgün G5.4 motor SHA kontrolleri değişmedi.
- [x] **9/9 yeni S4B1 + önceki 73 = 82/82 Node test PASS.** [Üç modlu paketleme + gerçek Chromium/SwiftShader #44542792405](https://github.com/zxc28tarik/killtheking/actions/runs/44542792405) iki iş SUCCESS, üç mod arasında dönüş PASS, pageErrors 0, consoleErrors 0. [Bağımsız S3D1 Chromium #44542792171](https://github.com/zxc28tarik/killtheking/actions/runs/44542792171) SUCCESS.
- [x] Güncel [tek çevrimdışı üç modlu HTML #14537914019](https://github.com/zxc28tarik/killtheking/actions/runs/44542792405/artifacts/14537914019); [gerçek Chromium görsel kanıtları #14538603903](https://github.com/zxc28tarik/killtheking/actions/runs/44542792405/artifacts/14538603903).
- [ ] **S4B2 — Açık:** Surdaki botların gerçek oyuncuya 3B atışı, red botların yüksekteki mavi surcuları adil biçimde hedeflemesi, surdan geri çekilme/iniş, savaş hatlarının taktiksel yeniden dağılımı. G5.4 özgün 2B AI ile tam eşitlik veya fiziksel Windows GPU kabulü iddiası YOK. Ana oyun PR #50 birleştirme / yayın hâlâ kullanıcı onayında.
