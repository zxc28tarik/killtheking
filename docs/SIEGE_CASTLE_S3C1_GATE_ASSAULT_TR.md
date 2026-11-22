# Kill the King — S3C1: Gerçek Askerlerin Kale Kapısına Saldırması

**Tarih:** 19 Kasım 2026  
**Durum:** **S3C1 doğal kale kapısı kuşatması kaynak testleri PASS, 3B Chromium aday yüklenmesi PASS.** Kuşatmanın diğer hedefleri, merdiven AI, ana FPS oyuncu entegrasyonu ve yayın kabulü **AÇIK**.  
**Branch:** `codex/s1-siege-castle-phase1`, [PR #50 — DRAFT](https://github.com/zxc28tarik/killtheking/pull/50); ana `main`, FFA/TDM ve mevcut G5.4 ordu oyunu korunuyor.

## Tam olarak ne yapıldı?

1. **`siege-structure-combat.js`:** G5.4 motorunun 140 yaşayan askerinden sadece gerçek **kırmızı kılıçlı ve mızraklılar** ana kapının **dış yüzüne kendi silah menzilinde** erişirse, **gerçek G5.4 `reload`, `TYPES.damage`, `TYPES.cooldown` ve `TYPES.range`** değerleriyle yeni bir **kuşatmaya özgü kapı darbesi** gerçekleştirebilir. Saldırı asli G5.4 asker nesnesinin yeniden yükleme süresini tüketir. Mavi savunucular, ölüler, dışarıda/duvarın arkasında kalanlar, okçu ve tüfekçi kapıya bu mekanikle hasar veremez.
2. **`siege-assault-navigation.js`:** Eski G5.4 **açık meydan** AI'sının bilmediği kale saldırı rotası ayrı bir uyarlayıcıdır. Oyuncunun kontrol etmediği kırmızı **kılıçlı/mızraklılar** taş kapının dışındaki takım bekleme noktalarına, gerçek asker hızını aşmadan yürür. **Oyuncunun kendi bölük komutları değiştirilmez.**
3. **`siege-real-army-bridge.js`:** Mevcut 140 özgün asker, G5.4 `step` sonucundan sonra kuşatmaya özgü, **süpürmeli kale engel kontrolü**yle doğrulanır. Tüm askerlerin duvarın içinden geçmesi engellenir; gerçek G5.4 asker ID/HP, 8 bölük, gerçek silah ritmi korunur. Kapı HP=0 olduğunda aynı simülasyon akışında **gerçek G5.4 `setWorldObstacles` kapı engelini kaldırır** ve oyun sahnesi açık kapıya geçer.
4. **3B HTML:** Yeni ayrı `build_siege_structure_candidate.mjs` yazıldı. S3B'yi değiştirmeden 140 asker için gerçek `InstancedMesh` konumlarını kullanan, kuşatma saldırı rotası ve kapı darbesi bağlanmış **tek çevrim dışı S3C1 adayını** derler. **Gerçek asker savaşında kapıya sahte hasar veren eski DEBUG düğmesi kapalıdır;** avlu/iç kale ve sahte toplu asker öldürme DEBUG düğmeleri de kapalı kalır.
5. **Kaynak izolasyonu:** Özgün G5.4 mirror SHA-256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841` aynıdır. Uygulama ayrı kuşatma dosyalarındadır. FFA bot okçusu 0,5s ve normal oyuncu yayı min2/tam3s gibi onaylı diğer denge kuralları değiştirilmemiştir.

## Doğal kuşatma: QA ışınlaması OLMADAN gerçek kapı kırıldı

[**GitHub CI #44504343310 — SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310) gerçek, SHA-kontrollü G5.4 motorunda `playerTeam='blue', seed=1600` ile **normal 70 kırmızı / 70 mavi asker doğuşlarından** 32 **oyun saniyesi** çalıştırıldı. Kapı kırılması için herhangi bir asker **manuel konuma taşınmadı**, fake `GATE_HIT` düğmesine basılmadı ve `dt`/asker hızı hızlandırılmadı. Her adımda orijinal G5.4 `step` kullanıldı; kuşatmaya özgü yeni **saldırı ve gerçek hızda yürüyüş adapter'ı** ayrı modda çalıştı.

| Gerçek G5.4 oyun zamanı | Gerçek asker kaynaklı kapı darbesi | Kalan kapı HP (başlangıç: 600) | Durum |
| ---: | ---: | ---: | --- |
| 4 saniye | 0 | 600 | Saldıranlar yolda |
| 8 saniye | 6 | 498 | Gerçek kılıç/mızrak darbeleri |
| 12 saniye | 12 | 392 | Kapı sağlam ama hasarlı |
| 16 saniye | 23 | 199 | Dış kapı kuşatılıyor |
| 20 saniye | 28 | 114 | Saldırı sürüyor |
| 24 saniye | 33 | 29 | Kırılmak üzere |
| 28 saniye | 35 | **0** | **Kapı kırıldı, gerçek collider kaldırıldı** |
| 32 saniye | 35 | **0** | `BREACH` aşaması, G5.4 engel 15→14 |

**Sonuç:** 32 saniyelik gerçek kaynak simülasyonunda doğal ilerleme ve **35 asker darbesi** kapıyı bitirdi; G5.4 engel dizisi 15→14 oldu. Bu tam kuşatma zaferi değildir; avlu ve iç kale ele geçirilmedi, gerçek kule/merdiven tırmanışı henüz bağlı değildir.

## Testler ve indirilebilir çıktı

- [S3C1 CI #44504343310 — **SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310): **15/15** yeni S3C1 doğrulama testi, **13/13** eski S3 gerçek G5.4 asker testi, **39/39** S1/S2 testi = **67/67 PASS**.
- Ayrıca gerçek Chromium/SwiftShader 3B test **PASS**: 140 özgün G5.4 askeri, canlı Three.js konumları, gerçek AI tikleri, kapı hasarı bağlı ve **DEBUG kapı/avlu/zafer tuşları kilitli**. **Sadece ilk 4 asli tik izlendi; Chromium testi doğal 28 saniyelik kuşatmayı sonuna kadar izlediğini iddia etmez.** `errors=[]`, `consoleErrors=[]`. Fiziksel GPU kabulü değil.
- [**Güncel S3C1 indirilebilir HTML artifact #14518232667**](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310/artifacts/14518232667) — yalnız geliştirme adayı; **847.949 byte**, SHA-256 `5789a57b208b5643063602adbfb6aaec664a6615731a4b2da8d8075c9f152987`.
- [S3C1 gerçek Chromium ekran görüntüsü / olay JSON artifact #14518473421](https://github.com/zxc28tarik/killtheking/actions/runs/44504343310/artifacts/14518473421).

## Doğru sınırlar ve bundan sonraki iş

**Önemli teknik dürüstlük:** Özgün G5.4 açık meydan motorunun bina saldırısı ve kuşatma rotası özelliği YOKTU; bu ikisi **ayrı S3C1 kuşatma kodu** olarak gerçek asker ve kendi kaynak stats bilgisi üstüne eklendi. `GATE_HIT` yeni kuşatma mekanizmasından gelir, özgün G5.4 `drainCombatEvents` içinde bina isabetiymiş gibi gösterilmez. S3C1 kapı HP=600 ve bu savaş süresi şimdilik prototip düzeyidir, kullanıcının kesinleştirdiği denge değeri değildir.

- [x] Kaynak gerçekliği, yalnız gerçek yaşayan asker, menzil ve yeniden saldırma kapısı
- [x] AI askerler doğal başlangıçtan gerçek hızda kapıya ulaşır
- [x] 32 saniyelik doğal kapı kırma, engel/rota yenileme ve geriye dönük testler
- [x] 3B çevrim dışı aday ile Chromium/SwiftShader ilk render/doğrulama
- [ ] **S3C2:** gerçek canlı askerlerin iki yan kuşatma merdiveni hazırlaması, **sura 3B çıkışı ve inişi**, içeride çarpışma/fizik ve rota seçimi
- [ ] **S3C3:** kapı kırıldıktan veya sur geçildikten sonra askerler gerçek avluyu/son iç kaleyi ele geçirir; iki taraf gerçek zafer/yenilgi
- [ ] **S3D:** gerçek silahlı FPS/TPS oyuncusu ve kamera/silah/hasar döngüsü
- [ ] S4–S6: takım koordinasyonu, görsel/animasyon, uzun süreli test, fiziksel GPU ve oyuncu kabulü

**PR #50 DRAFT**, `main` değişmedi, yayın/onay verilmedi.
