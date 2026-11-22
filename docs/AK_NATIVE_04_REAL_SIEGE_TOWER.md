# AK-NATIVE-04 — Aynı oyun motorunda gerçek kuşatma kulesi (21 Kasım 2026)

## Mimari kararı

Bu sürüm, başka FPS oyununa veya bağımsız kuşatma motoruna geçmez. **Orijinal Kill the King / G5.4** oynanışı, FPS/TPS kamera, hareket, silahlar, 140 gerçek asker, 8 özgün bölük ve orijinal asker görselleri korunur. Kale Kuşatması, ana oyunun menüsünden bir **harita varyantı** olarak seçilir.

Sohbetten indirilebilir **gerçek test edilen tek HTML artefaktı**: `KillTheKing_ANA_OYUN_KaleKusatmasi_Kusatma_Kulesi_G54.html` (1.314.825 bytes, SHA-256 `2998eeb9d95ce635af2fb0ea8d00ac0f9ff43ce33806ff0894bf8c42529e5be4`). Kaynak: AK-NATIVE-03 HTML SHA-256 `a837761cdb70ee784ee92e974b300a03d7c4b0f426ac3ed198bfa523e5b8d955`.

**Dikkat:** Bu GitHub kaydı yalnızca teknik not ve kabul sonuçlarını içeriyor; tam HTML henüz GitHub deposuna commit edilmiş değildir. Dosyanın gerçek indirmesi sohbet artefaktıdır. Kod depoya aktarıldığında SHA kontrol edilmelidir. Ana dal `main` değiştirilmedi.

## Eklenen oyun mekanikleri

- **F6 — Kılıçlı → Kuşatma Kulesi**: Orijinal G5.4 kılıçlı bölüğüne `ArenaArmyBattle.setDestination` aracılığıyla gerçek konum emri; yalnızca yaşayan aynı takımın gerçek askerleri kule mürettebatı sayılır. Asgari 3 asker kuleyi hareket ettirir.
- Kule yavaşça sura ilerler, dar gerçek **yan direk AABB** çarpışmaları ile FPS oyuncusu ve yer askerlerinin aynı kale dünyasındaki engellerine girer. Mürettebat kuleyi takip edebilsin diye yanından dinamik yeniden konumlandırma yapılır; G5.4 asker yapay zekâsı kopyalanmaz.
- Kule gerçek güney suruyla fiziksel temas kurduğunda üst **ahşap köprü** açılır. Kullanıcının özgün FPS ramp/ground solver'ına yeni eğim, üst döşeme, iç iniş yüksekliği tanıtılır. Tüm orijinal kale/Meadow ramp ayarları ayrı kalır.
- Aynı yaşayan orijinal mavi G5.4 kılıçlı askerleri (en çok 8 eşzamanlı), fiziksel merdiven → üst köprü → iç avlu iniş rotasında **3.3 m/s üst sınırla üç boyutlu kademeli** ilerler; kimlik, sağlık, silah ve G5.4 asker verileri değişmez. Gerçek yükseklik `ArenaArmyRender` orijinal instanced bot rig'inin **yalnızca tırmanan askerlerine** çizim düzeltmesiyle uygulanır; orijinal 28 scriptin tek satırı değiştirilmez.
- Oyuncu başka manuel bölük emri verdiyse yeni asker kuleye zorla bindirilmez; hâlihazırda köprüde bulunanlar güvenli biçimde inişi tamamlar. İki asker gerçekten içeri geçerse kılıçlı bölüğün eski G5.4 dünya rotası iç avluya bağlanır.
- Gerçek askerler kule üzerinden kale içine girebildiyse kapı yıkılmadan da mevcut **15 saniyelik gerçek asker üstünlüğü** yakalama sistemi zafer koşulunu sağlayabilir. Sahte savaşçı, anlık zafer veya ışınlama eklenmez.
- Ekran HUD'sına kule durumu, yakın canlı kılıçlı sayısı, binen/geçen gerçek asker sayısı eklendi. F7 koçbaşı, F8 mancınık, F9 kapı sonrası hücum aynı kaldı.

## Kabul ve sınırlamalar

- **PASS:** 29 HTML script'ten ilk 28'i AK-NATIVE-03 ile byte-identical (orijinal bütün G5.4/FPS/karakter kaynakları).
- **PASS:** Yeni son script `node --check`.
- **PASS:** Headless Chromium, test-only *WebGL renderer mock*: Orijinal oyun menüsü, kale harita seçimi, 140 gerçek G5.4 asker, F6 gerçek komut `ok`, 210 doğal orijinal G5.4 adımında kule sur temasına gidiyor, 8 mevcut asker kuleye biniyor.
- **PASS:** Ardından **390 ilave gerçek orijinal G5.4 tick** ile **8 canlı kayıtlı kılıçlı** sahte kapı kırılmadan surdan geçiyor; sur kapısının gerçek HP'si **600/600**, hâlâ kapalı; köprü ve FPS tırmanma rampası etkin; asker sayısı 140, Chromium JavaScript console/page errors sıfır.
- **NOT YET ACCEPTED:** Gerçek GPU/WebGL çizimi (bu çalışma ortamında WebGL context üretilemiyor); tam uzun manuel FPS maçı/oyuncunun fiziksel rampadan kendi yürüyüşü; mavi-kırmızı kuleye karşı ekipman yıkımı ve çöküşte askerin düşmesi; otomatik zafer ekranı oyun sonuna dek kesintisiz tam QA. Kule HP=400 hazırlık alanı şu an kırmızı karşı ateşle hasar almıyor; bunu tamamlanmış olarak göstermeyin.

## Sonraki iş

- [ ] Bu HTML'nin doğrulanmış byte'larını GitHub'a ve build sistemine yüklemek.
- [ ] AK-NATIVE-05: Gerçek kuleye savunucu silahlarına bağlı hasar, yıkım ve üzerindeki askerlerin güvenli düşüşü; ses/çarpışma/yalnız kule hasarı.
- [ ] Uzun gerçek WebGL GPU kabulü ve 3 harita regresyonu; Arena ve Meydan orijinal oynanışını değiştirme.
- [ ] `main` merge ve pitch deck yalnız kullanıcının açık komutuyla.
