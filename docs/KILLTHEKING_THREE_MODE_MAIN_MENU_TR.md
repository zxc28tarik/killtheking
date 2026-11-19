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
