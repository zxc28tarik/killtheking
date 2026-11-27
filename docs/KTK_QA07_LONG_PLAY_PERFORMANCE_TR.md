# Kill the King — QA07: İlk uzun oynanış ölçümleri (2026-11-27)

## Kaynak ve yöntem
- Arena: [45968260030](https://github.com/zxc28tarik/killtheking/actions/runs/45968260030), job 140402088077, kaynak b62ddde8ca0e2434e598130b352f91acba625402, SUCCESS.
- Meydan ve kuşatma: [45968664254](https://github.com/zxc28tarik/killtheking/actions/runs/45968664254), jobs 140403418196 / 140403418572, kaynak 7a035e9b244e4b79fb9269b7cf080e7d88246d7d, FAILURE (ekran görüntüsü zaman aşımı ve eksik aktif süre).
- 1920x1080, DPR 1, orta kalite, Chromium SwiftShader yazılımsal WebGL, otomatik oyuncu girdileri. Gerçek GPU FPS veya insan oynanış kabulü değildir. Ayrı CI koşulları, az örnek ve ağır donma nedeniyle haritalar arası oranlar yaklaşık tanısaldır.
- Oyun HTML kodu bu QA kayıt işleminde değiştirilmedi.

| Ölçüm | Arena | Meydan | Kuşatma |
|---|---:|---:|---:|
| Maç saati (s) | 600 | 480 | 480 |
| Ölçülen kare aralıkları toplamı (s) | 588.91 | 470.68 | 460.53 |
| Kare aralığı örneği | 271 | 155 | 84 |
| Ortalama FPS | 0.46 | 0.33 | 0.18 |
| %1 düşük FPS | 0.13 | 0.10 | 0.06 |
| %0.1 düşük FPS | 0.12 | 0.10 | 0.06 |
| P50 kare süresi (ms) | 2216.6 | 3283.1 | 6583.1 |
| P95 (ms) | 5099.7 | 6583.1 | 9666.4 |
| P99 (ms) | 6566.5 | 10382.9 | 16732.7 |
| Maks. kare süresi (ms) | 8499.7 | 10466.2 | 16732.7 |
| >50 ms | 255 | 147 | 79 |
| >100 ms | 252 | 147 | 74 |
| >250 ms | 237 | 145 | 74 |
| >1000 ms | 191 | 126 | 66 |
| Maks. draw call (1 sn+ örneklem) | 751 | 304 | 910 |
| Maks. üçgen (1 sn+ örneklem) | 47778 | 1354091 | 974313 |
| JS heap raporu (bayt; kaba/sabit) | 26000000 | 39600000 | 47400000 |
| Long task sayısı | 791 | 581 | 567 |
| Pageerror / console error / invariant | 0/0/0 | 0/0/0 | 0/0/0 |

## Oyun davranışı ve takip maddeleri
- PERF-QA01 (yüksek, doğrulanmış yazılım WebGL stres koşulunda): 480s maç saati dolduğunda ordu simülasyonu Meydan 30.56s, Kuşatma 16.48s ilerlemiş. BUG04'te bilinçli getirilen 200ms/kare fizik telafi tavanı ağır donmada fazla süreyi atar; gerçek maç saati ilerler. Meydan 69 mavi/66 kırmızı kaldı; kuşatma 70/70, son örnekte kapı 470/600 HP, kırmızı süre nedeniyle kazandı. Aşırı düşük FPS altında maç süresi ve gerçek savaş ilerlemesi ayrışıyor. Normal GPU'da tekrarlanma ve uygun çözüm ayrıca araştırılmalı; saati körlemesine değiştirme.
- PERF-QA02 (araştırma): Arena ilk/son örneklerde geometriler 280→947, dokular 27→46; Meydan 273→294 ve 17→17; Kuşatma 999→1117 ve 46→47. Kaynak sayısı artışı ölçülmüş, fakat lazy allocation, efekt havuzu ve sınıf değişimi ayrıştırılmadığından bellek sızıntısı kanıtı değil. Heap değerleri yuvarlanmış/sabit; kesin RAM/VRAM ölçümü değil.
- PERF-QA03 (araştırma): Meydan yüksek üçgen, kuşatma yüksek draw call yükü; CPU/GPU zamanları ayrı ölçülmeli; kalite korunmalı.
- TEST-QA01 (doğrulanmış test altyapısı hatası): Ordu testlerinde ilk maç sonrası screenshot 30s timeout; ikinci maç çalışmadı. Görüntü alma zorunlu kabul kapısı olmamalı; ekran görüntüsü ayrı/opsiyonel olmalı, eksik 600 saniye yeniden ölçülmeli.
- TEST-QA02 (doğrulanmış test raporu hatası): Arena çoklu maç dakika/spike indekslemesinde offset saniye, activeT milisaniye. İkinci maç ilk iki dakikaya karışmış, 9–10 boş. Genel FPS ve toplam kare aralığı dağılımı etkilenmez; dakika tablosu ve spike konumları düzeltmeden kullanılmamalı.
- QA-OBS01 (araştırma): Ordu maç sonuç nesnesi legacy Arena bot standings alanını da taşıyor; gerçek kazanan ve ordu snapshot doğru. UI'de yanlış gösterildiği doğrulanmadı; export/veri sözleşmesi kontrol edilebilir.

## Kapanış
Arena iki doğal maç tamamladı (8+2); savaşlar için yalnız 8 dakikalık ilk maç tamamlandı. Tam 30 dakikalık kabul henüz yok. Her üç raporda tarayıcı JS/console/invariant hatası yok; bu tüm oynanış hatalarının yokluğunu kanıtlamaz. Ham JSON ve varsa screenshot ilgili Actions artefaktlarında. Yeni test altyapısı ve normal donanım karşılaştırması yapılmadan performans kesinleştirilmez.
