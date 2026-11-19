# Kill the King — Kuşatma Kalesi S1/S2/S3/S3C1/S3C2/S3C3

**Durum:** S1 hedef motoru, S2 dolaşılabilirlik, S3 gerçek G5.4 140 asker, S3C1 doğal kapı kırma, S3C2 iki canlı asker merdiveni ve **S3C3 gerçek avlu/iç kale zafer mantığı** kodlandı. Normal 70v70 gerçek motor doğuşundan saldıranlar **109,36 oyun saniyesinde keep'i ele geçirdi**. Ancak **mavi AI'nın kale savunması, asıl FPS/TPS silahlı oyuncu, üç boyutlu silah balistiği ve yayın/GPU kabulü hâlâ AÇIK.** Bu klasör yeni **tek bir kuşatma senaryosu** için ayrılmıştır. FFA/TDM, özgün kale, çimenlik meydan ve G5.4 ordu modları bu aşamada değiştirilmedi.

## Tasarım ve plan

- [Aşamalı uygulama planı](../../docs/SIEGE_CASTLE_DEVELOPMENT_PLAN_TR.md)
- [Kale, kuşatma, bölge ve zafer sözleşmesi](../../docs/SIEGE_CASTLE_DESIGN_CONTRACT_TR.md)

## S1'de uygulananlar

1. `siege-map.js` — Tek kuşatma kalesinin gerçek veri temsili; ana kapı, surlar, iki yan çıkış, dış saldırı hattı, iç avlu ve komuta noktası. Her taraf için 10 tüfekçi + 25 mızrakçı + 15 okçu + 20 kılıçlı **yerleşim planı**.
2. `siege-objectives.js` — Bağımsız, deterministik `APPROACH → BREACH → COURTYARD → KEEP → RESULT` motoru. Saldıran kırmızı, savunan mavi. Kapı HP, iki merdiven, gerçek varlık olaylarından ileride alınacak bölge kontrol verileri, zaman sınırı ve kazanma koşulları.
3. `siege-preview-template.html` + `siege-preview.js` — Yerel Three.js ile ayrı **3B kale ve 140 statik yerleşim işareti**. İşaretler asker AI'sı değil. Butonlar yalnız **elle verilen test olayları** gönderir; gerçek asker kapı kırıyormuş gibi sunulmaz.
4. `build_siege_preview.mjs` — Dışa bağımlılığı olmayan, Three.js r128 dahil gömülü **tek çevrim dışı HTML** üretir; SHA-256 kaynak manifesti oluşturur.
5. `test_siege_phase1.mjs` ve `browser_siege_preview_smoke.mjs` — Faz geçişleri, güvenlik, gerçek WebGL sahnesi ve UI testleri.

## Doğrulanmış ilk S1 kanıtı

- [GitHub Actions #44311605691 — **SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44311605691)
- **21/21 Node.js kuşatma testleri PASS.**
- **Gerçek Chromium yazılımsal WebGL PASS:** 3B kale açıldı, 140 **statik asker yerleşim işareti** oluştu, batı merdiveni kapı sağlamken açıldı, avlu fazına geçildi, yeniden başlatma sıfırladı, kapı düğmelerle kırılınca 3B kapı görünümden kalktı; `pageErrors=[]`, `consoleErrors=[]`.
- **Üretilen HTML SHA-256:** `fdc3d05b156c1d653a2163aef6da77f9493e99d33e0b8494994e178eb535b434` (ilk S1 sürümü).
- [Oynanabilir **harita/hedef önizlemesi** HTML artifact #14430702069](https://github.com/zxc28tarik/killtheking/actions/runs/44311605691/artifacts/14430702069).
- [WebGL ekran görüntüleri ve olay JSON'ları #14429709128](https://github.com/zxc28tarik/killtheking/actions/runs/44311605691/artifacts/14429709128).

**UYARI:** HTML **kale/hedef önizlemesidir**, henüz gerçek FPS/TPS savaşı değildir. 140 asker simüle edilmedi. Gerçek GPU Windows kabulü, G5.4 gerçek 140 asker entegrasyonu, kale kapısının gerçek asker hasarı, A* merdiven, animasyon ve kazanma dengesi S2–S6 kapsamındadır.

## S2 — FPS/TPS kale keşfi, gerçek klavye ve dinamik çarpışma

- Yeni `siege-traversal.js`: gerçek kale collider'larını kullanan süpürmeli oyuncu hareketi; kapı açık/kapalı durumunda doğru çarpışma; kapı ve iki yan çıkış için bağımsız hedef rotaları. Surun üzerinden kademeli **E** tırmanışı, duvarın içinden kesme yok.
- `siege-preview.js` artık **ayrı önizleme avatarına** ait FPS/TPS kamera, WASD ve E girişi, takım seçimi, taktik mini harita ve QA için açıkça etiketli konum testleri sunuyor. Ana oyundaki FPS/TPS/silah/gerçek bot motoru henüz bağlanmadı.
- [Ayrıntılı S2 test raporu](S2_CASTLE_TRAVERSAL_ACCEPTANCE_TR.md).
- [**S2 CI #44495376208 — SUCCESS**, **39/39 Node** + gerçek Chromium klavye W/E](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208).
- [**İndirilebilir S2 3B keşif önizlemesi**, artifact #14514018373](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208/artifacts/14514018373).
- [S2 Chromium ekran görüntüsü ve JSON, artifact #14514063331](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208/artifacts/14514063331).
- S2 tek HTML SHA-256: `d9c6a614a344bb5377837be5640071fa379e50920b42d6bac1cd37a9be06cdd5`. Bu sadece önizleme sürümüdür.

**S2'nin sınırı:** Gerçek G5.4 `ArenaArmyBattle` 140 asker AI, kapı hasarı, NPC merdiven navigasyonu, ana oyun FPS/TPS motoru ve gerçek GPU kabulü açık. Kalenin fizik ve yollarını önizleme içinde doğrulamak bunların bittiği anlamına gelmez.

## S3 — Değişmemiş G5.4 ile gerçek 140 asker 3B entegre aday

- `siege-real-army-bridge.js` gerçek ve SHA-pinned G5.4 `create/step/snapshot/setWorldObstacles/drainCombatEvents` kullanır. Sekiz özgün bölük ve toplam 140 asker gerçek G5.4 pozisyonlarıyla S1 kale koordinatlarında başlatılır. Kendi asker/komuta sözleşmesi korunur.
- `siege-real-army-overlay.js` aynı 140 asker modelini Three.js `InstancedMesh` ile gerçek asker koordinatlarına bağlar; gerçek insan bölüğüne mevzi tut/ilerle/hücum/geri çekil komutları ve kırmızı/mavi komutan değişimi sunar. S1/S2 önizleme HTML'si bu modun içine **yazılmadı**; yeni S3 için ayrı dosya üretilir.
- G5.4 kale engellerine kapalı kapı ve 14 duvar/siper eklenir; DEBUG kapısı açılınca engel azalır. Yaşayan gerçek askerlerin avlu/iç kale konumları okunur; sahte ele geçirme ve takım imha düğmeleri S3 modunda kapalıdır.
- **S3 gerçek 140 asker, tam kuşatma oyunu demek değildir.** Kapıya gerçek asker darbeleri, G5.4 askerlerinin 3B merdiven/sur çıkması ve ana FPS oyuncu/silahı hâlâ bağlı değil.
- [S3 gerçek asker entegrasyon raporu](../../docs/SIEGE_CASTLE_S3_REAL_ARMY_INTEGRATION_TR.md).
- [**S3B CI #44500646656 SUCCESS — 52/52 Node test + gerçek Chromium 140 asker 3B**](https://github.com/zxc28tarik/killtheking/actions/runs/44500646656).
- [**S3 3B HTML adayını indir — artifact #14517570833**](https://github.com/zxc28tarik/killtheking/actions/runs/44500646656/artifacts/14517570833).
- [Chromium ekran görüntüleri ve JSON — artifact #14517276278](https://github.com/zxc28tarik/killtheking/actions/runs/44500646656/artifacts/14517276278).

**Yeni S3 adayını üretmek:**

```bash
node recovered/siege/build_siege_real_army_candidate.mjs recovered/siege/dist/KillTheKing_Kusatma_S3_Gercek_140_Asker_Entegrasyon_Aday.html
node --test recovered/siege/test_siege_real_army_bridge.mjs
```

## S3C1 — Gerçek doğal 140 askerle kapı kırma (ayrı HTML adayı)

- `siege-structure-combat.js`: yalnız **yaşayan kırmızı kılıçlı ve mızraklı asker**, kaynak G5.4 menzil/hasar/reload doğrulandığında kapının **dış yüzüne** vuruş yapar. Özgün G5.4'ün bina saldırı API'si yoktur; bu yeni kuşatma adapter'ıdır.
- `siege-assault-navigation.js`: kırmızı yapay zekâ yakın dövüş birliklerini **gerçek asker yürüme hızında** kapının önündeki gruplu mevzilere götürür; kullanıcının yönettiği bölüğün emirlerini değiştirmez.
- `siege-real-army-bridge.js`: askerleri gerçek kale taş engellerinden geçirilmeyecek şekilde sınırlar, **kapı kırılınca orijinal G5.4 engel 15→14** olur. Fake kapı hasarı ve fake avlu zaferi düğmeleri bu modda kapalıdır.
- [**S3C1 #44504343310 — SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310): 15 yeni + 13 S3 + 39 S1/S2 = **67/67 PASS**. Native gerçek G5.4 **32 saniye yardımsız** simülasyonda **35 gerçek asker vuruşu** ile kapı **600→0 HP** oldu. Chromium/SwiftShader gerçek 3B açılış/engelleme de PASS; 32 saniyelik tam kuşatma, browser testinde değil Node gerçek motor testindedir.
- [**S3C1 indirilebilir ayrı 3B HTML — artifact #14518232667**](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310/artifacts/14518232667).
- [S3C1 Chromium ekran görüntüleri ve JSON — artifact #14518473421](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310/artifacts/14518473421).
- [**S3C1 teknik ve kanıt dokümanı**](../../docs/SIEGE_CASTLE_S3C1_GATE_ASSAULT_TR.md).

```bash
node recovered/siege/build_siege_structure_candidate.mjs recovered/siege/dist/KillTheKing_Kusatma_S3C1_Gercek_Kapi_Saldirisi_Aday.html
node --test recovered/siege/test_siege_structure_combat.mjs
```

**Hâlâ açık:** doğal asker merdiveni/sur üstü çıkışı, gerçek avlu/iç kale zaferi, ana oyunun silahlı FPS oyuncusu, 30 dk stres ve fiziksel GPU kabulü. `main` değiştirilmedi; [PR #50](https://github.com/zxc28tarik/killtheking/pull/50) taslak.

## S3C2 — İki Merdiven, Gerçek 3B Asker Geçişi

- `siege-ladder-ai.js`: gerçek G5.4 kırmızı AI mızraklıları (oyuncu mızraklıysa AI kılıçlıları) iki gerçek kale çıkışına kendi özgün hızlarında ulaşır. Merdivenleri, **yalnız sahiden orada bulunan yaşayan askerlerin** inşa ilerlemesiyle açar.
- `siege-real-army-bridge.js`: yaşayan gerçek askerler 3B S2 `stepClimb` ile 15,2 metreye çıkar; taş duvar collider'ından geçmeyip iç avluya iner, y=0 son noktasına geçer. Yüksekteki asker işgal sayılmaz ve tırmanışta 2B yakın dövüş ateşi önlenir.
- `siege-real-army-overlay.js`: askerlerin görsel Y konumu canlı gerçek G5.4 ID'sinin `siegeY` bilgisini gösterir; merdiven ve komuta ilerlemesi HUD'a eklenir.
- Gerçek S3C2 modunda **sahte merdiven/kapı/asker yok etme/ele geçirme DEBUG** butonları kapalı; önceki S1/S2 ve S3C1 bağımsız derlemeler korunur.
- [**S3C2 CI #44507678256 SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256) — **15 yeni S3C2 + 67 önceki = 82/82 PASS**. Normal 60 s G5.4 gerçek asker testi: **12 batı + 12 doğu** 3B duvar geçişi, iki merdiven 100/100 ve kapı da kırıldı. Chromium 140 asker 3B render ilk tikleri PASS; gerçek 60 s kapı ve merdiven testleri Node kaynak simülasyonudur.
- [**S3C2 tek çevrim dışı 3B HTML artifact #14520028553**](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256/artifacts/14520028553); [gerçek Chromium kanıtı #14520940410](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256/artifacts/14520940410).
- [**Ayrıntılı S3C2 teknik rapor**](../../docs/SIEGE_CASTLE_S3C2_DUAL_LADDER_TR.md).

```bash
node recovered/siege/build_siege_ladder_candidate.mjs recovered/siege/dist/KillTheKing_Kusatma_S3C2_140_Asker_Cift_Merdiven_Aday.html
node --test recovered/siege/test_siege_ladder_ai.mjs
```

**S3C3 doğal saldırgan zaferi artık PASS.** Sıradaki S3D asıl FPS oyuncu/silah entegrasyonu; S4 mavi savunma AI, ardından S5–S6 son kabul. Özgün G5.4 2B saldırı simülatörüdür: gerçek 3B mermi/ok fiziği hâlâ yoktur.

## S3C3 — Gerçek Askerler İç Avlu / Keep Ele Geçirme

- `siege-capture-ai.js` orijinal G5.4 askerlerinin gerçek HP/pozisyon/rol ve hızlarını kullanarak, kapı veya merdiven gerçekten açıldıktan sonra avluya ve iç kaleye doğal yürüyüşünü sağlar. Kapı önü bir önceki sürümdeki sonsuz ileri-geri hareket sorunu asker ID'sine bağlı **kalıcı waypoint tamamlanması** ile düzeltildi.
- S1 `ZONE_PRESENCE` / `FORCE_COUNTS` gerçek asker verisinden gelir; yalnız çekişmesiz avluda **12 saniye**, çekişmesiz iç kalede **20 saniye** tutulursa `ATTACKER_KEEP_CAPTURED`. Gerçek savunucu varsa süre sıfırlanır; sahte DEBUG zafer düğmeleri kilitli.
- [**S3C3 gerçek native 140 G5.4 asker CI #44511218460 — SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44511218460): doğal 70v70 savaş sonucu **109,36 oyun saniyesi**, **49 kırmızı / 48 mavi canlı**, keep 49 kırmızı/0 mavi; kapıdan **45 gerçek asker geçti**, keep'e **49 asker ulaştı**. Test kuralı 9 saniyeye düşürülen ayrı savunma örneği de mavi zaman zaferini doğruluyor. **97/97** Node regresyon PASS; gerçek Chromium/SwiftShader 3B ve HUD başlangıcı PASS.
- [**S3C3 ayrı tek HTML artifact #14522437522**](https://github.com/zxc28tarik/killtheking/actions/runs/44511218460/artifacts/14522437522); [Chromium ekran görüntüsü ve JSON #14523521430](https://github.com/zxc28tarik/killtheking/actions/runs/44511218460/artifacts/14523521430).
- [**Ayrıntılı S3C3 doğal maç ve eksik mavi AI raporu**](../../docs/SIEGE_CASTLE_S3C3_REAL_CAPTURE_ACCEPTANCE_TR.md).
- **S4 kritik sorun:** doğal zaferde bile **48 mavi asker** hayatta kalıp iç kaleye savunma aktaramadı. Bu nedenle tam dengeli kuşatma savunması onaylanmadı; mavi taktik ve sıkışma işlerine devam edilmeli.

```bash
node --test recovered/siege/test_siege_capture_ai.mjs
node recovered/siege/build_siege_capture_candidate.mjs recovered/siege/dist/KillTheKing_Kusatma_S3C3_Gercek_140_Asker_Kale_Ele_Gecirme_Aday.html
```

## Geliştirici komutları

```bash
node --test recovered/siege/test_siege_phase1.mjs recovered/siege/test_siege_traversal.mjs
node recovered/siege/build_siege_preview.mjs recovered/siege/dist/KillTheKing_Kusatma_Kalesi_S2_Kesif_Onizleme.html
```

Üretilen tek HTML'yi Chrome/Edge'de yerel aç. Harita kamerasında sürükleyip yakınlaştır; **FPS/TPS seçerek WASD ile yürü, E ile açık merdivene çık**, saldıran/savunan tarafı seç. Sağdaki **QA konumu** düğmeleri yalnız çarpışma denemesi için oyuncuyu yerleştirir. “Test olayları” düğmeleri S1 senaryo kurallarını sınar; gerçek savaş AI'sını gözlemlemek için kullanılmaz.

## Sıradaki adım: S3D ana FPS/TPS oyuncu ve S4 mavi kale savunması

S3C1 doğal kapı, S3C2 iki merdiven, S3C3 109,36 oyun saniyelik saldırgan keep zaferi ve kısa test süresinde savunucu zaman zaferi kaynak testlerinde PASS. **S3D:** asıl silahlı FPS/TPS oyuncuyu savaş ve HP sistemine bağla; **S4:** mavi 48 canlı askerin iç kaleyi koruyamayıp başka bölgede kalmasını iyileştir. S2 keşif avatarını gerçek silahlı oyuncu sayma; kullanıcı onayı olmadan dengeyi nihai hale getirme veya `main`e merge yapma.
