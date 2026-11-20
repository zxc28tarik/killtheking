# Kill the King — S3C3: Gerçek Askerlerle Avlu, İç Kale ve Savaş Sonucu

**Tarih:** 19 Kasım 2026  
**Kapsam:** G5.4'ün 140 gerçek askeri, S3C1 doğal kapı hücumu, S3C2 doğal çift merdiven geçişi, S1'in çekişmeli alan ve zafer kuralları, yeni S3C3 hedefe yürüme katmanı.  
**Durum:** **Doğal kaynak tabanlı 70v70 saldırgan KAZANDI testi PASS.** Tam ana FPS/TPS oyuncu entegrasyonu, 3B ok/tüfek balistiği, savunucu koordinasyonu ve fiziksel Windows GPU kabulü **AÇIK**.  
**Dal:** `codex/s1-siege-castle-phase1` ve [PR #50 DRAFT](https://github.com/zxc28tarik/killtheking/pull/50). `main`, FFA/TDM ve tarihî G5.4 kaynak dosyaları değiştirilmedi.

## Yeni uygulama

1. **`recovered/siege/siege-capture-ai.js`**: Yalnız hayatta ve AI tarafından yönetilen gerçek kırmızı G5.4 askerler, gerçek **kapı açıldıktan sonra** kapıdan geçerek veya S3C2'nin gerçek 3B merdiveninden **inmişlerse** avlu hedeflerine yürüyebilir. Dışarıdaki bir asker kapı kapalıyken taşın içinden kestirme yapamaz. `ArenaArmyBattle.TYPES[type].speed` ve gerçek askerin `pace` değerine bağlı hız sınırı korunur; asker ışınlanmaz. Oyuncu komuta ettiği takımın emirleri değiştirilmez.
2. **`siege-real-army-bridge.js`**: S3C3 bağlayıcısı opt-in'dir; S1/S2/S3A/S3C1/S3C2 eski adaylar S3C3 moduna kendiliğinden geçmez. Gerçek asker konumu ve HP/ölümünden `ZONE_PRESENCE` ve `FORCE_COUNTS` üretir; S1'in `courtyardHoldSeconds=12` ve `keepHoldSeconds=20` prototip sürelerine müdahale etmez. Çekişmeli bölgede süre sıfırlanır. Kule üzerinde yüksekten geçen asker zemindeki avlu işgalcisi sayılmaz.
3. **Açık kapı yol bugfix:** İlk uzun testte askerler `(0,-53)` hazırlık noktasını geçince yön algoritması onları tekrar aynı noktaya çağırıyordu. İkinci düzeltmede her **gerçek asker ID'si için waypoint tamamlandı** durumu izlendi. Kapı açılınca **45 gerçek asker** hazırlık noktasını geçerek içeri yürüdü; 3B merdiven geçişi tamamlamış askerler de aynı hedef sistemini kullanır.
4. **`siege-real-army-overlay.js`**: Gerçek sahneye canlı `COURTYARD/KEEP/RESULT` fazı, her iki tarafın canlı avlu/iç kale varlığı, 12/20 saniyelik ele geçirme ilerlemesi ve `ATTACKER_KEEP_CAPTURED` / savunma sonucu metni eklendi. Eski sahte `gate/west/east/court/keep/wipe` DEBUG eylemleri gerçek adayda kapalı.
5. **Ayrı tek dosya HTML:** `build_siege_capture_candidate.mjs` orijinal kaynak G5.4 motorunu SHA ile pinler, yeni S3C3 modunu **ayrı HTML** üretir. S3C2 HTML ve ana oyun kaynakları değiştirilmez.

## KANIT: 140 gerçek askerle doğal S3C3 saldırgan zaferi

Kaynak: [GitHub Actions S3C3 #44511500074 — SUCCESS](https://github.com/zxc28tarik/killtheking/actions/runs/44511500074); bu koşudaki doğal kuşatma izi `S3C3_NATURAL_240_G54_REAL_MATCH`.

- **Başlangıç:** 70 kırmızı saldırgan, 70 mavi savunan; gerçek G5.4 `ArenaArmyBattle.create`, gerçek `step(.08)`, `seed=1600`, komuta edilen taraf mavi. Bütün askerler özgün kuşatma başlangıç konumlarından doğar. Hiçbir askere QA ışınlaması, `GATE_HIT` DEBUG tuşu, sahte birim öldürme veya `ZONE_PRESENCE` müdahalesi yapılmadı.
- İlk 24 saniyede avlu **22 kırmızı / 18 mavi** ile gerçek çekişmede kaldı. **Ele geçirme ilerlemesi 0:** savunucu varlığına rağmen haksız zafer verilmedi.
- 48. saniyede kapı **0 HP**, avlu **50 kırmızı / 11 mavi**; gerçek giriş ve asker kayıpları sürdü.
- 96. saniyede S1 objektifi **KEEP** aşamasına geçti: avlu 12/12 saniye tutuldu; iç kale **49 kırmızı / 0 mavi** ve keep ilerlemesi 6,64/20 saniyeye yükseldi.
- **109,36 oyun saniyesinde `phase=RESULT`, `winner=red`, `reason=ATTACKER_KEEP_CAPTURED`**. İç kale 20/20 saniye boyunca çekişmesiz tutuldu. Finalde **49 gerçek kırmızı ve 48 gerçek mavi asker hâlâ canlıydı**: bu sonuç sahte toplu imha veya tüm mavi askerlerin yok edilmesiyle oluşmadı.
- **Kapıdan gerçekten geçen 45 saldırgan asker ID'si**, avluya ulaşan **67 gerçek asker ID'si**, iç kale hedef konumuna ulaşan **49 gerçek asker ID'si**; doğal S3C2 çift merdiveninden geçen gerçek askerler de rota içine alındı.
- Maç **240 saniyelik test üst sınırını beklemeden** kendi `MATCH_FINISH` kuralıyla sona erdi. Bu sayılar **oyun simülasyon zamanı** içindir; 109,36 saniye sürekli gerçek zamanlı GPU render edildiği iddiası YOK.
- Ayrı **savunma zamanı kazanma testi** de geçiyor: TEST amaçlı `durationSeconds=9` kuralıyla gerçek, yaşayan 70v70 G5.4 askerle süre dolduğunda **`DEFENDER_HELD_TO_TIMEOUT`**. 900 saniyelik doğal savunma maçının canlı gerçek GPU kabul edildiği iddia edilmiyor.

### Test ve gerçek Chromium 3B kanıtı

- **97/97 otomatik test PASS** = 15 S3C3 (gerçek eşik, rota, çekişme, doğal saldırgan zaferi ve kısa süreli savunma) + 15 S3C2 + 15 S3C1 + 13 S3A + 39 S1/S2.
- [**Başarılı gerçek Chromium/SwiftShader #44511500074**](https://github.com/zxc28tarik/killtheking/actions/runs/44511500074): 140 özgün asker/8 bölük ve üç boyutlu sahne, canlı HUD faz ve gerçek varlık sayaçları, 8 sahte DEBUG tuşunun kilitli olması ve gerçek mavi/kırmızı oyuncu komuta seçimi doğrulandı. Native dört tikte 216 hareketli asker adımı. `pageErrors=[]`, `consoleErrors=[]`. **Bu Chromium smoke test 109,36 saniyelik tüm maçı render ederek izlemiyor.**
- [**İndirilebilir çevrim dışı S3C3 3B HTML — artifact #14524061374**](https://github.com/zxc28tarik/killtheking/actions/runs/44511500074/artifacts/14524061374) (kaynak doğruluğu için manifest dâhil); ilk onaylı S3C3 build SHA-256 **`981015df44c9a03db5f46857a23629be95b14dd0060831df11737e1c21627b05`**, **870.794 byte**.
- [**Chromium gerçek screenshot ve JSON — artifact #14522583034**](https://github.com/zxc28tarik/killtheking/actions/runs/44511500074/artifacts/14522583034).
- Özgün G5.4 motoru SHA-256 **`307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`** doğrulanıyor.

## Üretim ve oyun tasarımı açısından AÇIK KONULAR

1. **Savunucu pozisyonu ve karar zekâsı (S4)**: Doğal savaşta mavi askerlerin **48'i canlı** kalmasına rağmen keep bölgesini boş bıraktılar. Mevcut G5.4 meydan AI'sı kuşatma kale savunmasını bilmiyor; bir kısmı batı suruna yakın sıkıştı. Bu gerçek **denge ve savunma AI eksikliğidir**; saldırganın kazanması kod açısından geçerli olsa da nihai adil kale savunması onaylanamaz. S4'te mavi okçu/tüfekçi sur savunması, mızrak/kılıç avlu/keep savunması, bölük işbirliği ve anti-sıkışma yapılmalı.
2. **S3D oyuncu bütünleşmesi**: S2 keşif avatarı hâlâ eski arena/ordu oyununun tam FPS silahlı oyuncu sistemi değildir. Gerçek karakter hasarı, silah, ölüm, nişan ve komuta ile tek birleşik kuşatma oyun modu açık.
3. **G5.4 gerçek 3B atış fiziği yok**: Özgün motor 2B savaş ve yeni 3B merdiven `siegeY` adapter'ı kullanır; yükseklik temelli gerçek kurşun/ok balistiği ve sur siper ateşi yapıldı iddiası yok.
4. **S5–S6**: Animasyon, ses, görsel düzen, kale çarpışması stres testi, fiziksel Windows GPU, uzun doğal FFA/ordu/kuşatma karşılaştırmaları ve oyuncu kabulü açık.
5. **Nihai denge kararı kullanıcıya aittir**: Bu prototipin 600 kapı HP, 100 merdiven işi, 12/20 saniye işgal, 900 saniye maç değerleri kullanıcı onayı olmadan kilitlenmedi.

**S3C3 kaynak tabanlı doğal hedef/zafer kapsamı tamamlandı; tam yayın oyunu tamamlanmadı. `main` değişmedi; [PR #50](https://github.com/zxc28tarik/killtheking/pull/50) DRAFT ve birleştirilmedi.**
