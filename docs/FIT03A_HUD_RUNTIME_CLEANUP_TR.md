# FIT03a — HUD ve oyun döngüsü gereksiz DOM yazımları
Temel: main 6212e8372c2691054f9144cd20da8cb2ea4c8506. FIT02c/d genel CI ve Chromium kabul testleri başarılı, ana dala birleştirildi.
HUD metin ve sınıf yazımları değişiklik olduğunda yapılır. Can çubuğu, yay dolum göstergesi, hız, maç süresi, cephane, sınıf bilgileri, öldürme/ölüm sayaçları ve yetenek durumu korunur. Silah SVG yalnız sınıf simgesi değiştiğinde yeniden oluşturulur; aktif kaynakta başka SVG yazarı yoktur.
Fizik, hasar, süre akışı, bot kararları, render frekansı ve haritalar değişmedi. 31 scriptin 30'u aynı. HTML/CSS/görseller aynı. Kod boyutu 621 karakter arttı; amaç kare başı DOM işlemini azaltmaktır, dosya küçültmek değildir.
Chromium testi: on ardışık sabit HUD güncellemesinde sıfır DOM mutasyonu; silah SVG düğümünün korunması ve sınıf değişiminde gerçek yenilenme; yardımcı fonksiyonlar değişen değerleri uygular. Üç haritalı kabul ve genel CI geçmeden birleştirme yok. FPS/RAM kazanımı henüz ölçülmedi.
