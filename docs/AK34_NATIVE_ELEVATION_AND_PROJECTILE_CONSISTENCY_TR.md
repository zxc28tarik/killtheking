# Kill the King — AK34: G5.4 üç boyutlu nişan, gövde ve sur mermi örtüsü

25 Kasım 2026 | Üçüncü harita, Kale Kuşatması | PR #86 geliştirme dalı

## Gerçekten yapılanlar

- **Aynı 140 G5.4 askeri** kullanılır; askerlerin gerçek \`siegeY\` değeri artık sadece kuşatma kulesinin sonradan boyanan modeli değil, orijinal G5.4 instanced render kökünün Y pozisyonudur. Önceki ikinci matris yükseltmesi kaldırıldı. Arena ve Meydan'da \`siegeY\` yoksa yüksekliği **sıfırdır**.
- **Gövde ışınları** her askerin kendi \`siegeY + 0.20…3.55\` dikey silindirine çarpar. Surdaki asker yer düzeyinden sanki yerdeymiş gibi vurulamaz; yüksekten aşağı atışlar mevcut hedefin gerçek yüksekliğini hesaba katar.
- **Tüfekçi ve okçu** kendi gerçek yüksekliklerinden ateş eder. Oklar G5.4'ün mevcut balistik havuzu, uçuş süresi, yerçekimi ve ilk gerçek gövde/kaya temasını kullanır. Silah hasarı ve atış hızı değişmez. Birbirini örten dost asker kontrolü dikey ayrımı da dikkate alır.
- **İnsan oyuncunun** sur rampasına çıktıktan sonraki ayak kotu G5.4'e geçirilir. G5.4 oyuncu silindiri artık o kotta test edilir; zemindeki oyuncuya atılan yüksek mermi ve surdaki oyuncuya atılan düşük mermi hayalî isabet oluşturmaz.
- **Gerçek AK32 mazgallar ve yüksek taş geçişler**, üçüncü haritada yalnız 3B ok/mermi engelidir. Bunlar G5.4 kara seviyesi A* / \`setDestination\` engellerine **eklenmez**; yerden hayalet duvar oluşmaz.
- **Yakın dövüş**, aralarında 1,35 metreden fazla gerçek yükseklik farkı olan askeri/oyuncuyu sihirli erişimle vuramaz.
- Yüksek savaşta **yeni asker, yeni çizim nesnesi, ışık, renk, sis, animasyon sistemi, HP veya silah dengesi** eklenmez.

## Kabul/test

\`tests/siege-elevation-v34.test.mjs\` doğrudan ana HTML'deki gerçek G5.4 kodunu VM'de çalıştırır: yüksek/gövdeden aşağı ateş, gerçek taş mermi örtüsü, hayalet 2B bloklayıcı olmaması, 9 m oyuncu kapsülü, yüksekten ok atışı, 140 asker ve iki oynanabilir HTML eşliği.

> **Sınır:** Bu aşama gerçek 3B **isabet, mermi ve render temeli**dir. AK32 rampaları insan oyuncu için fiziksel ve oynanabilirdir; AK33 yer seviyesi savunması aktiftir. **G5.4 savunucu AI'ın sur üstüne gerçek rota bulup çıkması, orada mevzi tutması ve güvenli inmesi henüz uygulanmadı.** AK35'te yalnız bütün bu koşullar tek gerçek 3B aktör akışında test edilerek devreye alınmalıdır. Yalnızca modelleri yüksek sura ışınlama çözümü kabul edilmez.

## Koruma

İlk iki harita ve oyunun mevcut tek savaş motoru aynen tutulur. Main'e birleştirme yok; PR #86 taslak kalır. GitHub Actions/Chromium/WebGL ve Windows GPU oynanış kabulü tamamlanmadan tam kuşatma AI'sı ya da yayın hazır ilan edilmeyecek.
