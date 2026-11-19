# Kill the King — Kuşatma Kalesi S1/S2/S3

**Durum: S1 senaryo motoru, S2 FPS/TPS dolaşılabilirlik önizlemesi ve S3 G5.4'ün gerçek 140 askeriyle 3B kale hareket/komuta entegrasyon adayı var. Tam gerçek kuşatma AI'sı, kapı saldırısı, merdiven, asıl oyun oyuncu silahları ve yayına hazır sürüm HENÜZ TAMAMLANMADI.** Bu klasör yeni **tek bir kuşatma senaryosu** için ayrılmıştır. FFA/TDM, özgün kale, çimenlik meydan ve G5.4 ordu modları bu aşamada değiştirilmedi.

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

## Geliştirici komutları

```bash
node --test recovered/siege/test_siege_phase1.mjs recovered/siege/test_siege_traversal.mjs
node recovered/siege/build_siege_preview.mjs recovered/siege/dist/KillTheKing_Kusatma_Kalesi_S2_Kesif_Onizleme.html
```

Üretilen tek HTML'yi Chrome/Edge'de yerel aç. Harita kamerasında sürükleyip yakınlaştır; **FPS/TPS seçerek WASD ile yürü, E ile açık merdivene çık**, saldıran/savunan tarafı seç. Sağdaki **QA konumu** düğmeleri yalnız çarpışma denemesi için oyuncuyu yerleştirir. “Test olayları” düğmeleri S1 senaryo kurallarını sınar; gerçek savaş AI'sını gözlemlemek için kullanılmaz.

## Sıradaki adım: S2 üretim tamamlama ve S3

Önizlemedeki gerçek kapı/merdiven fizik sözleşmesini **ana oyun FPS/TPS karakterine**, sur üstü platform/ayak basma animasyonuna ve asker A* navigasyonuna taşı. Ardından **S3'te** gerçek G5.4 `ArenaArmyBattle` olay/asker/komuta bağlantısını yap; **gerçek asker hasarını** kapıya ve gerçek asker işgalini avlu/iç kale hedefine bağla. Kullanıcı onayı olmadan yeni denge veya `main` değişimi yok.
