# KILL THE KING — KUŞATMA KALESİ SAVAŞI: UYGULAMA PLANI

**Tarih:** 18 Kasım 2026  
**Durum:** Kullanıcının onayladığı **1 adet ayrı kuşatma kalesi savaşı**; uygulama başlangıcı.  
**Geliştirme dalı:** `codex/s1-siege-castle-phase1` (temel: `codex/g54-ffa-army-isolated-launcher`).  
**Önemli:** Ana dalı, FFA/TDM'yi, G5.4 ordu adayını, tarihî HTML'yi veya mevcut silah sürelerini değiştirme.

**S1 ilk teslim (18 Kasım):** 21/21 Node test + gerçek Chromium/SwiftShader 3B harita ve test arayüzü PASS. [İlk S1 raporu ve indirme bağlantıları](../recovered/siege/README.md). **S1 tamamlandı; S2 dolaşılabilirlik önizlemesi tamamlandı; S3 gerçek 140 askerli G5.4 motoru ve 3B asker hareketi adayı kısmen uygulandı. Gerçek yapı saldırısı/asker merdiven AI/FPS savaş ve S4–S6 hâlâ AÇIK.** Bu proje tek kuşatma senaryosudur; üçüncü FFA haritası değildir.

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

**19 Kasım — S3A/S3B gerçek ordu ve 3B asker sahnesi + S3C1 doğal asker kapı saldırısı PASS; TAM OYNANABİLİR KUŞATMA DEĞİL.** [S3 kaynak ve Chromium kanıt raporu](SIEGE_CASTLE_S3_REAL_ARMY_INTEGRATION_TR.md). Değişmemiş G5.4 gerçek `ArenaArmyBattle.create/step/snapshot` motoru ile 8 bölük ve 140 özgün asker kuşatma kalesinde doğuyor; 3B modeller artık gerçek askerlerin pozisyonlarından ilerliyor, yalnız statik işaret değil. **15/15 S3C1 + 13/13 S3A + 39/39 S1/S2 = 67/67 test PASS.** [32 saniyelik doğal asker kapı kırma kanıtı](SIEGE_CASTLE_S3C1_GATE_ASSAULT_TR.md): 35 gerçek kaynaklı saldırı ve 15→14 G5.4 engel güncellemesi. **Merdiven AI, gerçek oyuncu silahı ve tam kuşatma zaferi hâlâ AÇIK.**

- [x] **S3A gerçek motor:** 70 kırmızı / 70 mavi, sekiz özgün bölük, iki taraf komuta ve gerçek `step/snapshot/drainCombatEvents` API'si.
- [x] **S3A gerçek harita:** S1 taş engelleri orijinal G5.4 `setWorldObstacles({x,y,z,w,h,d,solid})` motoruna bağlandı. Kapı açıldığında G5.4 görüş engeli 15→14 güncellenir.
- [x] **S3A işgal okuyucu:** yaşayan gerçek asker koordinatlarından avlu/iç kale varlığı hesaplanır; 70'er asker sayısı engine/squad üzerinden doğrulanır; DEBUG elle zafer kontrolü gerçek modda engellenir.
- [x] **S3B 3B görsel aday:** gerçek 140 asker `InstancedMesh` pozisyonlarına aktarılır, oyuncu kendi gerçek bölüğüne emir verebilir, kırmızı/mavi gerçek komutan seçimi çalışır.
- [x] **S3C1 gerçek asker kapı hücumu:** yaşayan gerçek G5.4 yakın dövüş askeri, orijinal hasar/menzil/yeniden saldırma süresi ve yeni kuşatma rotasıyla **normal doğuştan** taş kapıyı kırıyor. 32 saniye gerçek engine zamanı, 35 vuruş, 600→0 HP ve gerçek collider 15→14; [CI #44504343310](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310).
- [ ] **S3C2 gerçek merdiven ve sur AI:** iki yan çıkış için yaşayan gerçek askerlerin merdiven yapması, üzerinde yükselmesi/inişi ve avluya güvenli inmesi. Kapı testinde kullanılan askerler için otomatik merdiven **henüz yok**.
- [ ] **S3C gerçek kuşatma:** askerlerin sur/merdiven/avluda özgün geometriyle doğru 3B yürümesi, gerçek zayiat/işgal ve tam maç bitişi.
- [ ] **S3D FPS/TPS ana oyun oyuncusu:** asıl karakterin silah/HP/hareket modülü ile gerçek 140 askerin aynı kuşatma savaşını oynaması.
- [x] Gerçek G5.4 `ArenaArmyBattle.create/step/snapshot` sözleşmesiyle 8 bölük ve 140 asker üret (S3A/B).
- [x] Kale engellerini **gerçek** `setWorldObstacles({x,y,z,w,h,d,solid})` üzerinden bağla (S3A ve S3C1).
- [ ] **KISMEN:** gerçek asker HP/ölüm ve konumları okunuyor, kapı darbeleri S3C1'de gerçek asker/mesafe/ritimden geliyor ve sahte kazanma düğmeleri kapalı. **Eksik:** gerçek asker merdiven, avlu ve iç kale üzerinde nihai zafer kanıtı.
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

**S3C2:** iki yan merdivenin gerçek asker/squad eylemiyle kurulması, gerçek 3B asker çıkış/inişi ve çevresel çarpışma; sonra avlu + iç kale ele geçirme, S3D FPS oyuncu entegrasyonu ve S4–S6. Başka oyun modlarının iç kodlarına dokunma, önemli denge sözleşmelerini kullanıcı onayı olmadan kilitleme.
