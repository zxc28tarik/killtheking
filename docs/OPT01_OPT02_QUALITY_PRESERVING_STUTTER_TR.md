# OPT-01 + OPT-02 — Takılma azaltma (görsel kalite korunarak)

## Yapılanlar
- **OPT-01:** Duman, isabet kıvılcımları, patlama küpleri, meşale közleri ve ok izleri için ortak 1×1×1 kutu geometrisi ve türe göre sınırlı nesne havuzu (her tür için azami 192 boşta mesh). Her kullanımda konum, dönüş, ölçek, malzeme rengi ve opaklığı sıfırlanır. Hasar, silah fiziği ve efekt sayısı değişmez.
- Orijinal parçacık büyümesi, yeni birim geometri üzerinde `baseSize` ile aynı dünya-uzayı ölçeğinde korunur.
- Özel geometri kullanan atış ışınları, oklar ve düşen miğferlerin sahiplik / silme kuralları değiştirilmedi.
- **OPT-02:** Yakın çimen 10×10 sabit halka yuvalarıyla dünya hücrelerine bağlanır. Tam 12.000 çim aynen kalır; bir hücre geçişinde yalnızca 1.200 çim yeniden üretilir. İki eksende çapraz geçişte 2.280. Ani ışınlanmada yeniden doldurulur.
- Çimen tohumları, rengin/ölçeğin/dönüşün hesabı ve katı engelden kaçınma testi eşdeğerdir; görünür çimen yoğunluğu veya geometri azaltılmaz.
- Çimenin orijinal sabit modülü değiştirilmedi: iyileştirme, değiştirilebilir oyunun ana scriptinde uygulanır. İlk 28 korumalı script korunur; UI32 tam ekran menü korunur.

## Doğrulama
- Değişen tek inline script #28 (ana oyun). #0–27 korumalı modüller ve #29–30 menü modülleri aynıdır.
- Deterministik halka yerleşim testi: başlangıç 100/100, yatay 10/100, çapraz 19/100, teleport 100/100 yeni hücre, her adım 12.000 çim kapsamı.
- Repo testi: `tests/opt01_opt02.test.mjs` (Node syntax + havuz sınırı + tekrar kullanım + 12.000 çimen güncelleme).
- **Henüz tarayıcı FPS ve 1% low ölçümü yapılmadı**; bunu kullanıcı donanımı / Chromium ile izlemek gerekir. `krunkerPerformanceReport()` kullanılabilir.

## Sınırlar
- Işık, global renk, gölge çözünürlüğü, kaplama detayları, bot davranışı ve çarpışma kararları değiştirilmedi.
- Tam ekran başlangıç menüsü veya 3 harita giriş noktası değiştirilmedi.
