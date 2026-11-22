# Kill the King — AK26 / Gerçek Savunma Mimarili Kuşatma Kalesi

23 Kasım 2026 — yalnız üçüncü mevcut harita, Kale Kuşatması. Kullanıcı isteği: **Kale kuşatmaya karşı yapılmış bir yapı gibi çalışsın; yalnız süs değil gerçek savaş düzeni olsun.**

## Değişmezler
- Özgün AK09/G5.4 **tek FPS motoru, Arena / Meydan / Kale Kuşatması** haritaları korunur.
- İlk 28 orijinal HTML JS scripti bayt-eşit; 29. scriptte AK25 üzerinde katmanlı AK26 geometri, mevcut F6–F10 komutları aynı.
- 70 kırmızı savunucu içeride, 70 mavi saldırgan ve oyuncu dışarıda; asker yaratma/iyileştirme veya hasar dengesine müdahale yok.
- AK25 ölçüleri aynen kalır: kale yerleşimi 224×228,5 (**4,23× alan**), savaş alanı 624×624 (**8,04× alan**).
- Koçbaşı, mancınık, kuşatma kulesi ve **orijinal 600 HP'li gerçek kapı** korunur. Sahte ikinci yıkılmaz kapı eklenmez.
- FPS performans optimizasyonu sonraya, yayıncı pitch deck kullanıcı isteğine ayrılır.

## AK26 — Katmanlı, gerçek savunma

| Hat | Yapı ve işlev | Kodda bağlandığı fizik |
|---|---|---|
| 1. Yan burçlar | Güney suruna bağlanan 2 ileri çıkıntı, taş flanş ve geri dönüş savunması | Gerçek solid/collider; mermi, asker ve FPS oyuncusu geçemez |
| 2. Dış yaklaşma | İki yaklaşım traversi, toprak setler; tek merkezi saldırı/kuşatma yolu korunur | G5.4 AABB dünya engeli ve oyuncu swept collision |
| 3. Kapı gerisi | İç avluya düz merkez koşusunu kesen iç perde (dogleg), iki yan nöbet odası | Orijinal ana kapı kırıldıktan sonra da gerçek yönlendirme |
| 4. İç avlu | İki yanal savunma traversi; yerleşik saldırı kanat hedefleri açık | Orijinal pike/sword G5.4 route/check ve raycast engelleri |
| 5. İkinci savunma | Kuzey iç geçitten sonra 24 m açık orta aralıklı çift savunma duvarı ve iki arka siper | Gerçek savunma çizgisi, ikinci savaş bölgesi |

### Askerlerin gerçek konumu
- [x] Kırmızı G5.4 tüfekçiler ilk güney kapıda, mızraklı/kılıçlılar iç avluda, **15 orijinal kırmızı okçu arka hat rezervinde** başlar. Yapay birlik/yapay hasar yok.
- [x] 70/70 başlangıç tarafları AK25 koşuluyla sabit; saldırganlara ait F6–F10 ve yönlendirme AI korunur.
- [x] Burç ve iç engeller gerçek bot rotalarına (`ArenaArmyBattle.setWorldObstacles`), yerel yürüme/çarpışmaya, `nativeSiegeConstrainOriginalG54` korumasına ve `worldMeshes` üzerinden atış/taş engellerine eklenir.
- [x] Kırmızı arka okçular ele geçirilmesi gereken bölgede gerçek varlıklarıyla savunmaya katılır; yalnız sahte kazanma süresi veya avantaj kodu kullanılmaz.

### Kuşatma koridorları / kırılmayacak mekanikler
- [x] x=0 koçbaşı/doğrudan kapı girişi; z=-90→-49.
- [x] x=28 kuşatma kulesi sürme/yürüme/rampa erişimi.
- [x] (-22,-67) mancınık/okçu hizmet alanı.
- [x] x=±19 kapı sonrası iki orijinal piyade ilerleme rotası.
- [x] 16m gerçek güney kapı, 16m gerçek kuzey iç geçit ve ikinci hatta en az 24m aralık.
- [x] Arena ve Meydan haritalarında AK26 duvar/mermi engelleri devre dışı.

## Teknik dosyalar
- `recovered/native-siege/native-siege-defense-v26.js`: 19 **fiziksel** savunma bloğu + taş burç görselleri, işlev ve koridorları doğrulayan veri.
- `recovered/native-siege/siege-defense-patch-v26.mjs`: orijinal 29. scriptte bağımsız kontrollü dönüştürme. AK25 haritasından sonra çalışır.
- `recovered/native-siege/build_canonical_three_maps.mjs`: aynı özgün kanonik oyunu birleştirir.
- `recovered/native-siege/test_native_siege_defense_v26.mjs`: 19 collider, orijinal 3 kuşatma makinesinin koridorları, iki kanat ve ikinci savunma geçidi, byte-eşit 28 script.
- `recovered/native-siege/browser_canonical_three_maps.mjs`: üç gerçek oynanışın korunması ve kuşatmanın 19 fiziki savunması.
- `recovered/native-siege/browser_siege_long_session.mjs`: 140 gerçek askerin 120 oyun saniyesi hızlandırılmış kuşatma/replay testi.

## Doğrulama / kabul
- [x] Fiziksel savunma modülü, guard'lı kaynak dönüşümü ve tüm üç haritaya entegrasyonu kodlandı.
- [x] AK26 statik giriş yollarını ve AI koridorlarını özel node/browser test kapsamına dahil etme.
- [x] PR #62 son uygulama `4e003b407` için genel kaynak/HTML testleri `45084953458` PASS.
- [x] PR #62 son uygulama `4e003b407` için gerçek üç harita Chromium/SwiftShader, kale/koridor ve başlangıç 70/70 testi `45084953442` PASS.
- [x] PR #62 son uygulama `4e003b407` için orijinal 140 G5.4 askerli 120s hızlandırılmış oyun zamanı kuşatma ve replay `45084953539` PASS.
- [x] PR #62 `6016df5c` ile `main` dalına alındı (23.11.2026). Aynı merge commit için üç GitHub Actions PASS: genel oyun `45085162901`, orijinal üç harita Chromium/WebGL `45085162897`, 140 asker uzun kuşatma/replay `45085162913`.
- [ ] Gerçek Windows GPU oynayarak kontrol, görsel beğeni, kuşatma dengesi ve botların ikinci savunma hattındaki doğal davranışı manuel kabul.

Test kontrol listesi tamamlanmadan bu dalın son sürüm olduğu iddia edilmez.

## Ana dal kapanış ve test kanıtı — 23 Kasım 2026

- **AK26 mühendislik ve test aşaması tamamlandı.** 19 gerçek dünya/collider ve 5 aşamalı savunma hattı aynı AK25 kuşatma haritasına işlendi. İlk 28 orijinal script byte-eşit; yalnız 29. script ve kuşatma-özel veri katmanı düzenlendi.
- Gerçek testlerde 70 savunucu içeride, 70 saldırgan dışarıda, yeni engel içine doğan asker **0**, okçu rezervi arka hatta ve 6 temel orijinal kuşatma/baskın koridoru açık; ilk kapı ve üç makine aynı G5.4 sisteminde çalışıyor.
- Uzun kuşatma kabulü **120 oyun saniyesi hızlandırılmış gerçek döngü testidir**; 120 saniye gerçek zamanlı FPS ölçümü veya tam insan oyun dengesi testi değildir.
- Kullanıcının gerçek Windows GPU üzerinde fiziksel kale kuşatması oynayıp görsel/denge beğenisini onaylaması hâlâ **açıktır**. FPS optimizasyonu ve yayıncı pitch deck başlatılmadı.
