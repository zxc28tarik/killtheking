# Kill the King — Kuşatma Kalesi S3: Gerçek G5.4 Ordusuna Geçiş

**Tarih:** 19 Kasım 2026  
**Dal:** `codex/s1-siege-castle-phase1` / PR #50 **DRAFT**. Ana oyun `main`, FFA/TDM ve ayrı G5.4 ordu modu değiştirilmedi.

## Ne gerçekten uygulandı?

1. **`siege-real-army-bridge.js` — gerçek motor:** Kod, değişmemiş `recovered/army/mirror/arena-army-battle-true-side-swap.js` kaynağındaki `ArenaArmyBattle.create(seed,role,team)`, `step`, `snapshot`, `setWorldObstacles`, `drainCombatEvents`, `drainPlayerHits`, `issueOrder` ve `setDestination` fonksiyonlarını çağırıyor. Kaynak SHA-256 **`307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`** kontrol ediliyor; özgün kaynak değişmedi.
2. **140 özgün asker + 8 bölük:** Kırmızı ve mavi takım başına 10 tüfekçi, 25 mızrakçı, 15 okçu, 20 kılıçlı; `bow` (G5.4) → `archer` (S1 harita) adı yalnız ilk yerleştirme anahtarında eşleniyor. Gerçek asker ID/HP/komuta/AI kuralları aynı kalıyor.
3. **Kale engelleri:** S1 taş duvar, kapı ve siperlerinin gerçekten katı olanları, G5.4 tarafından beklenen `{x,y,z,w,h,d,solid:true}` formatına dönüştürüldü. Başlangıç **15 G5.4 AABB engeli**; test amaçlı kapı açıldığında **14 engel**. Orijinal G5.4 görüş hattı testi kapıdan geçişi engelliyor ve kapı açılınca serbest bırakıyor.
4. **Hedefleri gerçek askerden hesaplama:** Avlu ve iç kalede `ZONE_PRESENCE` değerleri gerçekten yaşayan askerlerin **gerçek motor konumlarından** türetiliyor. Toplamlar G5.4 bölük canlı sayılarıyla çapraz kontrol ediliyor. S3 modunda test düğmeleriyle sahte avlu zaferi/asker imhası yapılamıyor.
5. **Ayrı S3B 3B HTML adayı:** Kaynağı değiştirilmemiş G5.4 motoru ve Three.js ile 140 gerçek askerin canlı pozisyonları aynı kalenin 3B `InstancedMesh` karakterlerine aktarılıyor. Oyuncu kendi gerçek bölüğüne **mevzi tut / ilerle / hücum / geri çekil** emri verebiliyor. Kırmızı/mavi komutan değişimi gerçek 140 askerli senaryo başlangıcıyla uygulanıyor. Bu mod, mevcut S2 önizleme HTML'sinin yerine geçmez; ayrı çıktıdır.
6. **Gerçekliği koruyan sınırlar:** Kapıya gerçek asker hasarı, gerçek askerlerin merdiven çıkışı, kalenin aşamalı otomatik ele geçirilmesi, ana oyundaki FPS silah/HP/ölüm döngüsü ve tam kuşatma zaferi **henüz yapılmadı**. S1 test amaçlı kapı/merdiven düğmeleri **DEBUG** olarak etiketli. Bu testte 140 gerçek askerin hareket etmesi savaşın bütün fazlarının tamamlandığını göstermez.

## Son kanıt: S3B güncel güvenli 3B HTML

- [**Güncel S3B CI #44500646656 — SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44500646656): 13/13 gerçek G5.4 test + 39/39 S1/S2 regresyon, toplam 52/52 PASS; gerçek Chromium/SwiftShader 3B entegrasyonu ve **sahte zafer kontrollerinin kapalı olması** doğrulandı; `pageErrors=[]`, `consoleErrors=[]`.
- [**İndirilebilir güncel S3B 3B HTML** artifact #14517570833](https://github.com/zxc28tarik/killtheking/actions/runs/44500646656/artifacts/14517570833). **833.677 byte**; SHA-256 `256f33b3851c0a08a5e5e8ef44e24dfd0e6e1369a85f268a563d5b149d2f7f15` (yalnız aday).
- [Gerçek Chromium ekran görüntüleri ve test JSON'u, artifact #14517276278](https://github.com/zxc28tarik/killtheking/actions/runs/44500646656/artifacts/14517276278).
- Chrome/Edge'de açıldığında ayrı bir S3 gerçek motor paneli görüntülenir: gerçek G5.4 iki tarafın yaşayan askerleri, AI tikleri, savaş olayları ve mevcut insan bölüğüne emirler. S2 harita/FPS-TPS keşif kontrolü ayrı önizleme avatarıdır; **ana oyunun gerçek silah/HP karakteri değildir**.
- **Kritik düzeltme:** `court/court-contest/keep/keep-contest/wipe` sahte debug tuşları gerçek S3 ordu adayı açıkken devre dışı kalır, `step` gerçek askerlerden varlık okur. Kapı ve merdiven testi hâlâ S1 açıkça DEBUG olaylarıyla yapılır; bunlar asker saldırısı değildir.

## CI ve gerçek tarayıcı kanıtı

- [S3A gerçek G5.4 köprü testi #44499040723 — PASS](https://github.com/zxc28tarik/killtheking/actions/runs/44499040723): **13/13** gerçek motor/yerleşim/engel/komuta/doğruluk testi PASS; **39/39** S1/S2 regresyon PASS, toplam **52/52**.
- [S3B üç boyutlu HTML ve gerçek Chromium testi #44500026890 — PASS](https://github.com/zxc28tarik/killtheking/actions/runs/44500026890): **140 gerçek hareketli G5.4 askeri / 8 bölük** doğrudan Three.js 3B sahnesine bağlandı; gerçek motor **3 tik, 0,24 oyun saniyesi ve 78 asker hareket tirk kaydı**; gerçek insan bölük komutu, mavi komutana geçiş, S1 debug kapısının G5.4 collider listesine yansıması test edildi. **Gerçek asker isabeti 0** — kısa Chromium örneklemi bir kuşatma savaşı isabet kanıtı değildir. Konsol/sayfa hatası 0.
- [İlk gerçek asker S3B HTML artifact #14515749211](https://github.com/zxc28tarik/killtheking/actions/runs/44500026890/artifacts/14515749211).
- [İlk S3B tarayıcı ekran görüntüleri / JSON artifact #14515874181](https://github.com/zxc28tarik/killtheking/actions/runs/44500026890/artifacts/14515874181).
- **Ek güvenlik düzeltmesi:** Gerçek ordu modunda `court`, `keep`, `wipe` debug düğmeleri senaryo kazandırmak için kullanılamıyor; Chromium CI bu yasaklamayı da denetliyor. Son kanıt için [S3B iş akışı](https://github.com/zxc28tarik/killtheking/actions/workflows/s3_siege_real_army_3d.yml).

## Oyun için adil açıklama

**S3A/B şu an *gerçek asker motoruyla 3B sahne entegrasyon adayıdır*, tam kuşatma modu değildir.** Askerler gerçekten orijinal AI ile hareket eder, ancak yalnız iki boyutlu G5.4 asker konumları ve yerleşik muharebe kuralları vardır; askerlerin üç boyutlu sur ve merdivenleri gerçekten tırmandığı, gerçek kapıya silahla hasar verdiği veya oyuncunun ana FPS savaş motorunda onlarla savaştığı henüz doğrulanmadı. Görsel ve native kaynak bütünlüğü kanıtları gerçek donanım GPU/FPS yayım testinin yerine geçmez.

## Sıradaki kod işleri — S3C / S4

- [ ] S3C: kapı ve merdivene yalnız gerçek asker eyleminden ve yasal silah/sürelerden gelen kuşatma etkileşimleri. Prototip **600 HP** ve merdiven süreleri henüz nihai denge onayı değildir.
- [ ] S3C: gerçek askerlerin merdiven, sur ve avluya takılmadan ilerlemesini sağlayan **3B bağlanmış AI navigasyonu ve kapı açılma planı**. Sadece 2D kale AABB ve düzleme indirgenmiş birim konumu yeterli değil.
- [ ] S3C: gerçek askerlerden gelen işgal olayı, kale ele geçirme, komutan ölümü ve iki taraf için oynanabilir nihai sonuç ekranı.
- [ ] S3D: ana oyun FPS/TPS karakterini, kendi HP/hasar/yeniden doğma mantığını ve takım komutasını aynı gerçek S3 kuşatma sahnesine taşımak; şimdiki izole keşif avatarını tam oyun saymamak.
- [ ] S4: sınıf bazlı koruma ve saldıran/savunan ordu koordinasyonu; sur ateş hattı; sıkışma/stres ölçümleri.
- [ ] S5–S6: animasyon/ses/efekt, Windows GPU ve doğal oyuncu testi, uzun stres, kullanıcı kabulü ve izinli yayın.

**Oyun sözleşmesi korunur:** FFA arena bot okçusu 0,5 saniye hazırlık; normal oyuncu yayı minimum 2/tam 3 saniye, 4 saniyelik ok aralığı/1 saniye toparlanma. Bu dalda farklı denge veya G8.4 kurtarılmış kaynak iddiası bulunmuyor. **PR #50 taslak; `main` değiştirilmedi.**
