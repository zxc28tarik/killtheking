# P1 — Maç Sistemi 1.0 / Serbest Arena: 4 Dakika + Sıralama + Sonuç

## P0 tamamlanma koşulu
17 Ekim 2026'da kullanıcı son indirilebilir HTML'yi kontrol etti ve “onayladım her şeyi” dedi. Bu açık kabul üzerine kale çarpışması P0 takip görevi #23 kapatıldı ve gerçek P1'e geçildi.

## Ürün davranışı
- Orijinal görseller, hızlı Krunker koşu/slide-hop, FPS/TPS, dört sınıf ve altı bağımsız botlu FFA aynen korunur.
- Oyuncu **KUŞATMAYA GİR** düğmesine bastığında **240 saniyelik maç** başlar.
- Escape/fare kilidi kaybolduğunda menü açılır ve maç **duraklar**; geri girildiğinde kaldığı zamandan devam eder.
- 240 saniye sonunda sayaç yeniden başlamak yerine **00:00'da biter**, oyun simülasyonu durur ve sonuç ekranı gösterilir.
- Sıralama yedi katılımcının öldürme sayısına göre azalan, eşitlikte ölüm sayısına göre artan sıralamasıdır. İkisi de eşitse oyuncu öne alınır (kararlı teknik tie-break).
- Sonuç ekranında kazanan, sıra, isim, öldürme, ölüm ve K/D görünür.
- **TEKRAR OYNA** ile zaman ve skorlar sıfırlanır; oyuncu ve botlar güvenli doğuş noktalarına taşınır, can, durum ve eski AI rotaları temizlenir.
- **ANA MENÜ** ile menüye dönülür, eski maç sonuçları arka planda çalışmaz.

## Skor muhasebesi
- Oyuncu bot öldürürse oyuncunun kills sayacı +1, öldürülen botun arenaDeaths +1.
- Bot başka bot öldürürse saldırgan botun arenaKills +1, kurban botun arenaDeaths +1.
- Bot oyuncuyu öldürürse oyuncunun deaths +1, saldırgan botun arenaKills +1.
- Bu istatistikler sadece **skor göstergesidir**; mevcut hasar/taktik/oyun ekonomisi değiştirilmez.

## Testler / sınırlar
- Bağımsız `src/match-flow.js` ile durum geçişleri ve sıralama mantığı test edilir.
- Entegrasyon testleri oyunun sadece oynarken updateGame çağırdığını, skor muhasebesini, tekrar oyna temizliğini, HTML modalını ve pointer-lock davranışını kontrol eder.
- GitHub Actions yeni kodu, regresyonları ve **kaynaklardan üretilen tek HTML'yi** her PR ve main commit'inde sınar.
- Gerçek WebGL tarayıcısında 4 dakika kesintisiz oynama, sonuç ekranı tıklamaları ve GPU performansı hâlâ kullanıcı cihazında onaylanmalıdır. Otomatik Node testleri bunun yerine geçmez.

## Sırada
- Oynanış onayı sonrası isteğe göre canlı TAB skor tablosu, bot zorluk ve sayı seçimi, takım savaşı, harita seçimi ve daha ayrıntılı maç ayarları.
- Başka büyük P1 özellikleri bu ilk FFA maç sürümünün gerçek oynanış kabulünden sonra açılacaktır.
