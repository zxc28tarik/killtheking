# Kill the King — S3C2: Gerçek 140 Askerle Çift Taraflı Sur Merdiveni

**Tarih:** 19 Kasım 2026  
**Durum:** **S3C2 doğal merdiven inşası + gerçek askerle 3B sur çıkış/inişi doğrulandı.** Tam kuşatma zaferi, 3B balistik atışlar, asıl FPS/TPS savaş oyuncusu ve donanım GPU kabulü **HENÜZ YOK**.  
**Dal:** `codex/s1-siege-castle-phase1` / [PR #50 — DRAFT](https://github.com/zxc28tarik/killtheking/pull/50); `main`, FFA/TDM ve mevcut G5.4 ordu modu değişmedi.

## Uygulanan kaynak ve sınırlar

- **`recovered/siege/siege-ladder-ai.js`:** Özgün G5.4 `140` asker ve `8` bölük içinden yalnız yaşayan, kırmızı, **gerçek oyuncunun komuta etmediği** AI yakın dövüş askerleri iki yan merdiven girişine **gerçek rol hızında** yürür. Normalde mızraklı bölüğü kullanılır; oyuncu kırmızı mızraklıları yönetiyorsa AI kılıçlıları devreye girer. Oyuncunun emirleri geçersiz kılınmaz.
- Her merdiven için S1'in ayrı `LADDER_BUILD` olayı ancak **sahiden girişte bulunan yaşayan G5.4 askerlerin** simülasyon zamanına göre hesaplanan inşa işinden doğar; `5 × mevcut gerçek işçi × kaynak zamanı`, tek olayda en fazla 25, `100` hedefi prototip değeri. Sahte/elle birim konumu ya da merdiven DEBUG düğmesi doğal kuşatma testine girmez.
- Merdiven açılınca gerçek asker ID/HP/komuta ve native `reload` korunur; asker mevcut S2 `beginClimb/stepClimb` 3B rotasında dış zemin → **15,2 metre** sur üstü → iç avlu zeminine iner. Yüksekliğin her aşamasında özgün kale duvar AABB çarpışması kontrol edilir, taşın içinden 2B kestirme yasaktır. Tırmanan askerin `siegeY` değeri G5.4 asli asker nesnesi üzerinde tutulur.
- **`siege-real-army-bridge.js`:** Eklenti isteğe bağlı; S3C1 ve eski S3B HTML'lerinde merdiven otomatik açılmaz. Asker yüksekliği 3B doğrulamaya katılır; surda yükselmiş asker **zemindeki avlu işgalcisi sayılmaz**. Tırmanırken 2B motorun duvarın arkasına saldırmasına karşı kaynak `reload` korunarak yakın dövüş tırmanışta bloke edilir.
- **`siege-real-army-overlay.js`:** Gerçek 140 G5.4 askerinin Three.js `InstancedMesh` yükseklikleri `siegeY` ile güncellenir, merdiven aşamaları/işgal canlı HUD'ında gösterilir. S3C2 açıkken `gate/west/east/court/keep/wipe` gibi **sahte debug kapı, merdiven veya zafer** kontrolleri devre dışıdır.
- **`build_siege_ladder_candidate.mjs`:** S2 ve S3C1 dosyalarını geriye dönük değiştirmeden **ayrı çevrim dışı HTML** derler. Kaynak G5.4 mirror SHA-256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841` ile pinli; tarihî kaynak **bayt olarak değişmedi**.

## Gerçek doğal 60 saniyelik G5.4 simülasyonu

[**GitHub Actions #44507678256 — SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256). 140 asker **özgün harita kuşatma doğuş pozisyonlarında**, herhangi bir QA ışınlaması veya dışarıdan sahte merdiven açılması olmadan başlatıldı. Native `G5.4.step` 750 kez, `dt=0.08`, gerçek toplam **60 oyun saniyesi**, `seed=1600`, savunucu oyuncu tarafı `blue`. Yeni merdiven AI'sı yalnız özgün asker kimliği, hızı ve 3B S2 geçişini kullanır. Bu kod G5.4 özgün meydan AI'sının bir parçasıymış gibi sunulmaz.

| Oyun saniyesi | Batı merdiveni | Doğu merdiveni | Batıdan geçen gerçek asker | Doğudan geçen gerçek asker | Kapı HP |
| ---: | --- | --- | ---: | ---: | ---: |
| 6 | Kapalı | Kapalı | 0 | 0 | 583 |
| 12 | 0 / 100 | 2 / 100 | 0 | 0 | 447 |
| 18 | **100 / 100 — açık** | **100 / 100 — açık** | 0 | 0 | 277 |
| 24 | Açık | Açık | **12** | **12** | 141 |
| 30 | Açık | Açık | 12 | 12 | **0 — ana kapı da kırıldı** |
| 60 | Açık | Açık | 12 | 12 | 0 |

**Gerçek 3B tepe yüksekliği: 15,2 metre**, orijinal duvar yüksekliği 13 metre. Geçişten sonra canlı askerler y=0 zeminine iner. **Doğal toplam 24 ayrı asker** iki yan geçişi tamamladı. Native asker sayılarını, komuta sahipliğini ve geçiş altitudunu kaynak testleri doğruladı. Bu **tam avlu ve iç kale zaferi değildir**.

## Test ve indirilebilir ürün

- [**S3C2 CI #44507678256 — iki job SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256): **15/15** yeni S3C2, **15/15** S3C1, **13/13** S3A ve **39/39** S1/S2 regresyon = **82/82 PASS**; kaynak G5.4 SHA pin PASS.
- Aynı koşuda **gerçek Chromium/SwiftShader 3B**: `140` asli G5.4 askerinin gerçek Three.js çizimi, `8` bölük, iki açık AI merdiven adapter'ı, her iki tarafın komutan seçimi ve test düğmelerinin kilitli olması **PASS**; dört native tikte **216 gerçek asker hareket kaydı**, **100 merdiven yönlendirme adımı**. **`pageErrors=[]`, `consoleErrors=[]`**.
- **Chromium testi 60 saniyelik merdiven çıkışlarını izlemedi:** iki yandaki 12'şer doğal asker geçişi, aynı kaynak motorunun **Node tabanlı 60 oyun saniyesi entegrasyon testinde** doğrulandı. Fiziksel Windows GPU/oyuncu testi henüz yapılmadı.
- [**İndirilebilir S3C2 çevrim dışı 3B HTML — artifact #14520028553**](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256/artifacts/14520028553), **862.245 byte**; SHA-256 `2584569b94af083156cd7cb5fab8f64dfa4d2539e426e11b3d7d103ec67b27a7`.
- [**Gerçek Chromium ekran görüntüsü ve JSON kanıtı — artifact #14520940410**](https://github.com/zxc28tarik/killtheking/actions/runs/44507678256/artifacts/14520940410).

## Sonraki işler — kullanıcı onayı gerektiren denge sözleşmeleri açık

- [x] Gerçek asker iki yan merdivene yürür; oyuncunun kendi bölük emri korunur
- [x] İki yan merdiven ayrı ayrı **yaşayan asker eyleminden** kurulur
- [x] Gerçek G5.4 asker kimliğiyle 15,2 m yükselme, sur aşma, y=0 inme ve kale collider doğrulaması
- [x] Sur üzerinde yüksekteki asker avlu işgali sayılmaz, sahte test düğmeleri kapalı
- [x] 60 s doğal gerçek G5.4 kaynak testi ve gerçek Chromium ilk 3B açılış PASS
- [ ] **S3C3:** Gerçek askeri avlu ve iç kale hedeflerine götür; savunucuyla çekişen bölgeler, asker ölümleri, geçerli süre, gerçek **Kale Ele Geçirildi / Savunuldu** sonuçları
- [ ] **S3D:** Ana oyunun gerçek FPS/TPS silah/hasar/oyuncu motoru, doğru balistik yükseklik ve oyuncu savaşına katılım
- [ ] **S4–S6:** İki tarafın ordu koordinasyonu, sur üstü gerçek atış taktiği, fizik, animasyon, uzun süre performans, Windows GPU ve kullanıcının yayın onayı

**Bu 2,5B tabanlı G5.4 AI + ayrı 3B tırmanış adapter'ıdır.** Özgün G5.4 native motorunda **üç boyutlu ok/mermi hedefleme veya yerçekimi bulunmadığından**, yüksekten yapılan gerçek ballistik mücadele ve bağımsız fiziksel asker animasyonu tamamlandı iddiası yoktur. Merdiven iş hızı ve önceki 600 HP kapı prototip değerleri nihai denge olarak kilitlenmedi. **PR #50 DRAFT; `main` değişmedi.**
