# FIT04 + FIT03d — Toplu harita ve kare döngüsü temizliği
Temel: main ef116869a3fb0115113c42179dc2556ed157de16; FIT03c CI/Chromium başarılı ve birleştirildi.
Kale kuşatması: önceki 140 asker konumunu her karede yeniden oluşturan dizi ve nesneler yeniden kullanılır. Slab çarpışmasının iki ekseni geçici iç içe diziler olmadan hesaplanır; eski formül ve eşikler aynıdır. Engel listesi, kapı ve hareket kuralları değişmez.
Arena: uzaktaki fıçı ve bot etiketi projeksiyonları atlanır, fıçı vektörü yeniden kullanılır. Görünen etiketlerin mesafe eşiği ve konumu korunur.
Meydan: görünmeyen çimen ve değişmeyen tile için güncelleme çağrısı yapılmaz; 12000 yerel çimen ve deterministik dağılım korunur. Görünmeyen bulutların animasyonu durur (harita değiştirildiğinde eski konumdan devam eder).
Ortak motor: oyuncu hareketi ve TPS kamera vektörleri yeniden kullanılır. Boş hız çizgisi canvas tekrar temizlenmez; hareketten duruşa geçişte ve yeni maçta temizlenir.
Tarayıcı testi 2401 segment karşılaştırması, 140 kayıt yeniden kullanımı, bağımsız snapshot, canvas temizleme sayısı ve pasif çimen kontrolü içerir. Üç viewport ve üç harita açılışı korunur.
31 scriptin 30'u, dış HTML/CSS ve görseller değişmedi. FPS ve uzun maç ölçümü henüz yok. Tam FIT04/05/06 tamamlanmış sayılmaz. CI ve tarayıcı kabulü geçmeden birleştirilmez.
