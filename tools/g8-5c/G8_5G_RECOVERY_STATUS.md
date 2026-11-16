# G8.5G — kaynak kurtarma engeli ve test durumu (17 Kasım 2026)

Kullanıcının önce onayladığı, değiştirilebilir kararlar geçerlidir: bireysel FFA / ordu ayrımı, mevcut savaş dengesi, tekrarlanabilir rastgelelik tohumları, gerçek taraf değişimi, pasif olay kayıtları ve 144 ayna-maç planı.

## Bu adımdaki çıktı
- G8.4 kaynak dosyası bulundu mu? **Hayır.** Önceki konuşmada verilmiş `KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html` ve `KillTheKing_G8_4_KaynakKod.zip` bağlantıları artık mevcut oturumda gerçek dosya baytları sağlamıyor.
- G8.5G çevrimdışı yerel dosya bulucu HTML'si ve isteğe bağlı Python kaynak tarayıcısı, tamamı önceki QA araçlarını içeren yerel ZIP olarak üretildi.
- Yerel QA: önceki **307/307** ve yeni kaynak tarama/testleri **50/50**, toplam **357/357**. Testler *oyun üretim testleri değildir*. Ayrıca tek sentetik dosya seçme senaryosu Chromium/Playwright ile denendi.
- 388 önceki gerçek oyun regresyonu tekrar çalıştırılmadı; 144 gerçek ayna-maç koşusu **0/144**. G8.4/G8.5 oyunu ve `main` değiştirilmedi.
- **Önemli GitHub sınırı:** G8.5G'nin yeni tarayıcı kaynak dosyaları bu commit ile henüz GitHub'a aktarılamadı; kaynaklar indirilebilir yerel ZIP'te yer alıyor. Kodları GitHub'da mevcutmuş gibi göstermeyin.

## Devam koşulu
Kullanıcı 16 Kasım G8.4 HTML ve varsa ZIP dosyalarını yerel bilgisayarından bulup sohbete eklediğinde gerçek motor bağlantısı ve regresyon testleri yapılabilir. Eski G5.4 kaynak sürümü yeni oyunmuş gibi kullanılmayacak.

Not: Bu belge durum takibidir; oyun entegrasyon sözleşmesi olarak kullanıcıya ek onay şartı koymaz.
