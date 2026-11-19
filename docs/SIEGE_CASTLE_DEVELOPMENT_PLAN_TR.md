# KILL THE KING — KUŞATMA KALESİ SAVAŞI: UYGULAMA PLANI

**Tarih:** 18 Kasım 2026  
**Durum:** Kullanıcı kararı: **Kale Kuşatması, aynı Kill the King oyununun ÜÇÜNCÜ modudur** (Arena / Ordu / Kale Kuşatması). [Üç modlu gerçek HTML ve Chromium kanıtı](KILLTHEKING_THREE_MODE_MAIN_MENU_TR.md); aday ana menü entegrasyonu başarılı, ortak grafik/hareket paritesi açık.  
**Geliştirme dalı:** `codex/s1-siege-castle-phase1` (temel: `codex/g54-ffa-army-isolated-launcher`).  
**Önemli:** Ana dalı, FFA/TDM'yi, G5.4 ordu adayını, tarihî HTML'yi veya mevcut silah sürelerini değiştirme.

**S1 ilk teslim (18 Kasım):** 21/21 Node test + gerçek Chromium/SwiftShader 3B harita ve test arayüzü PASS. [İlk S1 raporu ve indirme bağlantıları](../recovered/siege/README.md). **S1 tamamlandı; S2 dolaşılabilirlik önizlemesi tamamlandı; S3 gerçek 140 askerli G5.4 motoru ve 3B asker hareketi adayı kısmen uygulandı. Gerçek yapı saldırısı/asker merdiven AI/FPS savaş ve S4–S6 hâlâ AÇIK.** Bu yalnız FFA'ya yeni bir harita değildir; Arena ve Ordu'nun yanında **üçüncü ayrı savaş modu**dur. Üç mod [tek menü/tek HTML](KILLTHEKING_THREE_MODE_MAIN_MENU_TR.md) içinde açılır; görsel ve ana FPS hareket motorları henüz tümüyle ortak değil.

## ANA OYUNA 3. MOD ENTEGRASYONU — KULLANICI KARARI (19 KASIM)

- [x] **Üç oyun modu ortak ana menü:** Serbest Arena/TDM, 140 Askerli Ordu Savaşı ve Kale Kuşatması; aynı çevrim dışı HTML'de birbirinden seçilebilir
- [x] **Eski iki mod korunur:** Kaynak SHA ile aslına uygun arşivlenir, kuşatma üçüncü mod olarak eklenir, mod değişiminde eski maç temiz kapanır
- [x] **Gerçek Chromium üçlü seçim:** FFA 6 bot, ordu 140 asker, kuşatma 140 asker + 100 HP gerçek FPS/TPS insan modunun açılması; sonrasında FFA'ya dönüş — [CI #44524696649 PASS](https://github.com/zxc28tarik/killtheking/actions/runs/44524696649)
- [ ] **Aynı görsel ve karakter kimliği:** kuşatmanın stil, modeller, silah ve temel hareket animasyonlarını Arena/Ordu ile uyumlu hâle getirme; şu an ayrı WebGL sahneleri var
- [ ] **Aynı gerçek FPS karakter fiziği:** S3D2 tam FFA hareket/nişan/zıplama/kayma ve sur üstü 3B balistik
- [ ] **S4 savunma AI ve S5–S6 manuel GPU/stres/oyuncu kabulü; nihai main birleşmesi/yayın için kullanıcı onayı**

**Hedef:** Kaynak izolasyonu içeride korunabilir ama oyuncu **tek oyun, tek menü ve üç tutarlı savaş modu** görmeli. Kalenin farklı oyun gibi görünmesi geçici teknik borçtur; kendi başına tamamlanmış entegrasyon sayılmaz. [Ayrıntılar](KILLTHEKING_THREE_MODE_MAIN_MENU_TR.md).

## 0. Kesin kabul edilen kapsam

- **Bir yeni harita:** dış saldırı alanı, ana kapı, iki yan sur çıkış hattı, sur üstü mevziler, iç avlu ve iç kale/komuta noktası.
- **İki taraf:** kırmızı saldıranlar, mavi kale savunucuları. Oyuncu saldıran **veya** savunan olabilir; taraf seçimi gerçek oyun arayüzünde uygulanacak.
- **Dört mevcut asker sınıfı:** kılıçlı, mızraklı, okçu, tüfekçi. Mevcut silah hasarı ve atış ritmi korunur; hiçbir yeni varsayılan denge onayı verilmedi.
- **Senaryo hedefli oyun:** saldıran kapı **veya** sur çıkışı üzerinden kaleye girip avlu ve iç kale/komuta noktasını alır. Savunucu saldıranları etkisiz hale getirerek veya senaryo süresini doldurarak kazanır.
- **Saldırı ve savunma AI ayrı taktikler:** kapı saldırı takımı, surdan sızma, sur üstü ateş desteği, mızrak/kılıç koruması, avlu karşı taarruzu, son komuta noktası savunması.
- **Mevcut oyun kimliği:** Krunker benzeri stil, hızlı FPS/TPS kontrolleri, senaryo dışında herkesin birbirine saldırdığı FFA korunur.

## 1. Teknik karar ve değişebilen tasarım önerileri

| Konu | Başlangıç taslağı | Karar sınırı |
| --- | --- | --- |
| Ordu ölçeği | G5.4 doğrulanan **70+70 / 140 asker** adayının sözleşmesi | 200/280 ve varsayılan sayı **ayrı onay** |
| Renkler | Kırmızı saldırır, mavi savunur | Tarafların değişmesi UI seçimidir, kozmetik simülasyon sonucu değil |
| Ana giriş | HP'li kapı ve kuşatma darbe sistemi | **HP sayısı geçici prototip değeri**; gerçek G5.4 hasarına entegrasyonda ayarlanacak |
| İki sur çıkışı | Geçerli nav bağlantısı / merdiven noktası | Tam kuşatma merdiveni karakter animasyonu S4–S5 |
| Harita boyutu | Yoğun kuşatma için orta ölçekli, **geometri verisinde** tanımlı | Kesin ölçüler ilk harita kabulünde revize edilebilir |
| Maç süresi | Prototip motorunda zaman sınırı veriyle ayarlanabilir | **Nihai dakika/denge kullanıcı onayı olmadan kilitlenmez** |
| Komuta ele geçirme | Ön şart avlu, sonra iç kale noktasında yeterli süre varlık | Prototipte basit kural, gerçek asker işgali ve itirazı S3 |
| İlk veri motoru | Kaynak bağımsız, deterministik kuşatma senaryo FSM'i | **Henüz gerçek 140 asker motorunun yerine geçmez** |
| Render | Var olan Three.js / stil ve gerçek kale collider'larıyla bağımsız kuşatma sahnesi | İlk önizlemede basit placeholder asker ve UI açıkça etiketlenecek |

### Korunması zorunlu sözleşme
1. **FFA normal oyuncu yayı:** 2 saniye ilk bırakma, 3 saniye tam çekiş, 4 saniye ok aralığı, 1 saniye toparlanma. **Arena bot okçusu 0,5 saniye.** Ordu okçusu ayrıca değiştirilmedi.
2. G5.4, G8.4 değildir. **Eksik G8.4 kaynak dosyası / Issue #44** çözülmeden daha yeni sürüm elde edildiği iddia edilmez.
3. FFA arena AI ve ordu AI birbirine karıştırılmaz. Kuşatma senaryosu ayrı kaynak/işleyici ile başlar.
4. Oyun içindeki asıl asker ölüm ve kapı hasarı olayları ileride G5.4 gerçek motorundan alınacak; prototipin elle düğmeyle ürettiği olaylar **savaş AI kanıtı değildir**.
5. PR **DRAFT**, `main` korunur. Kullanıcı onayı olmadan önemli denge ve mimari sözleşmesi kilitlenmez.

## 2. Geliştirme aşamaları ve durum

### S1 — Harita sözleşmesi + deterministik kuşatma senaryo motoru [P0]
- [x] Geliştirme planı ve ayrı senaryo teknik sözleşmesi Markdown dosyalarına yazılır.
- [x] Yerleşim: dış hat, sur, kapı, iki çıkış, avlu, iç kale; kapı HP/engel/nav işaretleri ve spawn bölgeleri.
- [x] Kaynak bağımsız saf JavaScript kuşatma FSM: `APPROACH → BREACH → COURTYARD → KEEP → RESULT`; saldırı alternatifleri kapı/merdiven; süre/ölüm zaferi.
- [x] Geçersiz olay, sonsuz sayı, taraf ihlali, avlu atlama, sahte kazanma engellenir.
- [x] Gerçek modlara dokunmadan başlangıç görsel/test prototipi (isteğe göre 3B).
- [x] CI: harita geçitleri, kapı/sur alternatifi, avlu, iç kale, zaman, taraf/zafer ve kaynak izolasyonu testleri.
**Kabul:** deterministik senaryo motoru doğru fazlara geçer; 2 farklı ihlal rotası denenir; gerçek oynanabilir 140 asker/grafik iddiası YOK.

### S2 — 3B kuşatma haritası, fizik, asker yerleşimi [P0/P1]

**19 Kasım — S2 dolaşılabilirlik önizlemesi PASS, üretim sürümüne bütünleşme AÇIK.** [Gerçek test bulguları ve indirilebilir HTML](../recovered/siege/S2_CASTLE_TRAVERSAL_ACCEPTANCE_TR.md). Yeni izolasyonlu `siege-traversal.js` ile 3B önizlemede FPS/TPS keşif, gerçek W/A/S/D hareketi, kapıda dinamik collider, batı/doğu E-tırmanışı, takım seçimi ve taktik mini harita kodlandı. **21 S1 + 18 S2 = 39/39 Node test PASS**, gerçek Chromium/SwiftShader W/E kontrolü PASS ([CI #44495376208](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208)). Kapı ve sur test konumları QA ışınlamasıdır; oyuncunun doğal başlangıçtan bütün 3B rotayı yürümesi veya gerçek G5.4 askerlerin kale kuşatması **henüz kanıtlanmadı**.

- [x] **S2 bağımsız önizleme:** eski FFA ve orduyu değiştirmeden, gerçek kale geometrisine bağlı kapı/duvar çarpışması ve yönlendirilmiş iki merdiven yolu.
- [x] **S2 bağımsız önizleme:** FPS/TPS kamera ve gerçek WASD/E olayları; mini harita, kırılan kapıda collider ve rota yenilemesi.
- [ ] **S2 üretim entegrasyonu:** gerçek ana oyun FPS/TPS oyuncusu, tam sur üstü platform/fizik, kale NPC/asker doğuşu ve 3B rota kabulü.
- [ ] Özgün grafik dilinde kale, sur, ana kapı, yan merdiven noktaları, dış siperler, avlu, iç kale.
- [ ] Görünür/katı nesnelerin collider ve raycast eşleşmesi; kapı yıkılınca collision ve nav geçişi güncellemesi.
- [ ] Mavi savunma sur/spawn; kırmızı dış saldırı/kuşatma spawn; merdiven çıkış/iniş güvenliği.
- [ ] Harita taktik minik harita/asker konumu ve objektif HUD.
**Kabul:** gerçek WebGL ve fiziksel oyuncuyla kapı, iki yan rota, sur, avlu ve iç kale erişimi.

### S3 — Gerçek 70v70 G5.4 savaş motoruyla ilk bütünleşme [P0]

**19 Kasım — S3A/B 140 gerçek asker, S3C1 doğal kapı, S3C2 çift merdiven, S3C3 doğal iç kale zaferi ve S3D1 gerçek insan komutan HP/zemin silah bağlantısı PASS. TAM ESKİ FPS MOTORU DEĞİL.** [S3D1 112/112 ve Chromium kanıtı](SIEGE_CASTLE_S3D1_PLAYER_COMBAT_ACCEPTANCE_TR.md). Tarihî G5.4 savaş motoru değişmeden 140 askeri ve sekiz bölüğü yönetiyor; oynatılan 3B modeller gerçek asker konumlarından güncelleniyor. **15 S3D1 + 15 S3C3 + 15 S3C2 + 15 S3C1 + 13 S3A + 39 S1/S2 = 112/112 Node test PASS.** Doğal [kapı](SIEGE_CASTLE_S3C1_GATE_ASSAULT_TR.md), [iki merdiven](SIEGE_CASTLE_S3C2_DUAL_LADDER_TR.md) ve [109,36 s keep ele geçirme](SIEGE_CASTLE_S3C3_REAL_CAPTURE_ACCEPTANCE_TR.md) doğrulandı. **Asıl arena FPS hareket modülünün taşınması, 3B balistik, mavi kale savunma AI ve gerçek GPU kabulü AÇIK.**

- [x] **S3A gerçek motor:** 70 kırmızı / 70 mavi, sekiz özgün bölük, iki taraf komuta ve gerçek `step/snapshot/drainCombatEvents` API'si.
- [x] **S3A gerçek harita:** S1 taş engelleri orijinal G5.4 `setWorldObstacles({x,y,z,w,h,d,solid})` motoruna bağlandı. Kapı açıldığında G5.4 görüş engeli 15→14 güncellenir.
- [x] **S3A işgal okuyucu:** yaşayan gerçek asker koordinatlarından avlu/iç kale varlığı hesaplanır; 70'er asker sayısı engine/squad üzerinden doğrulanır; DEBUG elle zafer kontrolü gerçek modda engellenir.
- [x] **S3B 3B görsel aday:** gerçek 140 asker `InstancedMesh` pozisyonlarına aktarılır, oyuncu kendi gerçek bölüğüne emir verebilir, kırmızı/mavi gerçek komutan seçimi çalışır.
- [x] **S3C1 gerçek asker kapı hücumu:** yaşayan gerçek G5.4 yakın dövüş askeri, orijinal hasar/menzil/yeniden saldırma süresi ve yeni kuşatma rotasıyla **normal doğuştan** taş kapıyı kırıyor. 32 saniye gerçek engine zamanı, 35 vuruş, 600→0 HP ve gerçek collider 15→14; [CI #44504343310](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310).
- [x] **S3C2 gerçek çift merdiven AI:** normal doğuşlu 140 kişilik G5.4 savaşında yaşayan AI askerleri iki çıkışı kendi hızlarında kuruyor; **batı 12 + doğu 12** gerçek asker, 15,2 m sur üstünü aşıp y=0'a indi. Doğal 60 s test, 82/82 regresyon ve Chromium PASS ([ayrıntılı S3C2 raporu](SIEGE_CASTLE_S3C2_DUAL_LADDER_TR.md), [CI #44507678256](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256)). **2B yerleşik G5.4 balistiği ve tam avlu/iç kale zaferi açık.**
- [x] **S3C3 gerçek avlu / iç kale ve zafer motoru:** normal 140 gerçek G5.4 asker başlangıcından, elle asker yerleştirmeden ve DEBUG zafer olayları olmadan, orijinal kaynak HP/konum/çekişmeli bölge ve S1 `12 s + 20 s` işgal süreleriyle **109,36 oyun saniyesinde saldırganın iç kaleyi ele geçirmesi**; 49 kırmızı/48 mavi canlı kalan asker. 9 s kısa test maçında **savunucu zaman zaferi** ayrıca doğrulandı. **97/97 Node ve Chromium ilk sahne PASS** ([kanıt](SIEGE_CASTLE_S3C3_REAL_CAPTURE_ACCEPTANCE_TR.md)).
- [ ] **S3C3 üretim kabulü AÇIK:** tam maçın gerçek zamanlı GPU/oyuncu testinin yapılması ve mavi AI'nın iç kaleyi savunması. Geçerli sonuç mekanizması tek başına dengeli kuşatma AI'sı sayılmaz.
- [x] **S3D1 gerçek G5.4 oyuncu HP ve dört zemin silahı:** 100 HP ve gerçek `setPlayerPosition` / `raycastSoldier` / `damageSoldier({source:'player'})`; WASD S2 3B fizik, FPS/TPS kontrol, dört özgün silah tablosu, dost askerin atışı engellemesi, ölümle hareket kilidi, mavi/kırmızı yeniden başlangıç; 15 yeni + 97 eski = **112/112 PASS**, gerçek Chromium W/F/yay/tüfek testleri PASS. [S3D1 raporu](SIEGE_CASTLE_S3D1_PLAYER_COMBAT_ACCEPTANCE_TR.md).
- [ ] **S3D2 tam asıl oyun FPS karakteri:** özgün FFA kayma/zıplama/nişan/animasyon ve özgün kamera/pointer-lock sistemini güvenli ayrı modda taşı; gerçek 3B sur üstü ok/kurşun atışı ve insan oyuncunun doğal maç içinde vuruş/ölüm/galibiyet sonuçlarını test et. S3D1 önizleme avatarı tam asıl FPS motoru değildir.
- [x] Gerçek G5.4 `ArenaArmyBattle.create/step/snapshot` sözleşmesiyle 8 bölük ve 140 asker üret (S3A/B).
- [x] Kale engellerini **gerçek** `setWorldObstacles({x,y,z,w,h,d,solid})` üzerinden bağla (S3A ve S3C1).
- [x] **S3C1–S3C3 gerçek asker kaynak doğruluğu:** orijinal HP/ölüm/konum, gerçek kapı darbeleri, iki merdiven ve avlu/keep fazları üzerinden gerçek saldırgan sonucu doğrulandı. **Ek iş:** mavi savunma AI, 3B silah balistiği ve ana FPS kullanıcı entegrasyonu.
- [ ] Oyuncu iki taraftan birine gerçek komuta versin; sıfır dost ateşi hatası.
- [ ] Birleşik başlatıcıya **üçüncü bağımsız kuşatma modu** ekle; FFA ve ordu modlarını koru.
**Kabul:** gerçek asker/HP/kapı/nav/sonuç tutarlılığı, komuta ve iki taraf testi; ordu kaynak SHA bütünlüğü.

### S4 — Kuşatma savaşı yapay zekâsı ve iş birliği [P1]
- [ ] Kırmızı: kapı taarruzu/yan merdiven takımı, destek ateşi, iç avlu birikmesi, iç kaleye ilerleme.
- [ ] Mavi: sur savunması, tüfekçi/okçu koruma, kapı gerisi mızrak, avluda karşı taarruz, iç kale rezervi.
- [ ] Birlikler birbirini engellemesin; saldıranlar tek kapıda sıkışmasın; saldırı/koruma öncelikleri ayrışsın.
- [ ] 8 bölük × formasyon/komut ve oyuncu emrinin takım AI tarafından çiğnenmemesi.
**Kabul:** gerçek 140 asker, üç farklı tohum ve iki gerçek oyuncu tarafıyla savaş ölçümleri.

### S5 — Oynanış ve kalite cilası [P1]
- [ ] Kapı vuruş/ses/hasar efekti; sur üstü nişan/kapalı görüş; merdiven çıkış animasyonu; objektif göstergesi.
- [ ] Kuşatma sonu **Kale Ele Geçirildi / Savunuldu**, tekrar oyna ve ana menü.
- [ ] Kendi tarafını değiştir, 4 asker sınıfını dene, friendly-fire kontrolü.
- [ ] Ses, performans ve erişilebilirlik; silah dengesi gerekirse ayrıca önerilerek onaylanır.
**Kabul:** oyuncunun 2 tarafta tamamlayabildiği, açık hedefleri olan tek kaliteli kale kuşatması.

### S6 — Kabul, yayın hazırlığı [P0]
- [ ] 15+ dakika gerçek Windows GPU/Chrome/Edge (FPS/1%low, fare kilidi, duvar/rampa, sonuç).
- [ ] 140 asker yük/stres, sızıntı, 30 dakika test; 200/280 ayrı performans kararı.
- [ ] FFA/TDM/G5.4 bağımsız regresyon; senaryo modunu aç/kapat.
- [ ] Kaynak ZIP, tek offline HTML, SHA, test raporları, oyuncu onayı.
**Kabul:** manuel onay olmadan merge veya release yok.

## 3. Kullanıcıya gösterilecek sonuç formatı

Her adımda GitHub commit, uygulanan dosyalar, CI test özeti, **YAPILDI / KISMEN / YAPILMADI** ve açık riskler belirtilir. Bir test geçmesi gerçek oyuncu/real GPU kabulü sayılmaz.

## 4. Sıradaki kesin geliştirme

**S3D1 100 HP ve 4 silahlı gerçek insan komutan köprüsü tamamlandı (yalnız zeminli FPS/TPS önizleme avatarı).** **Sırada S3D2** ana arena karakter hareketi ve 3B silah yüksekliği/fizik bağlantısı ile doğrulanmış doğal insan-vs-AI savaş testleri. **S4 kritik:** mavi savunucuların keep/sur/avlu rezervi ve anti-stuck. Üç modlu ana menü/tek HTML **tamamlandı**; bundan sonra S3D2 ve görsel/karakter paritesi, S4 mavi savunma AI, S5–S6 GPU/kalite/yayın kabulü. PR taslak, FFA/G5.4 ve `main` korunur; nihai denge ve merge için kullanıcı onayı gerekir.
