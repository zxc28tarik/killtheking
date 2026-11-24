# FIT02d — Eski sınıf kartı CSS temizliği
FIT02c Chromium testi ilk çalıştırmada Playwright strict mode hatası verdi: masaüstü ve mobil amblemler aynı seçiciyle iki eleman döndürdü. Log iki elemanın da aria-pressed=true olduğunu gösteriyor. Test artık sekiz amblemin ikisinde aynı sınıfın seçili olmasını doğruluyor; dört sınıf ve üç ekran ölçüsü korunuyor.
Eski .class-card elemanları kaldırıldığı için yalnız bu kartları hedefleyen 57 CSS kuralı (13420 karakter) çıkarıldı. Ortak HUD, aktif harita düğmesi, erişilebilirlik ve karışık seçici kuralları korunuyor. Eski QA statüleri ve kalan paylaşımlı stiller sonraki incelemeye bırakıldı.
Root ve standalone aynı blob; diğer 30 script değişmedi. Yeni CI ve Chromium kabul sonucu alınmadan main'e birleştirilmez. FPS kazanımı ölçülmedi.
