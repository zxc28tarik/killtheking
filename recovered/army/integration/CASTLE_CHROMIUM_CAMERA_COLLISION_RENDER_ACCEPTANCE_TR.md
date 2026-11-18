# Kill the King — Gerçek tarayıcı kale / sur / kamera / render kontrolü

**Tarih:** 18 Kasım 2026  
**GitHub durumu:** `codex/g54-ffa-army-isolated-launcher`, PR #48 **DRAFT**, `main` değiştirilmedi  
**Kabul statüsü:** **PASS — Chromium yazılımsal WebGL sınırlı kontrol**, **gerçek donanım GPU / tam süre / manuel Escape kabulü değil**

## Kanıtlar

- Test kaynak kodu: [browser_castle_collision_camera_render.mjs](https://github.com/zxc28tarik/killtheking/blob/codex/g54-ffa-army-isolated-launcher/recovered/army/integration/browser_castle_collision_camera_render.mjs)
- Bağımsız GitHub CI: [#44301751840 — SUCCESS](https://github.com/zxc28tarik/killtheking/actions/runs/44301751840)
- Ekran görüntüleri ve ayrıntılı JSON: [Artifact #14427040362](https://github.com/zxc28tarik/killtheking/actions/runs/44301751840/artifacts/14427040362)
- Normal kod/entegrasyon regression: [#44301751651 — SUCCESS](https://github.com/zxc28tarik/killtheking/actions/runs/44301751651)
- Tam doğal FFA 240 saniyelik oyun mantığı (ayrı test): [#44298003383 — SUCCESS](https://github.com/zxc28tarik/killtheking/actions/runs/44298003383)

## Geçen kontroller

| Kontrol | Ölçüm | Sonuç |
| --- | --- | --- |
| Kale gerçek Three.js WebGL | 83 özgün AABB çarpışma alanı, WebGL sağlıklı | **PASS** |
| Gerçek fiziksel fare + pointer lock | Oyuncu yaw `0 → 0,66`, pitch `0 → 0,4378`, kilit açık | **PASS** |
| Fiziksel W tuşu + kesintisiz RAF | Başlangıç noktasından **6,148 metre** ilerleme | **PASS** |
| Yüksek hızlı gerçek duvar sweep | **7 farklı kale duvarı, 8 X/Z testi, 280 m/s**; 0 iç içe geçme | **PASS** |
| Gerçek W + native oyuncu güncelleme döngüsü + sur | Sur 2, başlangıç **X=-45,90**, sınır **X=-45,25**, bitiş **X=-45,2501**; **30 adımda sıfır iç içe geçme** | **PASS** |
| Fare kilidini bırakma API | Oyun **paused**, menü açıldı | **PASS** |
| Menüdeki devam tuşu | Gerçek UI tıklamasıyla yeniden **playing** | **PASS** |
| Gerçek requestAnimationFrame ve render | Ek **12,5 saniye gerçek zamanlı** kontrol süresinde WebGL sağlıklı, oyun mantığı ~1,0 saniye ilerledi | **PASS (işlevsellik, performans değil)** |
| Tarayıcı JS ve konsol hatası | `[]` ve `[]` | **PASS** |
| Fiziksel ESC tuşu ile fare kilidinden çıkma | Headless Chromium tuşu yok saydı; manuel bilgisayar kontrolü yapılmadı | **OPEN** |

## Performans sınırı

Başarılı son CI'da **SwiftShader yazılımsal grafik** ile ortalama **3,3 FPS**, %1 düşük yaklaşık **2 FPS**, p95 kare süresi **488,5 ms** ölçüldü. Bu değerler **gerçek kullanıcının GPU'sunda 3,3 FPS alınır** anlamına gelmez. Yazılımsal WebGL'deki 12,5 saniye duvar-saati gözlemi yalnız render/bağlam devamlılığına ilişkin sınırlı bir sinyaldir; ne 60 FPS kabulü ne de 4 dakikalık gerçek GPU kullanım testidir.

## Değişiklik kapsamı ve açık kapılar

Test oturumunda yalnız duvar yürüyüşü için oyuncu başlangıç noktası ve yönü seçildi. Bu ayarlama **oyuna, yayımlanacak HTML'ye, harita collider'larına, silahlara, botların normal yapay zekâsına veya dengelerine yazılmadı**. Yeni test dosyası ve onun bağımsız CI iş akışı dışında kaynak kod değişmedi.

**Korunan karar:** FFA **arena BOT okçusu 0,5 saniye** atış hazırlığı; oyuncunun normal yayı **2 saniye ilk bırakma / 3 saniye tam güç**; ok atış aralığı 4 saniye ve 1 saniye toparlanma; G5.4 ordu motoru ayrı.

**Yayın öncesi açık işler:** normal Windows/Chrome veya Edge'de fiziksel **ESC/fare kilidi** teyidi, gerçek GPU üzerinde kesintisiz kale ve meydan 4 dakikalık performans/FPS/1% low, yük/stres testi, gerçek oyuncu ile duvar-rampa navigasyon hissi ve eksik G8.4 entegrasyonu. **PR #48 taslak; yayın için otomatik onay verilmedi.**
