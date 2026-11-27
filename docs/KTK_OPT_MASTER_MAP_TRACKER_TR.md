# KTK — OPT-MASTER / Harita bazlı kalite koruyan optimizasyon

2026-11-27. Başlangıç kanonik HTML blob: 11eda8d606c290773b04b62ea682f404b354d57a. Kullanıcı onayı: optimizasyona başla, her haritayı ayrı iş kolu olarak ele al. Bot karar sistemi, 140 asker, fizik/hasar, harita boyutları, ışık/renk ve yakın görsel kalite korunacak. FPS artışı donanım karşılaştırması olmadan ilan edilmez.

## İş kolları ve sıra

| ID | Alan | İş | Durum |
|---|---|---|---|
| A0 | Ortak QA | Arena dakika ofseti ve isteğe bağlı ekran görüntüsü; ordu 600s kabulü | Kodlandı; yeniden CI bekliyor |
| A1 | Ortak QA | 3 harita x 2 çözünürlük; CPU profiler, fizik, çim, render çağrısı, varsa GPU timer query, kaynak sayaçları | Kodlandı; CI bekliyor |
| A2 | Ortak QA | Gerçek GPU ve aynı kamera/kalite ile tekrarlanabilir baseline | Açık |
| O1 | Ortak motor | Uzun karede gerçek maç saati/simülasyon farkı; ayrı saat/iş yükü politikası, spiral-of-death engeli | Açık |
| O2 | Ortak motor | Sahiplik, dispose, pooling, transient ve tekrar maç temizliği | Açık |
| O3 | Ortak motor | Fizik broadphase/raycast ve HUD iş yükü; karar mantığı sabit | Açık |
| O4 | Ortak motor | Statik matris ve materyal paylaşımı; gölge maliyeti, kaliteyi koru | Açık |
| AR1 | Arena | 280→947 geometri, 27→46 texture artışının kaynak atfı; sınıf/death/replay ayrımı | Açık |
| AR2 | Arena | Sabit mimari batch, bot/weapon mesh kaynak paylaşımı, efekt maliyeti | Açık |
| AR3 | Arena | Sabit kamera ve savaş senaryosu; 10 dk iki doğal maç kabulü | Açık |
| ME1 | Meydan | Meshy/ucuz/uzak çim ve asker üçgen yükünü ayrı ölç | Açık |
| ME2 | Meydan | Görünürlük ve mesafeye bağlı LOD; siluet/yoğunluk korunur | Açık |
| ME3 | Meydan | 140 asker instancing/animasyon ve fizik yükü; komuta/harita korunur | Açık |
| ME4 | Meydan | 10 dk aktif oynanış, komuta/formasyon kabulü | Açık |
| KU1 | Kuşatma | 910 draw call tepe; duvar/kule/ekipman/asker ve shadow-pass atfı | Açık |
| KU2 | Kuşatma | Bölgesel statik batch, ortak geometri/materyal; collider/raycast/kapı ayrı kalır | Açık |
| KU3 | Kuşatma | Kale içi görünürlük, ekipman ve animasyon optimizasyonu | Açık |
| KU4 | Kuşatma | 10 dk aktif savaş, kapı/kuşatma makineleri/replay kabulü | Açık |
| H1 | Nihai | 263+ regresyon, 3 harita UI, hedefli BUG21–31 testleri, önce/sonra profili | Açık |
| H2 | Nihai | Gerçek donanım 1080p, ortalama/1% low/p99, görsel eşlik | Açık |

## A0/A1 kapsamı
Önceki QA07 raporunda Arena ikinci maçının saniye ofseti ms'ye çevrilmemişti. Düzeltildi. Ekran görüntüsü hatası isteğe bağlı uyarı; ordu testinde yalnız hedef süre sonunda screenshot. Kalan 600s kabulü gerçek aktif frame süresiyle yapılır. Araçların önceki eksik süreleri yeniden koşulacak. Profil işi gerçek oyun kodunu değiştirmeden yalnız QA tarayıcı oturumunda fonksiyonları ölçer; CPU örnekleyici, render çağrısı duvar süresi ve GPU extension varsa sorgu sonucu farklı metriklerdir. Draw kategorileri yaklaşık atıf; üçgen tahmini renderBufferDirect çağrılarına dayanır, gölge ve ana kamera ayrıdır. 960×540 ve 1920×1080, orta kalite yazılımsal WebGL; gerçek GPU benchmark değil. Isınma 10s, ölçüm hedefi 35s; çok ağır karelerde örnek sayısı düşük olabilir. Asıl oyun kodu değiştirilmedi.

## Kabul politikası
Her paket küçük bağımsız değişiklik, önce/sonra aynı test, kanonik HTML eşitliği, gerçek Chromium, regresyon; FPS farkı ölçülmediyse yalnız kaynak azalışı bildirilir. Harita özel sonuçlar ayrı kapanır; diğer haritalarda regresyon kabulü olmadan tamamlanmış sayılmaz. Eski dallarda unutulacak iş bırakılmaz, bu tablo güncellenir.
