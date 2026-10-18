# KILL THE KING — AKTİF YAPILACAKLAR VE UYGULAMA PLANI

**Güncelleme:** 17 Ekim 2026  
**Ana depo:** zxc28tarik/killtheking  
**Güncel doğrulanan main:** 78f5df889cf0832b47133c73f85ef017be304fb8  
**Temel main testi:** 175/175 PASS (PR #26 sonrası), derlenebilir offline HTML. **PR #29 geliştirme dalı:** 203/203 Node testi PASS ve offline paket başarıyla oluşturuldu. Bu branch sonucu main veya gerçek GPU kabulü değildir.  
**Bu belge yaşayan uygulama planıdır.** Eski docs/ROADMAP.md ürün kapsamını açıklar; buradaki ilerleme işaretleri ve öncelikler güncel uygulama durumunu gösterir.

## Sabit ürün kuralları

- [x] Kabul edilmiş **eski Krunker tarzı** grafik, kale, karakter ve silah modelleri korunacak. Yeni sanat yönü kullanıcı onayı olmadan uygulanmayacak.
- [x] **Hızlı FPS + TPS, bunny-hop/slide-hop** ve hareket hissi korunacak.
- [x] **Dört sınıf** korunacak: şövalye, kargılı, okçu, 1600 tüfekçisi. Hasar/hız değerleri ölçüm olmadan kökten değiştirilmez.
- [x] Varsayılan **FFA**: oyuncu + birbirlerine de saldıran 6 bağımsız bot. Botların yalnız oyuncuyu hedeflemesine geri dönülmez.
- [x] Her kabul edilmiş PR için test, GitHub CI, değişiklik kanıtı ve **tek, çevrim dışı açılabilen HTML** paketi üretilecek.
- [ ] Yeni varsayılan bot sayısı, yeni harita teması, temel oynanış değişiklikleri veya çevrim içi çok oyunculu için kullanıcı kararı alınacak.

## Kabul edilmiş mevcut altyapı — yeniden geliştirme yapma

- [x] **P0 harita kararlılığı kabul edildi.** Duvar/sur hızlı çarpışmaları, 4 rampa yan girişleri, bot geri itmesi, 3 topun collider/raycast'i; issue #23 kapandı.
- [x] A* kale/avlu/sur navigasyonu, 90 rota eşleşmesi ve sınıfa özel bot taktikleri uygulanmış.
- [x] Combat 2.0: kalkan/parry, kılıç/mızrak animasyonlu temas, birinci şahısta görünür silah uç/kabza yönlendirmesi ve duvar/fıçı ilk temas kontrolleri uygulanmış.
- [x] Animasyon 2.0 temeli: bot ile TPS oyuncuda mesafe temelli yürüme; kalkan, saldırı, zıplama, kayma, darbe/ölüm pozları.
- [x] **P1 Maç Sistemi 1.0 kodu (PR #26):** 240 saniyede FFA maç sonu, 7 katılımcı sıralaması, kazanan, sonuç ekranı, tekrar oyna ve ana menü. Botun oyuncuyu öldürmesi de skora dahil.
- [x] Çalışan GH Actions paketi ve en son 175/175 Node testi. **Gerçek GPU/WebGL kabulü bununla eşdeğer değildir.**

## Devam eden geliştirme dalları — kodlanmış, henüz kabul edilmemiş

- [x] **PR #28 (A1, draft, main'e birleştirilmedi):** TAB basılı canlı 7 kişilik sıralama; menüde 2 / 4 / 8 dakika; varsayılan 4 dakika; ESC/pointer-lock testleri. CI başarılı. **Gerçek Chrome/Edge kabulü yapılmadı.**
- [x] **PR #29 (A2 hazırlığı, draft, PR #28 üstüne):** FFA yönlere ayrılmış gerçek öldürmeler, 1 saniyelik örneklerle bot hedef dağılımı, sınıf vuruş anı kayıtları, navigasyon sıkışma gözlemleri, skor mutabakatı ve sonuç ekranından çevrim dışı JSON rapor indirme. 203/203 Node test, HTML build PASS. **Denge kalibrasyonu ve GPU kabulü yapılmadı.**
- [x] **PR #30 (A2 AI güvenliği, draft, PR #29 üstüne):** Rotada 0,55 sn sonrasında kontrollü yeniden planlama; 3,2 sn boyunca ilerlemeyen botun erişilemeyen hedefi kısa süreliğine değiştirmesi; ışınlanma veya duvar içinden geçiş yok. Sürekli sıkışma sayacı artık rota yenilemesinde sıfırlanmıyor. Node ve offline CI PASS; GPU kabulü yapılmadı.
- [x] **PR #31 (A3 ilk animasyon cila, draft, PR #30 üstüne):** Botların hareket/taktik hedefi dönüşleri en kısa açıdan kademeli; yalnız mevcut mesh dönüşüne etki eder, fizik ve hasar değişmez. Boş waypoint sırasında sıkışma raporlaması düzeltildi. **217/217 Node testi + offline paket PASS**, fakat gerçek FPS/TPS video/görsel kabulü yapılmadı.
- [x] **PR #32 (A2 Bot Combat 2.1, draft, PR #31 üstüne):** Şövalye/kargı/okçu/tüfekçi botlarında rol bazlı saldırı ritmi, görülebilir menzilli nişan hazırlığı, gerçek ön yöne nişan kontrolü, hedef değişince vuruşun iptali, yakın dövüş oyuncusuna şövalye kalkan tepkisi ve vurulan menzilli botta kısa güvenli yana hareket. Bot hasarları 14–20 → 19–25 bandında ölçülü artırıldı; oyuncu hasarı, fizik, görseller ve altı botlu FFA korundu. **Gerçek tarayıcıda zorluk ve denge onayı yapılmadı.** Ayrıntı: `docs/AI_COMBAT_2_1_BALANCE.md`.
- [ ] **A0 #27:** dört dakikalık WebGL uçtan uca oynanış kabulü hâlâ açık. Gerçek oynanış kabul edilene kadar PR #28–#32 draft kalır.
- [ ] **Sıradaki gerçek test:** PR #29 paketiyle 2, 4, 8 dakika, yeniden oynama, sonuç JSON indirme ve dört sınıfta toplam 10+ dakika oynanış denemesi. Rehber: `docs/A2_COMBAT_BALANCE_QA.md`.
- [ ] **Bağımlılık sırası:** PR #28 → #29 → #30 → #31 → #32 → ana dal. Bot hasarları ve zekâsı kullanıcı oynanışında onaylanmadan A4/A5 içerik geliştirmesine geçilmez.

## P0 savaş sistemi kararlılığı — 18 Ekim 2026

- [x] Geliştirme dalı `codex/combat-p0-hit-validation-fire-cap`: silah/gövde/kafa/kol/bacak hasar paylaştırma, bot menzilli atışlarının ıskalayabilmesi, gerçek silah meshi ile uzuv temasının ayrılması, 4/15 saniyelik mutlak atış zaman sınırları, oyun içi sınıf değiştirmede can suistimalinin kapatılması.
- [x] **248/248 otomatik test + çevrim dışı HTML paketleme başarılı.** Bu sonuç yalnız geliştirme dalının CI kanıtıdır, canlı GPU/WebGL oynanış kabulü değildir.
- [ ] P0 gerçek tarayıcı kabulü: hareketli oyuncuya bot tüfek/okçu atışlarının doğru isabet/ıskalama ve engel kontrolleri, parry, geri dönüş/restart, sınıf değişimi.
- [ ] PR #28–#32 ve yeni silah dalı sıralı gözden geçirme/merge işlemleri yapılacak. `main` henüz son P1/A2/A3 değişikliklerini içermiyor.
- [ ] **Takım modu:** `src/arena-teams.js` saf modül olarak mevcut; UI, tüm hedefleme/hasar akışı, takım spawn'ları ve bitiş ekranına henüz bağlanmadı. Oynanabilir TDM diye işaretlenemez.
- [ ] **İkinci harita:** tema kullanıcı tarafından seçilmeden üretime geçilmeyecek.

Teknik ayrıntılar ve test rehberi: `docs/COMBAT_P0_STABILIZATION.md`.

## A4 uygulama güncellemesi — 18 Ekim 2026

- [x] **A4 Takım Savaşı kodu (bu özellik dalı):** FFA varsayılan korunarak menüden 4v3 offline TDM seçimi; oyuncu + 3 mavi müttefik / 3 kırmızı düşman, dost ateşi ve dost hedefleme engeli, takım taraflı güvenli spawn, takım skor HUD, TAB, sonuç/beraberlik, tekrar oynama ve JSON QA raporu.
- [x] Dost karakterlerin bot mermilerini geçirme riski için 3D müttefik görüş-kesme testi, yeni Node/VM regresyonları ve eski FFA testleri.
- [ ] **A4 gerçek tarayıcı kabulü devam ediyor:** Chrome/Edge 4 dakika tam takım savaşı, spawn/AI, dost ateşi, 2/4/8 dakika, ESC/TAB/replay, skor; bakınız `docs/A4_OFFLINE_TDM_QA.md`.
- [ ] Bağımlılık PR zinciri `#28 → #29 → #30 → #31 → #32 → #33 → #34 → #35 → A4 PR` incelenecek; kullanıcı WebGL onayı olmadan `main` birleştirilmeyecek. Mevcut oyunun özgün grafik ve hareket hissi korunacak.
- [ ] A5 ikinci harita için tema kararı bekliyor. A6–A8 ve 30+ dakika stres kontrolü henüz bitmedi.

## A3 / A7 ara geliştirme — 18 Ekim 2026

- [x] Botların gerçek rampa eğimine göre görsel gövde/bacak hareketi; ayrı yay bırakma ve tüfek geri tepme pozları. Hasar/AI/çarpışma ve onaylanan eski modeller aynen korunur.
- [x] Bot arayüzü geçici vektör tahsisleri azaltıldı, radar yenilemesi 30Hz sınırı, birikimli FOV değişimine göre projeksiyon hesabı; FFA ve TDM kalır.
- [x] Gerçek render frame süresi için maksimum 1.800 örnek, ortalama FPS, **en yavaş %1 FPS**, p95/p99 kare süresi ve WebGL draw calls/triangle/texture verileri ölçülebilir; oyun sonu JSON ile indirilebilir.
- [x] **287/287 otomatik Node testi, offline HTML ve inline JS kontrolü başarılı (özellik dalı)**. Bu, GPU FPS artışının ispatı değildir.
- [ ] Kullanıcının Chrome/Edge'inde dört rampa, 4 sınıf ve FFA/TDM görsel kabulü; karşılaştırmalı FPS/1% low, 30+ dakika stres testi, siyah ekran kontrolü.
- [ ] Bu dal PR #36 üstüne bindirilecek; PR zinciri gözden geçirilmeden `main`'e taşınmayacak.
- Ayrıntı: `docs/A3_A7_ANIMATION_PERFORMANCE_QA.md`.

## İş sırası ve bağımlılıklar

### A0 — ÖNCE: Maç Sistemi 1.0 oynanış kabulü (P1, 1–2 gün)
**GitHub:** #27. **Bağımlılık:** PR #26 tamamlandı; gerçek tarayıcı testi gerekiyor.

- [ ] Kullanıcının Chrome/Edge'inde 4 dakika tam FFA maç: sayaç 00:00'da durmalı, kazanan ve tüm 7 kişi sıralanmalı.
- [ ] TAB/oyun içi diğer kontrollerle skor karışmamalı; bot-bot, bot-oyuncu ve oyuncu-bot öldürmeleri ve ölümler doğru görünmeli.
- [ ] Escape/fare kilidi kaybı → gerçek duraklama; süre ve botlar durmalı, devam edilince aynı maç sürmeli.
- [ ] Sonuç ekranında **TEKRAR OYNA**: 04:00, 6 bot, HP/skor/respawn/AI rotaları sıfır; **ANA MENÜ**: sınıf seçimi ve yeni maç sorunsuz.
- [ ] Siyah ekran/konsol hatası yok, mevcut grafikler ve FFA bozulmamış.
- **Kabul:** gerçek GPU'da tam maç + yeniden oynama sorunsuz, video/deneme geri bildirimi alındı. Hata çıkarsa yeni özellik yerine küçük düzeltme PR'ı.

### A1 — Canlı skor tablosu ve maç seçenekleri (P1, 3–5 gün)
**Bağımlılık:** A0 kabulü.

- [ ] Basılı tutulan TAB ile gerçek zamanlı 7 kişilik sıralama: öldürme, ölüm, K/D, oyuncunun vurgulanması ve eşitlik kuralları.
- [ ] Maç öncesi süre seçimi (önce 2 / 4 / 8 dakika), varsayılan **4 dakika**.
- [ ] FFA yeniden başlatma, süre seçimi ve sonuç ekranı aynı saf maç durum modülünü kullanmalı.
- [ ] Menünün/pointer lock'un durum geçişlerini regresyon testleriyle sabitle.
- [ ] 6 bot varsayılanı değişmesin; daha fazla bot yalnız performans ölçümünden sonra seçenek olsun.
- **Kabul:** yeni sürelerle en az iki maç; sıralama ve sonuç tutarlı, ESC/TAB/fare kilidi hata üretmiyor.

### A2 — Dört sınıfın dövüş dengesi + AI 2.0 kabulü (P1, 4–8 gün)
**GitHub:** #3, #11. **Bağımlılık:** A0; A1 ile kısmen paralel yapılabilir.

- [ ] Şövalye kalkan açısı/parry tepkisi; kargı minimum/azami menzil; ok/tüfek görüş ve duvar engeli testleri.
- [ ] Her sınıfla 10 dakikalık 6 bot FFA oynanışı ve öldürme/ölüm, hedef seçimi, isabet notları.
- [ ] Botların tek oyuncuya yığılmaması, ateş noktası erişilebilirliği, sur/kapı takılması ve rota yenilemesi.
- [ ] Bot isabet/tepki ayarını **hileli hasar artışı yerine** karar, görüş ve tepki toleransıyla dengele.
- [ ] FPS/TPS görünür silah teması ve parry zamanı için gerçek video kontrollü son kalibrasyon.
- **Kabul:** bariz duvar arkası isabeti/tek sınıf mutlak üstünlüğü yok; 10+ dakika altı bot birbirini de hedefliyor.

### A3 — Animasyon 2.0 son cila (P1, 3–6 gün)
**GitHub:** #18. **Bağımlılık:** A2'deki yakın dövüş zamanlama onayı.

- [ ] Bot/TPS keskin yön değişiminde gövde/baş dönüşünü kademelendir, hareket fiziğine dokunma.
- [ ] 4 rampa ve sur üstünde ayak basma, kayma/sürüklenme, iniş ve yürüyüş ritmini düzelt.
- [ ] Saldırı hazırlığı–isabet–toparlanma, engelleme/parry ve ölüm/yeniden doğma geçişlerini kontrol et.
- [ ] Eskiden kabul edilmiş grafik/mesh/texture ve 1. şahıs silah görselleri korunmalı.
- **Kabul:** 4 sınıfla FPS/TPS görsel denemede kopan uzuv, kayan bacak, elden ayrılan silah yok.

### A4 — Takım savaşı (P1, 5–9 gün)
**Bağımlılık:** A1 skor/maç durumları ve A2 AI doğruluğu.

- [ ] Mod seçiminde **FFA varsayılan** + isteğe bağlı Team Deathmatch.
- [ ] Takım kimliği, takım skoru, hedefleme, dost ateşi ayarı, doğuşların takıma göre güvenli olması.
- [ ] Botların takım arkadaşlarını hedeflememesi; karşı takıma doğru rota/menzil seçimi.
- [ ] Sonuç ekranında takım kazananı, takım skorları ve bireysel katkı; yeniden oynama.
- [ ] 3v3 bot denemesi + oyuncu dahil dengeli katılımcı sayısı; sınır durumları ve FFA geriye uyumluluk.
- **Kabul:** takım içi hedefleme hatası ve FFA regresyonu yok; maç sonucu doğru.

### A5 — İkinci harita ve çevre içeriği (P1/P2, 6–12 gün)
**Bağımlılık:** A2 kararlı bot navigasyonu; harita **teması kullanıcıyla seçilecek**.

- [ ] Seçeneklerden biri kararlaştırılacak: şehir meydanı, liman tabyası, kale içi vb. (henüz kesin değil).
- [ ] Mevcut kale oynanabilir şekilde kalacak; yeni harita aynı köşeli/görsel stilde.
- [ ] Harita seçimi ve haritaya özel spawn, A* rotaları, ateş noktaları, FPS/TPS çarpışmaları.
- [ ] Çevresel nesneler için \`isSolid\` kararlarını bilinçli ver; görünür katı nesnelerle collider/raycast'i hizala.
- [ ] Yüksek hızda duvar geçişi, bot sıkışması ve 10+ dk savaşla gerçek test.
- **Kabul:** iki haritada dört sınıf, 6 bot, her modun doğru çalışma ve güvenli rota testleri.

### A6 — Ses, okunabilirlik ve ayarlar (P2, 4–7 gün)
**Bağımlılık:** A1 ekran akışı; A2 silah dengesi.

- [ ] Silah, blok, taş/ahşap/zırh temasına göre seçilebilir sesler ve eş zamanlı ses sınırı.
- [ ] Düşmanın konumu ve hasar yönü için okunaklı hitmarker/sağlık/öldürme bildirimi.
- [ ] Ses düzeyi, fare hassasiyeti, kamera sarsıntısını azaltma ve kalite seçenekleri.
- [ ] Grafik stilini değiştirmeden UI kontrastı, erişilebilirlik ve farklı ekran çözünürlüğü kontrolleri.
- **Kabul:** 6 bot yoğun çatışmada efekt yükü kontrol altında, temel kontroller anlaşılır ve ayarlar kalıcı/öngörülebilir.

### A7 — Performans ve uzun süreli güvenilirlik (P0 kalite kapısı, 5–10 gün)
**Bağımlılık:** A4–A6 büyük içerik değişiklikleri.

- [ ] Chrome/Edge gerçek WebGL'de ortalama FPS, 1% low, kare süresi, draw calls, bellek ve GC ölçümü.
- [ ] 6 botta 30+ dakika maç/yeniden oynama/sınıf değiştirme stres testi.
- [ ] Gereksiz geçici Three.js objeleri, animasyon/raycast/partikül maliyeti, sürüklenen etiketler için profil temelli optimizasyon.
- [ ] 8/12 bot seçeneği **yalnız ölçüm sonuçları uygunsa** ayrı onayla; temel 6-bot deneyimini bozma.
- [ ] Siyah ekran durumunda anlaşılır hata; offline HTML paketinin her main CI'da kaynak kodla birebir derlenmesi.
- **Kabul:** belirlenen test bilgisayarı ve çözünürlükte ortak kabul edilen FPS hedefi, kritik bellek artışı/konsol hatası yok.

### A8 — İlk tam çevrim dışı sürüm (P1 teslim, 2–4 gün)
**Bağımlılık:** A0–A7 kabul.

- [ ] Final tek HTML + kaynak ZIP + CHANGELOG + ana sürüm SHA + test raporu.
- [ ] FFA + isteğe bağlı takım modu, 4 sınıf, onaylanmış 2 harita, 6 bot, sonuç/restart/ayarlar.
- [ ] Mevcut dosyaların sürüm hash'leri, geriye dönüş etiketi, temiz indirme ve çevrim dışı Chrome/Edge açılışı.
- [ ] Son 30 dakikalık kullanıcı onaylı oynanış ve dağıtım kontrol listesi.
- **Kabul:** kurulum gerektirmeyen oynanabilir teslim, kaynaklar tekrar üretilebilir, kritik hata yok.

## Öncelik sırası — sıradaki üç PR/görev

1. **Şimdi #27 kabul testi** → gerçek 4 dakika, duraklama, sonuç, replay; çıkarsa hata düzeltme.
2. **Sonraki geliştirme: A1 / canlı TAB skor tablosu** → FFA skor modülünü yeniden kullan; 6 botu, eski grafikleri ve ana maçı koru.
3. **Ardından A1 / süre seçimi + menü/pointer-lock regresyonu** → 4 dk varsayılan, 2/8 dk opsiyonları; bu tamamlanmadan takım moduna başlama.

## Emek tahmini, kapsam sınırları

A0 1–2 + A1 3–5 + A2 4–8 + A3 3–6 + A4 5–9 + A5 6–12 + A6 4–7 + A7 5–10 + A8 2–4 = **yaklaşık 33–63 geliştirici-günü**. Bu, yürütme/test iterasyonları ve kullanıcı geri bildirimiyle değişebilecek bir *kaba tahmindir*, otomatik iş veya garanti değildir. Gelişmeler paralel yürütülse de her PR gerekli kabul kapısından geçecek.

**İlk teslimin dışında kalanlar:** gerçek çevrim içi çok oyunculu sunucu, eşleştirme, hesap sistemi, yeni karakter sınıfları, köklü grafik yenilemesi. Bunlar ancak ayrı kapsam kararıyla ele alınır.

## Çalışma yöntemi

- Her seferinde küçük ve bağımsız özellik dalı → Node testleri → GitHub PR CI → squash merge → main CI → resmi indirilebilir HTML.
- Kullanıcı doğrudan oyunda sorun görürse öncelik hata düzeltme ve geriye dönüş; kabul edilen oynanış hissi korunur.
- Bu checklist yalnız kanıtlanmış işler için işaretlenecek. Bir özellik kodlandı diye GPU kabulü tamamlandı sayılmayacak.
