# Kill the King — Kuşatma Kalesi S2: Oyuncu Keşfi, Kale Çarpışması ve Geçitler

**Tarih:** 19 Kasım 2026  
**Kapsam:** Kuşatma kalesinin **ayrı 3B önizlemesinde** gerçek W/A/S/D girişleri, FPS/TPS kamera, ana kapı ve iki yan merdiven; gerçek G5.4/G8.4 asker savaşına entegrasyon **henüz yok**.  
**Durum:** S2 **önizleme fizik ve dolaşılabilirlik çekirdeği PASS**; üretim oyununa entegrasyon, rampalar/sur üstü tam oyuncu gezilebilirliği, gerçek 140 asker ve kullanıcı GPU kabulü **OPEN**.

## Doğrulanmış kaynak ve yapı

- [S2 GitHub Actions #44495376208 — SUCCESS](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208), iki iş (**39/39 Node testleri** ve gerçek Chromium SwiftShader smoke) PASS.
- [Tek dosya çevrim dışı **3B keşif önizlemesi**, artifact #14514018373](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208/artifacts/14514018373).
- [S2 Chromium ekran görüntüleri ve JSON, artifact #14514063331](https://github.com/zxc28tarik/killtheking/actions/runs/44495376208/artifacts/14514063331).
- Build HTML SHA-256: `d9c6a614a344bb5377837be5640071fa379e50920b42d6bac1cd37a9be06cdd5`, **656.568 byte**. Tek dosyada özgün Three.js r128, S1 kale/hedef JS ve ayrı S2 hareket motoru bulunur.
- Build manifesti `standalonePreviewExploration=true`, `standaloneSweptCollision=true`, **`realArmyBattleConnected=false`**, **`playerFpsTpsConnected=false`** (ana oyun FPS/TPS motoruna entegrasyon anlamına gelmez).
- Oyun için kaydedilmiş orijinal FFA ve G5.4 motorları, başlatıcı ve `main` değişmedi.

## S2 gerçek fizik geliştirmeleri

| Parça | Uygulanan | Kanıt |
| --- | --- | --- |
| Gerçek kale collider verisi | S1 geometrisinden **15 katı engel** (kapı kapalı), kapı açılınca tam **1 collider** kaldırılıyor | Node + gerçek Chromium |
| Duvar geçişi | Yüksek hızlı **280 birim/saniye** hareket bile kapalı kapı veya yan duvardan geçemiyor; duvara paralel kayma | Node |
| Açık kapı | Kapı HP sıfırlanınca kapı objesi gizleniyor, collider kaldırılıyor, yeni `outer → front → gateIn → court → keep` rotası açılıyor | Node + gerçek Chromium |
| Batı ve doğu merdiveni | Her biri ayrı açılıyor. Oyuncu **E** ile sırayla yukarı, sur üstü, içeri ve aşağı ilerleyen yönlendirilmiş geçişe başlıyor; taş duvarın içinden kesilmiyor | Node tam geçiş + Chromium ilk tırmanış |
| Oyuncu hareketi | **FPS ve TPS keşif kamerası**, gerçek WASD girişi, izole fizik, iki taraf için seçilebilir güvenli spawn; fare sürükleme ile yön | Gerçek Chromium |
| Taktik mini harita | 2D yerleşimde kale, girişler, kırılan kapı ve oyuncu işareti | S2 önizleme kodu |
| Test başlangıçları | Kapı, batı/doğu girişleri için **ayrı QA ışınlama tuşları** | Yalnız fizik testi; gerçek maç navigasyon kanıtı değildir |

### Gerçek Chromium kanıtı

S2 tarayıcı testinde gerçek Playwright fiziksel **KeyW** olayları kullanıldı; hiçbir saldırı/hasar fonksiyonu çağrılmadı:

1. Oyuncu **yalnız test oturumunda** kapının 1,3 birim önüne yerleştirildi, `W` ile kapıya yürüdü. **Kapalı kapıdan geçiş engellendi:** Z `-44,65 → -43,3500001`. Gerçek kapı HP **600** kaldı.
2. Önizlemenin **test olay** tuşlarına sekiz kez basılarak kapı açıldı. Aktif collider sayısı bir azaldı; doğal yürüyüş `W` devam ettirildi. Oyuncu Z `-13,4259` noktasına ulaştı: **kapı açıkken içeri geçiş PASS**.
3. Test sahnesi sıfırlandı, oyuncu **batı surundaki test başlangıcına** taşındı; merdiven test düğmeleriyle açıldı. Gerçek **E** tuşundan sonra oyuncu **Y=0→6,3996** yükseldi, bir engelin içinde kalmadı. **Tam merdiven çıkışı** Node birim testinde ayrıca doğrulandı; Chromium'da yalnız başlangıç/yükseliş kaydı var.
4. Arayüzde **mavi savunucu + TPS** seçildi. Komutan güvenli doğuş noktasına geçti, 140 **sabit yerleşim işaretinin** sayısı değişmedi.
5. Tarayıcı testinde **`pageErrors=[]`** ve **`consoleErrors=[]`**.

Bu örneklemler **gerçek donanım GPU performans testi değildir**; Chromium yazılımsal SwiftShader koşusudur ve başlamadan oyuncuyu test konumuna taşıma kullanılmıştır.

## S2'de açık kalan üretim işleri

- [x] İki kamerayla **bağımsız önizleme** avatarı yürüyor.
- [x] Kapı açılınca aktif çarpışma ve rota güncelleniyor.
- [x] İki bağımsız sur geçişi güvenli kademeli tırmanma sunuyor.
- [x] 39/39 Node senaryo/çarpışma testi ve Chromium gerçek W/E kontrolü PASS.
- [ ] **Ana oyunun kendi FPS/TPS oyuncu kontrol motoruna** bağlantı (yalnız önizleme motoru tamam).
- [ ] Merdivende karakter animasyonu, tam sur üstü yürünebilir platform, düşme/yere basma ve NPC 3B navigasyon fiziği.
- [ ] Gerçek G5.4 `ArenaArmyBattle` 70v70 askerlerin bu kapı/merdiven yolunu kullanması.
- [ ] Gerçek asker darbesinden kapı HP; gerçek asker varlığından avlu/iç kale işgali ve zafer.
- [ ] Gerçek Windows GPU, oyuncu deneyimi ve uzun stres kabulü.

**Sıradaki geliştirme — S3 öncesi köprü:** Ordu motorunun asker/squad/komuta olaylarını veri köprüsüyle okuyup kale objektiflerini gerçek olaylara bağlamak; S2 önizlemede kullanılan oyuncu QA tuşlarını asla gerçek asker AI'sı olarak saymamak. Nihai denge parametreleri ve `main` birleştirmesi kullanıcı kararı gerektirir.
