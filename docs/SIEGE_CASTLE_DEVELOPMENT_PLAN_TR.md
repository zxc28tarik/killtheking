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


### 19 Kasım — S3V1 sınıf bazlı karakter görsel entegrasyonu (aday)

- [x] S3D1 ve üç modlu ana menü derlemelerine `siege-character-visuals.js` eklendi. 140 gerçek G5.4 kimliği/konumu üzerinden kılıçlı, mızraklı, okçu ve tüfekçi için takım renkli gövde/zırh/başlık/silah parçaları `InstancedMesh` ile çizilir; uzuvlar yalnız gerçek hareketten türetilir.
- [x] Eski silindir askerler çizimde gizlenir ama gerçek G5.4 konumları, HP, hasar, bölüm/komuta ve QA matrisi korunur. Daha eski S1–S3C HTML yapıları etkilenmez.
- [ ] Bu bir **Arena orijinal mesh'inin birebir paylaşımı değildir**: kıyafet ve silah siluetleri Arena'yı referans alır. Tam aynı mesh/animasyon, FPS karakter fiziği ve gerçek 3B balistik S3D2 ve sonraki kabul işlerinde AÇIK.
- [ ] Yeni görsel katmanın gerçek GPU FPS/stres onayı bekleniyor; Node/Chromium CI kanıtı olmadan tamamlanmış sayılmamalı.

### 19 Kasım 2026 — S3D2a: hareket katmanı (onay öncesi aday)

- [x] Üç modlu HTML'deki **Kale Kuşatması'na** Space zıplama, Shift/C kayma, sınırlı slide-hop ve havada ivmelenme eklendi. Arena'nın yerçekimi (30) ve sıçrama başlangıcı (12.6) referans alınarak ayrı S3D2a adaptörü yapıldı; **Arena motoru birebir ortak değil**.
- [x] Gerçek S1 kale collider/kapı kurallarından geçen yatay-dikey hareket; AI, 140 G5.4 asker, iki merdiven, kapı ve senaryo fazlarını değiştirmez. S1/S2 eski önizlemelerine modül enjekte edilmez.
- [x] Kamera kayarken alçalır. Havada/merdivende ateş gerçek 3B balistik hazır olmadığından kapalıdır.
- [ ] Arena'nın tam TPS animasyonları, tam fare kilidi, silah/hit geri bildirimleri ve sur üstü 3B balistik ayrı S3D2 işleri; bu hareket düzeltmesi tek başına tam eşitlik değildir.
- [x] Node regresyon ve üç modlu Chromium/SwiftShader kabulü tamamlandı. Fiziksel Windows GPU ve oynanış hissi oyuncu kabulü AÇIK.


**S3D2a doğrulaması (19 Kasım):** [Üç modlu CI #44532599418](https://github.com/zxc28tarik/killtheking/actions/runs/44532599418) iki iş **SUCCESS**: üç modlu paket + gerçek Chromium/SwiftShader 140 asker, Space zıplama (1 gerçek keydown, havalanma, iniş), Shift kayma ve Arena'ya dönüş. `pageErrors=[]`, `consoleErrors=[]`. 7 yeni/eski menü + 7 eski iki-mod + 5 runtime + 15 canlı HP + 3 sınıf görsel + **8/8 yeni hareket testi** = **45/45 test PASS**. [Birleşik HTML artifact #14533937466](https://github.com/zxc28tarik/killtheking/actions/runs/44532599418/artifacts/14533937466); ekran görüntüleri [#14533443427](https://github.com/zxc28tarik/killtheking/actions/runs/44532599418/artifacts/14533443427). Fiziksel Windows GPU/manuel FPS hissi kabulü açık; orijinal FFA tam hareket motoru ve 3B balistik paylaşılmıyor.



### S3D2b — Birinci şahıs silah ve gerçek hit/recoil görselleri (19 Kasım 2026)

- [x] Üçüncü oyun modu Kale Kuşatması için dört gerçek Three.js birinci şahıs kamera modeli oluşturuldu: kılıç (koruma/kabza/namlu yerine bıçak), mızrak, yay (ok/ip), tüfek (namlu/çakmak mekanizması). Bunlar Arena silahlarıyla aynı sınıflardan yeni hafif kozmetik modellerdir; birebir aktarım değildir.
- [x] Yalnız orijinal G5.4 oyuncu savaş modülünün gerçek atış sonuçları model geri tepmesini, yalnız pozitif gerçek hasarlı isabet hit marker'ı ve yalnız gerçek G5.4 can kaybı ekranın kenar hasar uyarısını besler.
- [x] G5.4 bekleme süresi reddi, zayıf yay bırakma ve yükseklik reddi sahte atış/hit animasyonu oluşturmaz. Yay görsel gerilmesi gerçek G5.4 hesaplanan draw süresine bağlıdır. Kamera/oyuncu aim yönü ve hasar/HP değeri değiştirilmez.
- [x] S3D1 ve üç modlu HTML'ye yeni opsiyonel silah modülü bağlandı; 140 G5.4 gerçek asker, Arena ve Ordu kaynağı korunur.
- [ ] Bu kozmetik entegrasyon tam özgün Arena FPS/TPS varlık paylaşımı, gerçek ok/kurşun 3B balistiği, ADS, TPS animasyonu veya kullanıcı onaylı son sürüm değildir. Tarayıcı CI ve fiziksel GPU kabulü ayrıca izlenir.


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



### AK-00–AK-06 — KESİN MİMARİ KARAR: Kale Kuşatması = Meydan Savaşı + Kuşatma içeriği (19 Kasım 2026)

**Yeni kullanıcı kararı:** Üçüncü mod bağımsız FPS/başka bir savaş oyunu değil; **ikinci mod olan 140 askerlik Meydan Savaşı'nın aynı kontrolleri, bölük komutları, hareket/silah dengesi ve yapay zekâsını** kullanacak. Harita ve sadece kuşatmaya özgü sistemler (kale/surlar, kuşatma kuleleri, mancınıklar, koçbaşı, merdivenler, kapı/kale yapıları, avlu-iç kale hedefleri) farklı olmalı. Bu karar önceki "izole kuşatma FPS prototipi" yönüne önceliklidir. Önceden yapılan S1–S4B çalışmalarını silme; mod 3'ün ortak çekirdeğe aktarılmasında yeniden kullan. Onay olmadan PR merge veya onaylı orijinal G5.4/Arena dosyalarında kırıcı değişiklik yapma.

- [x] **AK-00 — Gerçek durumu tespit et:** Aynı G5.4 gerçek 140 asker/8 bölük çekirdeği hâlihazırda her iki modda kullanılıyor. Ancak üçüncü mod farklı Three.js sahnesi, farklı FPS/TPS kontrol/UI katmanı ve izole iframe içinde çalışıyor. Önceki "ortak görsel/komuta tamamen bitti" gibi iddialar geçersiz.
- [x] **AK-01 — Ortak orijinal G5.4 komuta sözleşmesi:** G5.4 native issueOrder, setFormation, setFireMode, setDestination, appendWaypoint, setFacing, clearFacing, setSpacing, setFrontage, setDepthScale ve clearWaypoints için küçük, testli fail-closed adaptör. Kuşatma bölümünde önceki dört gerçek emir korunurken 7 orijinal emir, 6 formasyon, 3 ateş modu ve kale taktik haritasından tıkla/Shift+tıkla hedef/ara nokta eklendi. Yalnız **oyuncunun gerçek native G5.4 bölüğü**, takım aidiyeti ve canlı asker kayıtlarıyla çalışır. Mevcut Meydan Savaşı kaynağı değiştirilmez.
- [ ] **AK-02 — Aynı ekran/tuş/komuta UX:** Meydan Savaşı'nın kullanıcıya görünen HUD, yerleşim, mouse/klavye tuşları, bölük göstergeleri ve taktik harita davranışı eksiksiz karşılaştırılacak, tek ortak UI katmanı üretilecek. AK-01 yalnızca gerçek G5.4 komut işlevlerinin ortaklığıdır; görsel birebir eşitlik değildir.
- [ ] **AK-03 — Ortak oynanış kontrol ve savaş oturumu:** Asker/human hareket, silah, kamera, takım ve maç başlangıç/son akışları iki modda aynı G5.4 runtime servislerinden yönetilecek; kuşatma haritası ve objective FSM ek modül. İzole Three.js/Kuşatma FSM kalıntıları kademeli temizlenecek. 140 gerçek asker, FPS ölümleri/dost ateşi kuralları ve kabul edilmiş kadans korunacak.
- [ ] **AK-04 — Dört sınıf bölük komutası:** 10 tüfekli / 25 mızraklı / 15 okçu / 20 kılıçlı taraf birliklerinin yönetim UX'i; native G5.4'ün güncel yalnız bir playerControlled bölük kısıtından dolayı yeni çoklu-bölük yetki kontratı ayrı tasarlanıp testlenecek, özgün kod izinsiz değiştirilmez.
- [ ] **AK-05 — Sadece kuşatmaya özgü eklentiler:** Gerçek mevcut kapı darbeleri, çift merdiven, G5.4 sur/avlu savunması korunacak. Mancınıklar, koçbaşı, kuşatma kuleleri, kuşatma ekipmanına personel atama, sur/kapı yapısal hasarı ve açık adil hedef kuralları ilave edilecek; açık arazi moduna eklenmeyecek.
- [ ] **AK-06 — Kabul ve yayın:** Meydan ve Kale komutları için aynı eylem/durum sözleşmesi testleri, iki modda kontrollü manuel oyun; normal Windows fiziksel GPU testleri; sonra birleştirme için kullanıcıdan **açık onay**. Mevcut üçlü ana menü korunur. Kimlikler/HP/kadans/AI bakımından eski PR gerilemeleri yasak.

AK-01 kaynak kodu: `recovered/army/modules/shared-g54-army-commands.js` + `recovered/siege/siege-real-army-overlay.js` + `recovered/siege/test_shared_g54_army_commands.mjs`. Kaynak testleri 12 yeni; birleşik paket browser testi ayrıca doğrulanacak. Henüz mancınık veya ortak HUD üretildiği iddia edilmez.



**AK-01 nihai test ve oynanabilir paket (19 Kasım 2026):** 12/12 yeni G5.4 komuta kontratı kaynağı testi, önceki 82 ile toplam **94/94 Node PASS**. [Üç modlu kaynak paket + gerçek Chromium #44545250677](https://github.com/zxc28tarik/killtheking/actions/runs/44545250677) iki iş **SUCCESS**; `PASS_AK01_SIEGE_AND_FIELD_NATIVE_G54_COMMANDS_SHARED`, `PASS_THREE_MODES_ONE_OFFLINE_HTML_CHROMIUM_SOURCE_ISOLATED`, `pageErrors=[]` ve `consoleErrors=[]`. [Ayrı Kuşatma gerçek fare/komut Chromium #44545251046](https://github.com/zxc28tarik/killtheking/actions/runs/44545251046) iki iş **SUCCESS**; `PASS_AK01_REAL_G54_FORMATION_FLANK_HOLD_AND_TACTICAL_MAP_COMMAND`. Güncel [indirilip açılabilir 3 modlu HTML ZIP artifact #14540021638](https://github.com/zxc28tarik/killtheking/actions/runs/44545250677/artifacts/14540021638), [tarayıcı ekran görüntüleri #14541280921](https://github.com/zxc28tarik/killtheking/actions/runs/44545250677/artifacts/14541280921).

**Doğru kullanıcı beklentisi / kalan açık:** AK-01 orijinal ordu komut fonksiyonlarını Kuşatma oyununa taşıdı ve G5.4 gerçek çekirdeğini kullanır. Ancak iki modun grafik/HUD, tuş kısayolları ve savaş oturumu hâlâ ayrı arayüzler; Kuşatma henüz Meydan Savaşı'nın her yönden aynı UX'li tam kopyası değildir. İlk sıradaki **AK-02** bunu düzeltir. Sadece Kale'ye mancınık, koçbaşı, sur, merdiven, kuşatma kulesi ve yapı savunma mekanikleri eklenecek; mevcut işler silinmeyecek. PR #50 taslak, `main` değişmedi, henüz Windows fiziksel GPU manuel kabulü yok.



### AK-02a — Meydan/Kale komut tuşları ve sürekli yaşayan bölük HUD'u (19 Kasım 2026)

- [x] **Ortak G5.4 klavye kontratı:** özgün Ordu Savaşı'nın gerçek KeyJ=hold, KeyK=advance, KeyZ=line ve KeyX=column; Digit7=free, Digit8=volley, Digit9=hold ateş komutları `recovered/army/modules/shared-g54-army-commands.js` içindeki tek komut köprüsüne bağlandı. Canlı G5.4 native `issueOrder`, `setFormation`, `setFireMode` dışında hasar/ordu komut simülasyonu yok.
- [x] **FPS/Kale HUD:** `#ak02-g54-commander-hud` sahnenin üstünde sürekli görünür; gerçek oyuncuya ait bölüğün türü, yaşayan asker sayısı, mevcut emir/düzen/ateş modu ve komut kabul/red mesajı içerir. Sağdaki komuta paneli ve HUD aynı native state'i okur. Seçili native formasyon/ateş komutu belirginleşir.
- [x] Güvenli kontroller: W/A/S/D, E, F, Space, 1–4, C ve ESC'ye dokunulmadı; Ctrl/Alt/Meta, tekrar tuşu, input, textarea, select ve içerik düzenleme odakları G5.4 kısayollarına kapalı. Orijinal FFA/G5.4 kaynağı ve onaylı silah dengesi değiştirilmedi.
- [x] **3 yeni AK-02a birim testiyle toplam 97/97 Node PASS.** [Gerçek bağımsız Kuşatma Chromium CI #44546610591](https://github.com/zxc28tarik/killtheking/actions/runs/44546610591) çift SUCCESS: gerçek `KeyK/KeyJ/KeyX/KeyZ` klavye olayları native emirleri değiştirdi, görünür HUD kabul edildi, page/console hatası 0. [Birleşik 3 mod Chromium CI #44546610524](https://github.com/zxc28tarik/killtheking/actions/runs/44546610524) çift SUCCESS: Arena/Ordu/Kale geçişleri ve ortak G5.4 HUD PASS, page/console hatası 0.
- [x] [Güncel üç modlu indirilebilir HTML ZIP #14541675504](https://github.com/zxc28tarik/killtheking/actions/runs/44546610524/artifacts/14541675504), [Chromium ekran görüntüleri #14540358745](https://github.com/zxc28tarik/killtheking/actions/runs/44546610524/artifacts/14540358745).
- [ ] **AK-02b:** Orijinal Meydan Savaşı HUD panellerinin görsel boyut/yerleşim/komut listesi ve tüm tuşların eksiksiz audit'i ve birebir uygulanması; şu an Kuşatma'nın kompakt yeni HUD'u **görsel olarak orijinal alan UI'nın aynısı değildir**.
- [ ] **AK-03 / AK-04 / AK-05:** Paylaşılan kamera/oyuncu kontrol katmanı, dört gerçek player bölüğünü eksiksiz komuta yetkisiyle yönetecek yapı ve yeni mancınık/koçbaşı/kuşatma kulesi içerikleri hâlâ açık. Bunlar tamamlandı iddiası yok. Taslak PR, orijinal `main`, Windows donanım GPU ve manuel oynanış onayı önceki durumda.



### AK-02b — Meydan Savaşı'ndan kanıtlanmış komuta HUD'u ve P taktik haritası (19 Kasım 2026)

- [x] **Özgün G5.4 UI araştırması:** 1.259.525 baytlık, SHA256 `1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2` gerçek Meydan Savaşı HTML arşivi, sadece okunarak `recovered/army/integration/audit_g54_army_hud.mjs` ile araştırıldı. Özgün arşivin `#meadow-army-hud` komuta paneli **sol alttadır (left-3 bottom-12)**; `P` ile tam ekran `#army-tactical-overlay` açılır. Özgün emir/faz/ateş komutlarının tam kısayolları arşivden doğrulandı; arşiv byte değişmedi.
- [x] **HUD uyarlaması:** Yeni `#ak02-g54-commander-hud`, Kuşatma canvasında sol altta. Gerçek 70+70 can sayısı, **8 canlı ordu bölüğü**, kendi bölüğünün native emir/formasyon/ateş seçimi ve **7 özgün emir, 6 formasyon, 3 ateş seçeneği** etkileşimli. Butonlar özgün `ArenaArmyBattle` komut yetkisine, G5.4 state/ownership'e bağlanır. Arka tarafta tıklamadan silah ateşi oluşması engellenir.
- [x] **Özgün Meydan Savaşı tuşları:** `G J K L U Y N` emir; `Z X B M I` düzen, `7 8 9` menzilli ateş; `[ ]` gerçek bölük aralığı; `P` tam ekran taktik harita. **G5.4 Meydan'daki `C=kare`, Kuşatma'daki mevcut `C=kayma` ile çatıştığı için** Kuşatma'da **`V=kare`** olarak güvenli ve görünür biçimde eşlendi. WASD/E/F/Space/1–4 gibi silah/hareket tuşları korunur.
- [x] **Tam ekran `P` taktik harita:** Gerçek 140 G5.4 askerin canlı konumu, 8 native bölük simgesi, sur/kapı ve iki merdiven, oyuncunun rota/ara nokta çizgileri. Haritadan **hedef, ara nokta (Shift+tık), bakış yönü ve ara nokta temizleme** `shared-g54-army-commands.js` native `setDestination/appendWaypoint/setFacing/clearWaypoints` çağrısıdır. `P/Esc` kapatır, harita açıkken FPS yürüyüş/silah ateşi engellenir.
- [x] **Düzeltme ve kabul:** 3 yeni birim testiyle **100/100 kaynak testi PASS**. [Birleşik üç modun kaynak/Chromium çalışması #44549885403](https://github.com/zxc28tarik/killtheking/actions/runs/44549885403) iki iş SUCCESS, FFA/Ordu/Kale geçişi, gerçek G5.4 sol-alt HUD/8 bölük, **pageErrors=[] / consoleErrors=[]**. [Bağımsız Kuşatma Chromium #44549885381](https://github.com/zxc28tarik/killtheking/actions/runs/44549885381) iki iş SUCCESS; G/J/K/L/U/Y/N, Z/X/V/B/M/I, [/] ve P harita, gerçek askere verilen native hedef, Esc kapatma testleri PASS. 140 asker ve kaynak hash korunuyor.
- [x] [Son üç modlu **tek çevrimdışı açılabilir HTML ZIP #14542132054**](https://github.com/zxc28tarik/killtheking/actions/runs/44549885403/artifacts/14542132054) ve [üç mod gerçek Chromium screenshot/JSON #14542621433](https://github.com/zxc28tarik/killtheking/actions/runs/44549885403/artifacts/14542621433).
- [ ] **Sınır:** Meydan Savaşı'nın özgün **HUD piksel piksel kopyası değil**, benzer etkileşim modeli ve aynı G5.4 komutlarından çalışan Kuşatma varyantıdır. Kuşatma 3B/oyuncu hareket motoru hâlâ farklı; dört birliğin tamamını kullanıcıya açmak (`AK-04`) ve mantığı tek ortak savaş oturumuna çıkarmak (`AK-03`) bekliyor. Mancınık, koçbaşı ve kuşatma kuleleri (`AK-05`) henüz başlamadı. Windows fiziksel GPU ve manuel oynanış kabulü yok; `main` / PR #50 birleştirme kullanıcı açık onayına bağlı. **Sıradaki teknik çalışma AK-03 ortak oyuncu/savaş oturumu uyarlama planı.**



### AK-03a — Meydan Savaşı + Kale Kuşatması tek G5.4 gerçek savaş oturumu sözleşmesi (19 Kasım 2026)

- [x] **Ortak oturum otoritesi:** `recovered/army/modules/shared-g54-battle-session.js` eklendi. Hem özgün `ArenaArmyBattle.create` ile açılan **Meydan Savaşı native state'i** hem de `siege-real-army-bridge.js` içindeki **Kale Kuşatması aynı gerçek `playerHealth`, `playerActive`, `playerTeam`, `playerPosition`, `playerSquadId`, `elapsed/tick` ve real 140 asker/8 bölük doğrulama sözleşmesini** kullanır. Native AI, hasar veya silah dengesi yeniden yazılmadı.
- [x] **Kale entegrasyonu:** `siege-real-army-overlay.js` her yeni takım/maç/senaryo başlangıcında gerçek G5.4 state'e bağlı *yeni bir oturum* oluşturur; `siege-player-ui.js` ve `siege-player-combat.js` bu **aynı oturum** üzerinden gerçek 3B fiziksel oyuncu pozunu native G5.4'a işler. FPS/TPS'de gerçek `playerActive`; orbit'te pasif hayalet olmayan hedef, HP=0 veya `scenario.phase===RESULT` sonrası hareket/saldırı yetkisi kapatılır. Farklı takıma veya önceki maçın state'ine bağlanma reddedilir.
- [x] **Eşitlik sınırları açık:** Gerçek HP, oyuncu-takım, maç saati ve kamera-saldırı geçerliliği **ortaktır**. Eski Meydan Savaşı HTML/runtime kaynakları byte-byte sabit; Kale Kuşatması Three.js render, 3B kamera ve hareket/slide fiziği **henüz Meydan Savaşı ile aynı algoritma değildir**. Botların tam yükseltilmiş 3B atışı yok. `AK-03b` özgün gerçek oyuncu hareket/kamera davranışı denkliğini mevcut kale fizikleri üzerine güvenli adaptörle kuracak.
- [x] 12 yeni `recovered/siege/test_shared_g54_battle_session.mjs` testi, **önceki 100 + 12 = 112/112 Node PASS**; aynı gerçek G5.4 SHA `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`.
- [x] [Üç modlu paketleme/gerçek Chromium #44551647425](https://github.com/zxc28tarik/killtheking/actions/runs/44551647425) 2/2 **SUCCESS**, `PASS_AK03A_SHARED_NATIVE_G54_BATTLE_SESSION_HUMAN_HP_CAMERA_TEAM`, pageErrors 0, consoleErrors 0. [Bağımsız Kuşatma Chromium #44551647512](https://github.com/zxc28tarik/killtheking/actions/runs/44551647512) 2/2 **SUCCESS**, `PASS_AK03A_SHARED_FIELD_SIEGE_NATIVE_140_BATTLE_SESSION_ORBIT_NO_GHOST`, pageErrors 0, consoleErrors 0.
- [x] Güncel [açılabilir üç modlu **tek HTML ZIP #14542148688**](https://github.com/zxc28tarik/killtheking/actions/runs/44551647425/artifacts/14542148688), [gerçek Chromium ekran görüntüsü/test JSON #14543901939](https://github.com/zxc28tarik/killtheking/actions/runs/44551647425/artifacts/14543901939).
- [ ] **AK-03b sıradaki:** Meydan/kuşatma kamera serbest bakış, oyuncu hareketi/slide/zıplama ve savaş kontrolünü aynı oyun hissi veren tek davranış sözleşmesine geçirmek. G54 fizik algoritması ve kuşatma taş çarpışmalarının ek görevi net ayrılacak. Gerçek Windows GPU manuel kabulü, çoklu-bölük AK-04, mancınık/kuşatma makineleri AK-05 ve `main` birleştirme hâlâ açık; kullanıcı onayı olmadan merge yok.



### AK-03b — Gerçek G5.4 oyuncu serbest fare/kamera kontrolü ve kale çarpışma sağlamlaştırması (19 Kasım 2026)

- [x] `recovered/army/modules/shared-g54-player-input.js`: gerçek G5.4 takımlarının kullandığı WASD/Space/Shift/C niyet sözleşmesi, FPS/TPS kamera fare hassasiyeti ve **3B menzilli atış yönünün kamera nişanıyla aynı yükseliş hesabını kullanması**. Orijinal Meydan Savaşı'nın kaynak HTML'si veya gerçek G5.4 AI/fizik kaynağı **değiştirilmedi**. Bu, her iki oyunun birebir aynı fizik motoruna geçirilmesi anlamına gelmez.
- [x] `siege-preview.js`: FPS/TPS oyun alanında tarayıcının gerçek **Pointer Lock** özelliğiyle fareye bağlı serbest bakış; sürükleyerek bakma fallback ve eski harita yörünge sürüklemesi korunur. FPS/TPS kamera yükselişi savaşçının gerçek musket/ok 3B nişanıyla eşitlenir. **P** taktik haritası fare kilidini bırakır; orbit kamerası bu kilidi almaz. Kayıtlı `#ak02-g54-commander-hud` üzerinde yanlışlıkla ateş edilmesi engellenir.
- [x] `siege-player-combat.js`, `siege-player-ui.js`, `siege-player-locomotion.js` aynı giriş/nişan sözleşmesini alır: mevcut kale taş/geometri swept collision, yükselti, zıplama, kayma ve orijinal G5.4 100HP / 140 asker yetkisi korunur; 2s ok germe ve 15s tüfek kadansı değişmedi.
- [x] **Gerçek hata düzeltmesi:** Bağımsız Chromium testinde önceki sol-alt HUD tıklamayı engelledi ve uzun testte bir asker için `Native G5.4 siege soldier embedded into castle stone` hatası görüldü. Test nişanı HUD dışındaki gerçek canvas noktasına taşındı. `siege-real-army-bridge.js` yeni ground-movement hedefi taşın içine gömülüyorsa askeri **bir önceki gerçek geçerli konumuna** döndürür; kimlik, HP, hit ve fiziksel takım konumlarını sahtelemez. Eğer **önceki konum da taşın içindeyse** sessiz teleport yerine hata verir.
- [x] 13 yeni input/kamera/nişan testi + 3 gerçek fiziksel duvar-çakışma geri alma testi ile toplam **128/128 kaynak testi PASS**. G5.4 asli kaynak SHA256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841` korunur.
- [x] [Bağımsız Kuşatma kaynak + Chromium #44555827457](https://github.com/zxc28tarik/killtheking/actions/runs/44555827457) **2/2 SUCCESS**; tarayıcıda gerçek fareyi kilitleyip döndürme, `P` ile gerçek kilit kaldırma, gerçek 140 asker HP/kamera/FPS ve 3B atış kuralları PASS; page/console hataları yok.
- [x] [Birleşik üç mod paketleme ve gerçek tarayıcı #44555817452](https://github.com/zxc28tarik/killtheking/actions/runs/44555817452): orijinal Arena ve Meydan kodları SHA korunarak paketlendi, 128/128 kaynak testi PASS, son Chromium sonucu kontrol edilecek. [Güncel tek çevrimdışı üç modlu HTML ZIP artifact #14545985572](https://github.com/zxc28tarik/killtheking/actions/runs/44555817452/artifacts/14545985572).
- [ ] **AK-03 kapsam sınırı:** Gerçek oyuncu oturumu (AK-03a) ile Kamera/nişan/kontrol girdileri (AK-03b) ortak davranışa uyarlanmış olsa da tarihî G5.4 Meydan'ın **tam yürüyüş/çarpışma/animasyon/kamera kaynaklarının** Kuşatma ile birebir aynı çalışma motoru olduğu iddia edilmiyor. Bu uygulama **Castle'ın özgün 3B swept physical collision** adaptörünü koruyor; tam eşitlik/manuel Windows GPU sonraki kabul. Sıradaki esas iş **AK-04 dört G5.4 bölüğün hepsinin tek oyuncu tarafından yönetilmesini yetkili/gerçek motorla tasarlamak ve doğrulamak**; sonra AK-05 mancınık, koçbaşı, kuşatma kuleleri. PR #50 ve `main` birleştirilmedi.

**AK-03b kesin nihai birleştirilmiş kabul:** [#44555817452](https://github.com/zxc28tarik/killtheking/actions/runs/44555817452) **Paketleme SUCCESS + gerçek Chromium/WebGL SUCCESS**; üç mod ve AK-03b nişan/kontrol sözleşmesi PASS; pageErrors=[]; consoleErrors=[]. Güncel [3 modlu tek çevrimdışı HTML ZIP #14545985572](https://github.com/zxc28tarik/killtheking/actions/runs/44555817452/artifacts/14545985572), [Chromium ekran görüntüsü/test raporu #14544837692](https://github.com/zxc28tarik/killtheking/actions/runs/44555817452/artifacts/14544837692). Taslak PR #50 ve main korunmuştur. AK-03b bu kapsamda tamamlandı; AK-04 açık.



### AK-04a — Kale Kuşatması'nda dört gerçek dost G5.4 bölüğüne tek tek veya toplu emir (20 Kasım 2026)

- [x] **Özgün gerçek G5.4 motoru 140 asker / 8 bölük ve SHA256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841` korunmuştur.** Kendi tarafında dört farklı hakiki bölük: 10 tüfekçi, 25 mızrakçı, 15 okçu, 20 kılıçlı. Kontrol edilen fiziksel ordu oyuncusu **yine yalnız bir** orijinal `playerSquadId`.
- [x] `recovered/army/modules/g54-four-squad-command.js`: G5.4 `issueOrder`, `setFormation`, `setFireMode`, `setDestination`, `appendWaypoint`, `setFacing`, `setSpacing`, `setFrontage`, `setDepthScale` vb **orijinal API** ile **yalnız gerçek oyuncunun takımına ait dört sayısal native ID'ye** emir. Düşman bölüğüne ve yanlış/tekrarlanan bölük kimliklerine yetki verilmez. Kalenin taş duvarı/kapalı kapısı geçersiz destinasyonu reddedilir. Menzilli toplu ateş komutu yalnız okçu ve tüfekçilerde kabul edilir.
- [x] Oyuncunun gerçekten emrettiği *diğer üç dost bölükten ilgili olanlar* fiziksel 0,08s G5.4 tick sırasında kısa süreli `playerControlled` yetkisi kazanır; `finally` ile geri alınır; fiziksel gerçek oyuncu kimliği asla değişmez. **Emir verilmemiş birlikler özgün AI planlarını sürdürür.** `siege-ladder-ai.js` otomatik merdiven görevi, oyuncunun açıkça emrettiği gerçek mızrakçı bölüğünü zorla yeniden yönetmeye çalışmaz; diğer gerçek otomatik merdiven kurucuları korunur. Kaynak hasar, gerçek HP, asker sayısı, G5.4 takım planı taklit edilmez.
- [x] `siege-real-army-overlay.js` içindeki komuta HUD'unda **Kılıçlı / Mızrakçı / Okçu / Tüfekçi / Tüm 4 Bölük** seçim düğmeleri. Gerçek yerli emir/formasyon/ateş komutları seçilen tek veya tüm gerçek takım bölüklerine gider. P taktik haritasının hedef noktası seçilen bölüğe gider; toplu modda her bölüğe yerli G5.4 yol planı ayrı hesaplanır. Ana tarihî Meydan ve Arena HTML dosyaları değiştirilmedi. **Meydan Savaşı'nın mevcut HUD'unda dört bölük düğmeleri henüz yok; bu `AK-04b` kapsamında.**
- [x] **15/15 yeni AK-04a testi** + önceki 128 = **143/143 kaynak testi PASS.** Testler: her iki tarafın tam dört rolü, tek tek ve toplu gerçek native komutlar, gerçek menzilli ateş ayrımı, düşman komut yetkisi reddi, tek fiziksel oyuncunun korunması, 60 gerçek G5.4 tick, `finally` sonrası kaynak otoritesinin restore edilmesi, gerçek taş navigasyonu, kuşatma merdivenleriyle AI yetki çatışmasının çözümü, gerçek S4 sur savunması.
- [x] [Birleşik üç mod kaynağı + gerçek Chromium #44705842525](https://github.com/zxc28tarik/killtheking/actions/runs/44705842525) 2/2 **SUCCESS**: `PASS_AK04A_FOUR_NATIVE_REAL_TEAM_SQUADS_AVAILABLE_ON_SIEGE_HUD`, 3 modda geçiş, pageErrors=[] ve consoleErrors=[]. [Bağımsız gerçek Kuşatma Chromium #44705842408](https://github.com/zxc28tarik/killtheking/actions/runs/44705842408) 2/2 **SUCCESS**: `PASS_AK04A_REAL_4_NATIVE_RED_SQUADS_INDIVIDUAL_AND_GROUP_ORDERS`, her tekli bölük ve tüm bölük grup emirleri, mavi takım yeniden yükleme, FPS mouse lock/P/Esc ve gerçek 3B atış testleri PASS; sayfa/console hatası yok.
- [x] **Güncel indirilip açılabilir tek çevrimdışı üç mod HTML ZIP:** [artifact #14615460725](https://github.com/zxc28tarik/killtheking/actions/runs/44705842525/artifacts/14615460725). Gerçek Chromium ekran görüntüsü/test raporu [#14614657487](https://github.com/zxc28tarik/killtheking/actions/runs/44705842525/artifacts/14614657487).
- [ ] **AK-04b sonraki:** Aynı seçili dört bölük arayüzünün orijinal **Meydan Savaşı'na** da orijinal kaynağı bozmadan, opt-in ortak katmandan bağlanması; UI/komutların iki modda gerçekten aynı olması. Çoklu takım koordinasyonunu ve kuşatma merdiven görevlerini manuel emirlerle zenginleştirmek. Kullanıcıdan açık onay olmadan eski `main`, orijinal gameplay kontratları veya PR #50 birleştirilmeyecek.
- [ ] **AK-05:** Mancınık, koçbaşı, kuşatma kulesi ve mühendis/ekipman emirleri henüz eklenmedi. Windows fiziksel GPU ve manuel oyun kabulü hâlâ açık. Bu aşama bitmiş tam oyun veya piksel-piksel birleşmiş iki ordu modu anlamına gelmez.



### AK-04b — ÖZGÜN Meydan Savaşı + Kale Kuşatması ortak dört gerçek G5.4 bölük komutası (20 Kasım 2026)

- [x] **Kullanıcı hedefi:** Kale Kuşatması, Meydan Savaşı'nın toplu savaş/komuta kullanımı üzerine yalnız kuşatma mekanikleri ekleyen üçüncü moddur. AK-04a Kale'de başlayan **dört gerçek dost G5.4 bölük** komutası, AK-04b ile birleşik menüdeki **Meydan Savaşı'nı oynarken de** aynı paylaşılan `recovered/army/modules/g54-four-squad-command.js` yetki/komut çekirdeğine bağlandı. 10 tüfekçi + 25 mızrakçı + 15 okçu + 20 kılıçlı, bir takım için; tek bölük veya **Tüm 4 Bölük** grubu.
- [x] **Kaynak ve ordu motoru izolasyonu:** Tarihî `recovered/army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html` SHA256 **`1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2`**, özgün true-side G5.4 motor SHA256 **`307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`** korunuyor. `build_three_mode_launcher.mjs`, onaylı iki modun **orijinal kaynağını aynen base64 olarak taşır**, yalnız kullanıcı **Meydan modunu başlattığında**, oyun iframe'ine `g54-four-squad-command.js` ile `g54-field-four-squad-runtime.js` modüllerini **çalışma anında** ekler. Arena, Kale ve tarihî arşivde bu değişiklik yok; yeni fizik/hasar mantığı üretilmedi.
- [x] **Tek paylaşılan native API:** G5.4 `create` ve `step` dışına güvenli/sınırlı opt-in sarmalayıcı konur. Gerçek 140 asker / 8 bölük / tek fiziksel gerçek oyuncu değişmez. Yalnız oyuncunun açıkça emir verdiği 1–3 ek dost bölüğe **tek native tick boyunca** komuta önceliği verilir ve `finally` ile eski `playerControlled` yetkisi geri alınır. Emir verilmemiş birimler orijinal yapay zekâ planlarına devam eder. Düşmana emir izni verilmez. Gerçek `setTargetSquad` düşman hedefleme yetkisi de aynı paylaşılan modüle, yalnız gerçek düşman ID'leri kabul edilerek eklendi.
- [x] **Meydan arayüzü:** Tarihî sol-alt G5.4 HUD ve P haritasına 4 birim seçici eklendi; fare kilidi/kaydırılabilir eski HUD üzerinde rahat kullanım için sahne sağ üstünde **sabit kompakt komuta çubuğu** bulunur. Tekli/toplu emir, formasyon, ateş düğmeleri ve P haritasında hedef/ara nokta/yön/gerçek rakip seçimi G5.4 fonksiyonlarıdır. Oyun içindeyken Esc doğal olarak duraklatır; **oyuncunun komuta çubuğuna bilinçli tıklaması** fiziksel oyuncuyu değiştirmeden orijinal G5.4 maçını devam ettirir. Test ortamında Chromium/SwiftShader'ın Esc fare kilidi sınırlamasına özgü güvenli test-only fallback vardır.
- [x] **Kısayol farkı korunur:** Tarihî Meydan'da `C=kare formasyon`, `V=oyuncu hızlı yeteneği`. Kale'de `C=kayma` ve `V=kare formasyon`. Bu özgün kontrolleri bozmamak için farkı koruduk; **iki modun her düğmesinin 1:1 aynı olduğu iddia edilmez**.
- [x] **Test ve gerçek tarayıcı:** Birleşik kaynak testleri **144/144 PASS**, orijinal arşiv/FFA/Siege BASE64 korundu. [GitHub Actions üç mod #44710751606](https://github.com/zxc28tarik/killtheking/actions/runs/44710751606) paketleme **SUCCESS** ve gerçek Chromium/SwiftShader **SUCCESS**. Canlı 140 native asker + dört gerçek mavi bölük doğrulandı, her biri ayrı seçilip G5.4 `hold` aldı, dört bölüğe birden `charge` emri uygulandı, **native komuta tick'i ve gerçek G5.4 savaş tick'i artırılarak doğrulandı**; Arena → Meydan → Kale → Arena geçişi PASS; pageErrors=[] / consoleErrors=[]; kale AK-04a mevcut dört bölük bağlantısı korundu.
- [x] İndirilebilir tek çevrimdışı üç modlu HTML ZIP: [artifact #14616662536](https://github.com/zxc28tarik/killtheking/actions/runs/44710751606/artifacts/14616662536). Gerçek Chromium ekran görüntüsü/test JSON: [#14617117112](https://github.com/zxc28tarik/killtheking/actions/runs/44710751606/artifacts/14617117112).
- [ ] **TAM adaptasyon henüz bitmedi:** Üç mod hâlâ ayrı canlı iframe/runtime; Arena ve toplu savaşın tüm oyuncu fizik/animasyon kodu ile Kale'nin hareket ve taş çarpışma denklemleri **tek bir aynı uygulama değildir**. Kale botlarının oyuncuyu gerçekten 3B karşı ateşe tutması ve yükseltilmiş sur savunucularına karşı karşılıklı 3B askeri atış (`S4B2`) henüz yok. Kuşatma makineleri (`AK-05`: mancınık, koçbaşı, kuşatma kulesi) ve gerçek Windows GPU/manuel kabul de bekliyor. İlerideki işlerin önü bu ortak komuta iskeleti ile açılmıştır.
- [ ] **Sıradaki adım:** AK-05 kuşatmaya özel mekanizmaları bu mevcut gerçek G5.4 komuta sistemine eklemek (önce koçbaşı/kapı ve yetkili hedefleme, ardından mancınık/mermi fiziği ve kuşatma kulesi/merdiven). İlgili önemli entegrasyon/merge kararları için kullanıcı açık onayı aranır. `main` branch değişmedi ve PR #50 taslak.



### AK-05a — Gerçek G5.4 mızrakçı mürettebatıyla 3B koçbaşı / kapı hasarı (20 Kasım 2026)

- [x] **Sadece üçüncü mod — gerçek kuşatma makinesi:** `recovered/siege/siege-ram.js` opt-in yeni kuşatma sistemi. `THREE.Group` içindeki ahşap gövde, demir uç, tekerlekler ve hareket/kapı vuruşu animasyonu 3B kalede gerçek konuma taşınır. Orijinal Arena/Meydan HTML'sine, G5.4 SHA-pinned motoruna veya hasar tablolarına dokunulmadı.
- [x] **Oyuncunun gerçek bölük komutu:** Saldıran kırmızı insan komutan `Mızrakçıları koçbaşına ata` düğmesiyle yalnız gerçek G5.4 25 kişilik kırmızı mızrakçı bölüğüne, AK-04'teki yetki kontrolünden geçen `position` emri verir. Önceden seçili ordu bölükleri otomatik olarak geri seçilir, mızrakçıların gerçek asker kimlikleri korunur. Mavi insan komutan bu saldırı aracını kontrol edemez.
- [x] **Mürettebat, doğal yürüyüş ve çarpışma:** Koçbaşı ilk noktada `(0,-73)` bekler; **en az iki** canlı, zemin üzerindeki orijinal kırmızı mızrakçı yakınındaysa G5.4 gerçek `state.tick/state.elapsed` adımlarına bağlı 2.15 birim/samiye tavanla ilerler. Mürettebatın gerçek konumlarını uydurmaz veya araçla birlikte ışınlamaz. Araç belirli mesafelerde sadece gerçek mızrakçı bölüğünün yeni rota hedefini native G5.4 `setDestination` ile tazeler. Koçbaşı mevcut kapının güvenli dış yüzünde durur. Oyun sırasında oyuncu/asker koçbaşı gövde çarpışması **henüz uygulanmadı** (ilk sürümde 3B model ve gerçek mürettebat konumu).
- [x] **Gerçek kapı ve hız kapısı:** Kapıya ulaşmış ve en az **üç** canlı mızrakçı yanında ise ancak 3,4 s'lik vuruş döngüsünden sonra, gerçek G5.4 savaş tikine bağlı **36 geçici denge hasarı** `S1 objectives.applyEvent({type:'GATE_HIT',team:'red',weapon:'ram',damage:36})` üzerinden kapının 600 HP havuzuna işlenir. Mızrakçı yoksa araç ilerlemez/vurmaz. Kapı açılırsa aynı `bridge.refreshObstacles` ile gerçek G5.4 duvar engeli kaldırılır. Bu yeni **kuşatma ekipmanı hasarıdır**, özgün G5.4'ün binalara özel vurduğu iddia edilmez; resmî denge henüz onaylanmadı.
- [x] **Gerçek test:** 13 ilk + 2 uzun/doğal yürüme = **15 AK-05a testi**. Önceki 144 ile birleşik **159/159 Node PASS** ([üç modlu kaynak/gerçek Chromium #44714266097](https://github.com/zxc28tarik/killtheking/actions/runs/44714266097)). Doğal yürüyüş testinde QA ışınlama olmadan özgün **25 mızrakçı başlangıçtan hareket etti; 19'u koçbaşına yakınlaştı, koçbaşı %100 kapı önüne ulaştı, en az 1 gerçek 36-HP koçbaşı vuruşu gerçekleşti**, 25 gerçek mızrakçı hayatta kaldı; standart 600 HP kapı ayrıca diğer özgün asker yakın dövüş vuruşlarından da hasar aldı. Daha düşük 36 HP'li kontrollü testte S1 kapı açılma FSM'si doğrulandı; bu normal oyun ayarı değildir.
- [x] Bağımsız kuşatma gerçek Chromium/SwiftShader [#44714266109](https://github.com/zxc28tarik/killtheking/actions/runs/44714266109) **iki iş SUCCESS**; model gerçek 3B mesh, kırmızı komutanın orijinal G5.4 mızrakçılara emir verebilmesi, anında yapay kapı vuruşu olmaması, mavi komutanın komutunun kilitlenmesi ve resetin temiz olması PASS; `pageErrors=[]`, `consoleErrors=[]`.
- [ ] **AK-05b sıra:** İnsan/askerle koçbaşı gövdesinin fiziki çarpışması, koçbaşını savunucuların hedefleyebilmesi, mürettebat ölünce aracın durması/yeniden görevlendirme, hareket/vuruş görsel/işitsel efektleri ve uzun süren gerçek Windows GPU oyunu. Daha sonra **AK-05c mancınık (gerçek kuşatma mermisi/3B hedef çarpışması)** ve **AK-05d kuşatma kulesi ve adam geçişi**. Bu üç mekanizma bitmeden **AK-05 TAMAMLANDI** denmez; henüz oyuncu, sürüm ve `main` merge onayı yok.



**AK-05a nihai gerçek tarayıcı ve 3-mod artefakt kabulü (20 Kasım 2026):** [Üç modlu birleşik build/Chromium #44714266097](https://github.com/zxc28tarik/killtheking/actions/runs/44714266097) **2/2 SUCCESS**. 159/159 otomatik kaynak testi, orijinal Arena→Meydan→Kale→Arena giriş/çıkış ve `PASS_AK05A_CASTLE_ONLY_REAL_3D_RAM_NATIVE_G54_PIKES_NO_GATE_HIT`, `pageErrors=[]`, `consoleErrors=[]`. [Bağımsız Kale aday/Chromium #44714266109](https://github.com/zxc28tarik/killtheking/actions/runs/44714266109) **2/2 SUCCESS**; `PASS_AK05A_REAL_USER_CLICK_PIKES_ASSIGNMENT_NATIVE_ORDER_WITH_NO_INSTANT_HIT` ve mavi takım yetki reddi PASS. **İndirip çıkarıp çevrimdışı açılabilir tek üç modlu HTML ZIP:** [GitHub Actions artifact #14618187313](https://github.com/zxc28tarik/killtheking/actions/runs/44714266097/artifacts/14618187313). [Gerçek Chromium ekran görüntüleri/JSON #14619560387](https://github.com/zxc28tarik/killtheking/actions/runs/44714266097/artifacts/14619560387). Bu kanıtlar Windows gerçek donanım GPU/insan oynanış kabulü yerine geçmez. `main` değişmedi ve PR #50 taslak.
