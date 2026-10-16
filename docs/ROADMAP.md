# KRUNKER 1600 — GELİŞTİRME YOL HARİTASI

**Temel sürüm:** Krunker1600_Serbest_Arena_Oyna.html / Serbest Arena v1  
**Hazırlanma tarihi:** 16 Ekim 2026  
**Amaç:** Krunker'a yakın mevcut grafik, kamera, hareket ve vuruş hissini koruyarak güçlü, tamamlanmış, önce tek oyunculu/botlu bir arena oyunu üretmek.  
**Kapsam durumu:** Plan, 4.255 satırlık mevcut `src/oyun.js`, kurtarma raporu ve en son Serbest Arena README bilgilerine dayalıdır. Yapılacaklar öneridir; tamamlanmış gibi gösterilmez.

## Değiştirilmeyecek ürün kararları

1. **Eski grafikler korunacak:** Son grafik dönüşümü geri alındı. Karakter, silah ve kale için izinsiz yeniden sanat yönü seçilmeyecek.
2. **Krunker hissi korunacak:** Hızlı hareket, slide-hop, FPS ve TPS seçeneği ve sade, hızlı okunabilen arayüz korunacak.
3. **Serbest arena korunacak:** Botlar birbirleriyle savaşır; hepsi oyuncuyu otomatik olarak hedeflemez. Normal hedeflemede oyuncuya yığılmayı önleyen kural vardır; karşılık verme istisnadır.
4. **Dört sınıf korunacak:** Şövalye, kargılı piyade, uzun yay okçusu, 1600 tüfekçisi. Denge ayarları ancak ölçümden sonra yapılır.
5. **Tek dosyalık HTML korunacak:** Geliştirici tarafında modüler kod üretilse bile çevrim dışı açılabilen bağımsız HTML çıktısı her kilometre taşında verilecek.
6. **Kaynak ve sürüm disiplini:** Her aşamada çalışan baz sürüm, sürüm farkları, testler ve geri dönüş noktası saklanacak.

## Kaynakta doğrulanan mevcut teknik durum

- Three.js r128, prosedürel dokular, shader ışıklandırma, üç atmosfer, kale, rampalar, jump pad ve patlayan/yenilenen fıçılar var.
- `CLASSES` içinde dört oyuncu sınıfı; `BOT_PROFILES` içinde sabit altı bot var.
- `performPrimaryAttack`, `releaseChargedBow`, `performQuickAbilityOrMelee`, `damageBot` ve `damageBotFromBot` dövüş akışını taşıyor.
- `chooseArenaTarget`, `arenaLineOfSight`, `arenaBotAttack` serbest arena yapay zekâsını taşıyor; hedef değerlendirmesi mesafe/kalabalık/karşılık verme temelli.
- Oyuncu çarpışması `resolvePlayerCollisions` ile hesaplanıyor. Bot hareketi ise çoğunlukla hedefe doğru konum ekliyor; gerçek engel çevresinden rota bulma ve botlar için oyuncuyla eşdeğer fizik bulunmuyor.
- Bot saldırıları kendi `range`, cooldown ve uzak sınıflar için görüş hattına dayanıyor; oyuncu saldırısındaki isabet/raycast modeliyle birleşik değil.
- Oyuncunun kılıç/tüfek raycast'i aktif bot mesh'lerine bakıyor; dünya geometrisinin ilk engel olarak tutarlı değerlendirilmesi için doğrulama/düzeltme gerekiyor.
- `matchTimeSeconds` 240 saniyeden sıfıra düşünce tekrar 240'a dönüyor; maç bitişi ve kazanan hesabı yok.
- Test paketi `node --check`, WebGL çizicisi taklit edilerek yapılan tarayıcı testleri, 30 saniyelik bot simülasyonu içeriyor. Gerçek GPU üstünde görsel/etkileşimli test henüz doğrulanmış değil.
- Oyun tek kapsamlı scriptte duruyor; ayrı geliştirici dosyalarına bölme uzun vadede hata riskini azaltacak.

## Aşama 0 — Taban sürümü koru ve gerçek test kapısı oluştur [P0]

**Tahmini emek: 2–4 geliştirici-günü.**

- Serbest Arena v1 için kaynak dosya kontrol toplamı, ZIP ve tek HTML'yi değişmez taban olarak sakla. Grafik referans ekranlarını kullanıcı onayıyla belirle.
- Oyun başlangıcı, 4 sınıf, 6 bot, menüden başlatma, FPS/TPS, kalkan, mızrak, yay, tüfek, ölme, tekrar doğma ve FFA davranışı için tekrar edilebilir testler yaz.
- Gerçek WebGL destekli Chrome/Edge'de smoke test hazırla; sahne çizildiğini, fare kilidini, sesi, kontrol ve performansı kontrol et.
- Hata yakalayıcı, debug HUD, seed'li test modu, bot hedef/HP/konum görünümü, temel FPS ve draw call telemetrisi ekle.
- Her geliştirme için `CHANGELOG`, işaretli baz sürüm, eski HTML ve geri alma noktası oluştur.

**Kabul:** 10 dakika gerçek oynanışta kritik hata yok; başlangıç, sınıflar, botlar ve ana döngü açılıyor; yenilemede bozuk nesne yok; testler otomatik çalışıyor. Bu sonuç gerçek GPU'da doğrulanana kadar yalnızca hedef sayılır.

## Aşama 1 — Çarpışma, hasar ve arena adaleti [P0]

**Tahmini emek: 4–7 gün.**

- Tek `DamageEvent` hattı kur: `attackerId`, `victimId`, `source`, `weapon`, `hitPoint`, `damage`, `critical`, `blocked`, `killCredit`; hasar, öldürme, HUD ve sesleri tek kaynaktan üret.
- Oyuncu kılıcı, tüfek ve yayında dünya geometrisinin rakibi engellemesini garanti et; raycast yakınlık kontrollerinin duvar arkasına vurma üretmesini engelle.
- Botların duvar ve sandık içinden geçmesini engelle; botlar arası çakışmayı çöz. Bot-bot ok/tüfek atışında görüş hattı ve isabet mantığını açık kur.
- Doğuş noktasının rakip/engel içinde kalmaması, spawn'da çok kısa güvenlik süresi ve spawn camping önlemi ekle.
- Barut fıçısı hasarında doğru öldürme kredisi, yakınlık ve taraf bağımsızlığı; zincirleme patlama opsiyonel ve ayrı test edilir.
- Sınıf değiştirme, reload, öldürme, respawn ve arena hedeflemelerinde geçersiz durumları önle.

**Kabul:** Test edilen duvar arkası isabet = 0; botların statik engel içinde kalması = 0; bot öldürmesi oyuncu skorunu artırmıyor; öldürme kredisinin kaynağı doğru; altı bot simülasyonunda kilitlenme ve konsol hatası yok.

## Aşama 2 — Arena yapay zekâsı 2.0 [P1]

**Tahmini emek: 6–10 gün.**

- Basit durum makinesi: `PATROL`, `SEEK`, `CHASE`, `ATTACK`, `KITE`, `DEFEND`, `RETREAT`, `RELOAD`, `RECOVER`, `RESPAWN`.
- Önce arena yol noktaları + bağlantılar; sonra gerekirse 2B grid/A* veya yüksekliğe göre bağlantılı navigation graph. Sur, rampa, avlu ve dar geçit ayrı düğümlerle işaretlenecek.
- Hedef puanlaması: görünürlük, gerçek ulaşılabilirlik, uzaklık, silah menzili, oyuncu/bot hedef yoğunluğu, son hasar, HP ve risk. Tek oyuncuya yığılma sınırı korunacak.
- Şövalye önden yaklaşma/kalkan; kargılı doğru mesafeyi koruma/hücum; okçu mesafe tutma/örtü; tüfekçi nişan/doldururken siper değiştirme.
- Zorluk, hileli hasar artışıyla değil tepki zamanı, karar sıklığı, isabet toleransı ve rota becerisiyle ayrılacak.
- 'Bütün botlar oyuncuya döndü' ve 'bot duvara doğru sonsuza dek koşuyor' problemleri için algılama ve toparlama kuralları.

**Kabul:** 10 farklı başlangıç tohumunda 2 dakikalık simülasyon; botlar arasında çatışma sürüyor, oyuncu sıradan hedef seçiminde tek av olmuyor, ulaşılmaz noktada uzun süre takılı kalan botlar toparlanıyor, saldırı ve savunma sınıfa göre farklı hissediliyor.

## Aşama 3 — Savaş mekanikleri 2.0 ve dört sınıfın dengesi [P1]

**Tahmini emek: 5–9 gün.**

- Kılıç: hazırlanma–aktif vuruş–toparlanma pencereleri; 2–3 birbirinden ayırt edilebilir saldırı; açısal menzil; geçerli vuruş penceresi; spam kontrolü.
- Kalkan: ön açıdan blok, zamanlamaya dayalı kısa parry penceresi, başarılı savuşturmada karşı saldırı fırsatı. Mevcut %75 azaltma varsayılanı ilk dengede korunup ölçülür.
- Kargı: nokta/uzunluk tabanlı isabet, minimum etkili mesafe, hız hasarı tavanı, geri itme dengesi.
- Yay: germe süresi, okun gerçek uçuşu, önceden nişan alma, uzaktan hasar ve kafa vuruşunun adil olması.
- Tüfek: ateşleme, geri tepme, tek mermi, barut doldurma pencereleri, süngü; yavaş ama etkili sınıf kimliği.
- Botlar da mümkün olduğunca ortak saldırı/hasar/savunma modelini kullanmalı; garantili anında hasar azaltılmalı.
- Etki tablosu: silah/menzil/kafa/gövde/kalkan/zırh/fıçı/öldürme durumları için veri temelli balans.

**Kabul:** Her sınıfla 10 dakikalık test oynanışı; duvar arkasından ve animasyon dışında isabet yok; dört sınıfın güçlü/zayıf yönleri net; hiçbir sınıfın tüm menzil ve karşılaşmalarda koşulsuz üstünlüğü yok.

## Aşama 4 — Hareket, animasyon ve vuruş hissi 2.0 [P1]

**Tahmini emek: 5–8 gün.**

- Eski model ve malzemeleri KORU; `createBotMesh` alt gruplarını kontrollü eklem animasyonları için kullan.
- Animasyon durumları: idle, walk/run, slide, turn, prepare/strike/recover, block/parry, reload, hit reaction, death, respawn.
- Ayak ritmi ve hareket hızı uyumu; zıplama/iniş geçişi; elin silahla temas sürekliliği; kılıcın isabet anında kamera/hitmarker/ses eşzamanlılığı.
- Birinci şahıs kamera sarsıntısı/weapon kick/hedef ekran geri bildirimi ölçülebilir ve ayrı ayrı ayarlanabilir olsun.
- `hitstop` global simülasyonu beklenmedik etkilemesin; yalnız hedeflenen kısa vurgu mekanizması uygulansın.

**Kabul:** Yürüme ve saldırı sırasında eklem kopması, silahın elden ayrılması ve animasyon sıçraması yok; darbe geri bildirimleri silah sınıfına göre farklı; normal FPS hareket akıcılığı bozulmuyor.

## Aşama 5 — Maç, oyun modu ve arayüz döngüsü [P1]

**Tahmini emek: 4–7 gün.**

- Oyun durumları: `MENU`, `COUNTDOWN`, `PLAYING`, `PAUSED`, `RESULTS`, `RESTART`.
- 240 saniye sonunda otomatik sıfırlamak yerine gerçek maç sonuç ekranı. Öldürmeler, ölümler, K/D, seri, bot skorları ve kazanan gösterilsin.
- Mod 1: mevcut herkes tek; Mod 2: takım savaşı. Aynı takım üyelerine saldırmama, dost ateşi ve takım bot kararları ayrı kurallara bağlı.
- Süre/puan hedefi, zorluk, bot sayısı (önce 6; sonra performansa göre 8/12), atmosfer ve harita seçimi.
- Duraklatma, ayarlar, kontrol gösterimi, fare hassasiyeti, ses düzeyi; yeniden başlatma ve sonuçtan menüye dönüş.
- Gerekiyorsa seyirci kamerası ve öldürme sonrası kısa tekrar görüntüsü ikinci iterasyona ayrılır.

**Kabul:** Zaman bitince maç sonuçlanıyor, skorlar doğru, oyun yeniden başlatılabiliyor; aynı takım üyeleri ayara uygun davranıyor; eski FFA modu aynen seçilebiliyor.

## Aşama 6 — Harita, çevresel etkileşimler ve içerik [P1/P2]

**Tahmini emek: 6–12 gün (ilk yeni harita); her ilave harita ayrıca değerlendirilir.**

- İlk kale haritasını oyun akışına göre düzenle: çatışma bölgeleri, yüksekliğin risk/ödülü, pusu açıları, üç rota, doğuş güvenliği.
- Çevre bileşenleri: açılıp kapanan kapılar, kule noktaları, kullanılabilir/tehlikeli kuşatma ögeleri, basit yıkılabilir engeller, fıçı varyasyonları.
- İkinci küçük harita için seçenekler: küçük şehir meydanı, liman tabyası, kale içi. Her harita için bot navigation ve spawn noktaları validasyonu.
- Haritaları veri tanımıyla kur; prosedürel dokular ve mevcut köşeli grafik üslubu korunsun.

**Kabul:** Birinci haritada en az üç anlamlı çatışma güzergâhı; yeni haritada botlar aynı fizik/navigasyon kurallarıyla savaşabiliyor; oyuncu engellere takılmıyor ve tek güvenli pusu noktası oyun dengesini bozmuyor.

## Aşama 7 — Ses, görsel okunabilirlik ve erişilebilirlik [P2]

**Tahmini emek: 4–7 gün.**

- Var olan Web Audio üreticisini silaha, vurulan yüzeye ve uzaklığa göre ses varyasyonlarıyla genişlet; kılıç/zırh/tahta/taş ve barut farklı duyulsun.
- 3B konumsal ses, işitsel tehdit yönü, mesafeye göre ses azalması; aynı anda yüksek sayıda sesin sınırlanması.
- Okunabilir hitmarker, hasar sayısı, vuruş yönü göstergesi, sağlık barları ve kimin kimi vurduğu.
- Grafik tarzına dokunmadan UI tutarlılığı; renk körlüğü dostu hedef rengi, kamera sarsıntısını azaltma, ses kaydırıcıları.

**Kabul:** Ses kaynağının yönü anlaşılabiliyor; gereksiz efekt yığılması yok; isabet, ölüm ve kalkan durumları okunaklı; grafik stili aynı.

## Aşama 8 — Performans, güvenilirlik ve kalite güvencesi [P0/P2, sürekli]

**Tahmini emek: 7–12 gün; her kilometre taşında ayrıca yapılır.**

- Ölçüm: ortalama FPS, 1% low, kare süresi, draw calls, geometriler, dokular, bellek, bot karar maliyeti.
- Özellikle döngüdeki geçici Vector3/Geometry/Material/particle yaratımlarını profille; nesne havuzlama ve paylaşılan geometri/malzeme kullanımını uygula.
- Görünmeyen bot/prop etiketlerini azalt, uzak bot animasyon sıklığını düşür, gölge uzaklığını kalite seçeneğine bağla.
- 6 → 8 → 12 → 16 bot kademeleri yalnız test ölçümleri izin verirse açılır; sayı artışı kabul edilmiş özellik değil, performans hedefidir.
- Gerekirse Three.js güncellemesini ayrı uyumluluk dalında dene; renderer davranışını değiştirmeden körlemesine yükseltme yapma.
- Chrome/Edge gerçek WebGL, farklı çözünürlükler, yeniden boyutlandırma, sekme odak değişimi, oyun bitişi, sık ölüm/respawn, aralıksız 20–30 dakikalık test.

**Kabul:** Referans olarak tanımlanan test bilgisayarında seçilen çözünürlük ve kalite seviyesinde hedef FPS; uzun testte geometrilerin ve belleğin sınırsız yükselmemesi; otomatik testlerin ve gerçek oynanış kontrollerinin geçmesi.

## Aşama 9 — Paketleme ve ilk tamamlanmış sürüm [P1]

**Tahmini emek: 3–5 gün.**

- Geliştirici tarafında kaynakları parçalara ayır: `core`, `config`, `player`, `combat`, `ai`, `world`, `render`, `audio`, `ui`, `tests`.
- Bir derleme adımıyla hem geliştirici klasörü hem internetsiz çalışabilen tek HTML üret.
- Test, değişiklik günlüğü, kurtarılan orijinal, güncel sürüm, paket hash ve geri alma kılavuzu pakette bulunsun.
- Hedef teslim: 4 oynanabilir sınıf; zeki 6–12 bot (ölçümlere bağlı); FFA ve takım savaşı; 1 iyi cilalanmış kale + 1 yeni küçük harita; 2–3 atmosfer; sonuç ekranı, ayarlar ve performans seçenekleri.
- Çevrim içi çok oyunculu destek ilk tamamlanmış çevrim dışı sürüm için zorunlu değildir.

**Kabul:** Temiz kurulum gerektirmeden yerel HTML Chrome/Edge'de açılıyor; 30 dakikalık testte kritik hata yok; dosyalar ayrıştırılıp yeniden paketlenebiliyor; aynı eski grafik yönü korunuyor.

## Ayrı genişleme — Gerçek çevrim içi çok oyunculu [P3, opsiyonel]

- İstemci–sunucu mimarisi, sunucu otoriteli hasar ve hareket, kimlik, bağlantı kararlılığı, gecikme telafisi, sunucu doğrulaması, eşleştirme/lobi, maliyet, güvenlik.
- Önce 2–4 gerçek oyunculu özel oda; ardından 8–12 oyunculu sunucu yük denemesi.
- WebSocket + sunucuda sabit güncelleme adımı ve state senkronizasyonu örnek bir yol, mimari seçim kesin değil.
- Süre ayrı projelendirilmelidir (kabaca ilave haftalar/aylar); mevcut altı botlu prototip, çevrim içi altyapı anlamına gelmez.

## Mühendislik iş paketleri — kod fonksiyonları ile eşleme

| Mevcut kod | İlk değişiklik | Bağımlılık |
|---|---|---|
| `CLASSES` | Ayrı ayar dosyası, hesaplama testleri | Aşama 0 |
| `damageBot`, `damageBotFromBot` | Birleşik hasar/öldürme olayı | Aşama 1 |
| `chooseArenaTarget`, `arenaBotAttack` | Karar durumu, erişilebilirlik, isabet | Aşama 1–2 |
| `arenaLineOfSight` | Görüş + gerçek isabet/engel kontrolü | Aşama 1 |
| `resolvePlayerCollisions` | Botlarla tutarlı çarpışma ve navigasyon bağlantısı | Aşama 1–2 |
| `performPrimaryAttack` | Vuruş penceresi, dünya çarpışma kontrolü | Aşama 1–3 |
| `releaseChargedBow` | Ok fiziği/çarpışma/balans testi | Aşama 3 |
| `createBotMesh`, `buildViewmodels` | Eski mesh'lere animasyon kontrol katmanı | Aşama 4 |
| `updateGame`, `animate` | Sistemlere böl, zaman adımı ve profil ölçümü | Aşama 0, 8, 9 |
| `matchTimeSeconds` | Maç bitişi ve restart | Aşama 5 |
| `spawnBots` | Dinamik/konfigüre bot havuzu | Aşama 5, 8 |
| `SoundFX` | Ses varyasyonu, miksaj ve konumsal ses | Aşama 7 |
| `buildCastleArena` | Modüler harita ve nav noktaları | Aşama 6 |

## İlk uygulanacak 12 görev (yapılabilir sıralama)

1. En son çalışan sürümü ve önceki grafik+impact tabanını sabitle.
2. Gerçek WebGL oynanışı için kısa kontrol listesi ve tanılama hazırlığı yap.
3. Rastgeleliği kontrollü hale getiren test tohumu, debug/HUD ve otomatik regresyon testleri ekle.
4. Hasar ve öldürme kredilerini ortak bir `DamageEvent` sistemine taşı.
5. Duvar arkası vuruş ve botların içinden geçme hatalarını gider.
6. Botlar için waypoint tabanlı ilk navigasyon ve sıkışma kurtarma uygula.
7. Botların saldırı/geri çekilme/yeniden hedefleme durumlarını ayır.
8. Kılıç/kalkan parry ve gerçek vuruş penceresini ekle.
9. Yay/kargı/tüfek animasyon ve hasar dengesi testlerini uygula.
10. Maç sonu ekranı ve FFA skor tablosunu tamamla.
11. 6/8/12 bot stres testini yapıp performansa göre aç/kapat.
12. Yeni özellikli HTML, kaynak ZIP, changelog ve test raporunu teslim et.

## Yaklaşık zaman ve ürün kilometre taşları

Bunlar **tek geliştirici veya insan denetimli AI-yardımlı geliştirme için kaba iş günü aralıklarıdır**, garanti değildir; gerçek WebGL testi ve oyun hissi iterasyonları süreyi uzatabilir.

| Milestone | Faz | Tahmin | Teslim |
|---|---|---:|---|
| M0 Güvenilir temel | 0–1 | 6–11 gün | Test, isabet ve fizik güvenilir |
| M1 Savaş çekirdeği | 2–3 | 11–19 gün | Zeki bot + daha iyi dövüş |
| M2 Oyuncu hissi | 4–5 | 9–15 gün | Animasyon, maç sistemi, FFA/Team |
| M3 İçerik ve cila | 6–7 | 10–19 gün | Yeni harita, ses, HUD |
| M4 Optimize ve teslim | 8–9 | 10–17 gün | Performans doğrulaması, sürüm paketi |

**Toplam kabaca 46–81 geliştirici-günü:** Bu, test edilen makine, kapsam ve kalite beklentisine göre yaklaşık 9–16 tam zamanlı hafta ölçeğidir. İşler paralelleşebilse de temel sistem bağımlılıkları nedeniyle salt ajan sayısıyla doğrusal hızlanmaz. Gerçek çok oyunculu bu tahmine dahil değildir.

## Kabul kapıları ve proje disiplini

- Her sürüm: aynı eski grafik kimliği, sınıf seçimi, oyuncu kontrolleri, dört silahın işlevi ve bot-bot dövüşü korunmalı.
- Her değişiklik: kod diff'i, JS testleri, en az bir otomatik simülasyon, mümkünse gerçek GPU smoke test, kısa değişiklik notu.
- Oyunu bozan özellik önce kapatılır/geri alınır; çalışır sürüm korunur.
- Özellikle kullanıcı onayı gerektiren kararlar: yeni sınıf, grafik stilinin değişmesi, temel hareket hızının kökten değiştirilmesi, bot sayısı artışını varsayılan yapmak, gerçek çevrim içi sunucu kurmak.

## Başlangıç önerisi

**Hemen M0** ile başla: tabanı sabitle; WebGL smoke test, ortak hasar olayı, duvar arkasından vuruş ve botların engelden geçme sorununu çöz. Ardından M1'in ilk adımı olan bot navigasyonunu aç. İlk teslimde büyük grafik değişikliği veya yeni harita ekleme.