# FIT04a — Harita görsel iş yükü
Temel: main ef116869a3fb0115113c42179dc2556ed157de16. FIT03c genel ve Chromium testleri başarılı, birleştirildi.
Gizli bulutların konum güncellemesi durdurulur; görünür bulutlar aynı hız ve sarma sınırına sahiptir. Meydan'dan Arena'ya dönüşte bulutlar kaldıkları konumdan devam eder. Barut fıçısı etiketinde 28 birim eşiği korunur; uzakta projeksiyon yapılmaz, yakın etiket tek geçici vektör kullanır, değişmeyen CSS yazımları atlanır. Fıçı hasarı ve yeniden doğma süresi değişmedi.
Çimenin mevcut 20 birim bölge optimizasyonu, 12000 yakın ve 2700 genel çimen örneği, gölgeler, modeller ve çarpışmalar korunur. Harita sahnesi ayırma veya çimen yoğunluğu azaltımı bu aşamada yapılmadı.
Chromium testi görünür/gizli bulut, sarma, yakın/uzak etiket ve gereksiz DOM yazımını doğrular. FPS kazanımı ölçülmedi. Test onayı olmadan main'e birleştirilmez.
