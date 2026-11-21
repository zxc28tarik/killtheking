# AK-NATIVE-06 — Aynı Kill the King oyununda savunma dengesi / 21 Kasım 2026

**Oyunun gerçek HTML kaynağı:** \`recovered/native-siege/KillTheKing_AK_NATIVE_06_original_game_siege_map.html\`. Bu dosya tam 1.325.837 byte; SHA-256 \`8e425a47c6d581dc20fd0a734469972765effdc3ec88069beef151348ff01da8\`, Git blob \`0c8fef3a7dfb35cb667bbaa8c0c23a7cd7368276\`. Ana oyun, ayrı S3D1/iframe kuşatma motoru değildir. İlk 28 özgün üç boyutlu FPS / G5.4 / karakter / silah scripti byte-identical kalmıştır.

## Yapılanlar

- Başlangıçta **orijinal kırmızı G5.4 10 tüfekçinin** dış savunma mevzisi (-13,-53.5) yerine güneybatı dış kanat (-38,-49.5) etrafında dağıtılır. Bütün u.z değerleri -45.6 veya daha güneyde sınırlandırılır: **hiçbir asker sur collider'ının içinde doğmaz**. 140 asker/8 bölük, gerçek HP/weapon/AI korunur. Sonradan ışınlama veya hayalî asker eklenmez.
- Orijinal G5.4 her üçüncü kırmızı tüfekçi, sadece mevcut doğal **15 saniyelik** atış hakkını piyade yerine fiziksel 3B görüş hattı açıksa kuşatma ekipmanına ayırabilir. Oyun motoru tüfekçinin ateşini ikinci kez üretmez.
- Kapı yıkıldığında koçbaşı ve mancınığı hedefleme bırakılır (kapıya ihtiyaç kalmadı); fakat **hâlâ çalışan kuşatma kulesine** fiziksel karşı ateş sürer. Böylece duvar aşan kuleye savunma kalır. Gecikmeli ve ilk teması sınanan nişan korunur.
- Koçbaşı veya mancınık 0 HP'ye düşerse sağlam iken 3.1m / 3.3m olan collider yüksekliği **1.05m gerçek enkaza** düşer, orijinal bot ve FPS rota engelleri yenilenir. Sonraki maçta normal boyutlarına döner. Yıkık aracın görünmez uzun duvarı kalmaz.
- Savunucuların hayatta kalan gerçek tüfekçi sayısı HUD'da ve salt okunur QA snapshot'ında gösterilir.

## Test raporu

- \`node --check\` yeni oyun scripti **PASS**.
- \`node --test\` kaynak ve orijinal G5.4 bağımsız simülasyon kontrollü testleri **5/5 PASS**: tam 28 korunan script, 140 orijinal asker, duvar-dışı mevzi, doğal 10s seed-1600 savunma, mevcut atış saatleri ve enkaz/reset.
- 10 saniyelik seed-1600 G5.4 karşılaştırması: eski açıktaki mevzide **6**, yeni batı mevzisinde **8** gerçek tüfekçi sağ kaldı. Bu **tek seed ve kısa eşleştirme**, tüm maç dengesinin garantisi değildir.
- Chromium UI / oyun mantığı (yalnızca **test amaçlı WebGLRenderer taklidi**): Ana oyun menüsünden kale haritasına girildi, 140 gerçek asker çalıştı, başlangıçta kapı 600 HP ve ekipmanlar bağlı. Kontrollü testte yıkık ram/cat 1.05m; yeni maçta yeniden 3.1/3.3m. Kapıyı test fixture ile açtıktan sonra **orijinal kırmızı tüfekçi #72** tek doğal 15s atışla kuleye **32 hasar** verdi; yeni kule HP 368/400, sayfada JavaScript hatası sıfır.
- **Henüz geçmedi:** Gerçek WebGL GPU çizimi, doğal 4–8 dakikalık kapı/koçbaşı/mancınık/kule savaşını baştan sona kesintisiz oynama ve tüm üç haritada manuel regresyon. Kontrollü fixture tam doğal savaş olarak sunulmaz.
- Pitch deck kullanıcı başla deyince. \`main\` kullanıcının açık onayı olmadan birleştirilmez.

## Sıradaki

AK-NATIVE-07: tam maçlarda savunucuların mevzi geri çekilmesi, mavi gerçek birliklerin ekipmanlara yetişmesi, kuşatma hedefinin sona bağlanması ve gerçek GPU/manuel kabul. Orijinal Arena ve Meydan oynanışı korunacak.
