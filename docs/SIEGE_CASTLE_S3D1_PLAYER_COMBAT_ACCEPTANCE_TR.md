# Kill the King — S3D1: Gerçek G5.4 Oyuncu HP ve FPS/TPS Silahları

**Tarih:** 19 Kasım 2026  
**Dal:** `codex/s1-siege-castle-phase1`, [PR #50 DRAFT](https://github.com/zxc28tarik/killtheking/pull/50).  
**Kapsam durumu:** **S3D1 kaynak tabanlı gerçek oyuncu HP/zemin silah etkileşimi ve Chromium input PASS**; ana oyundaki özgün FFA hareket/kamera/animasyonların tamamı, duvar üstü atış ve gerçek 3B ok/mermi hareket fiziği, uzun maç içinde insan isabet/ölüm senaryosu ve donanım GPU kabulü **AÇIK**.

## Gerçekten yapılan kod

- **`recovered/siege/siege-player-combat.js`:** 140 asli G5.4 askeri yaratan önceki `siege-real-army-bridge` içindeki **tek** `ArenaArmyBattle` durumunu kullanır. Oyuncu konumu `setPlayerPosition`; insan canı `state.playerHealth/playerActive/playerHits`; nişan/ilk beden/arkadaki dost askerin vuruşu kesmesi **`raycastSoldier`**; düşman askerin gerçek HP'sini değiştiren tek yetki **`damageSoldier({source:'player'})`**. Özgün asker ID, bölük alive, öldürme sayısı ve kaynak saldırı olayları korunur; sahte dış hasar olayları yazılmaz.
- Dört silah **orijinal `ArenaWeaponBalance`** hasarıyla kullanılır: **1 kılıç** (gövde 20), **2 mızrak** (gövde 35), **3 yay** (min 2 sn, 3 sn tam germe, 1 sn toparlanma ve 4 sn atış aralığı), **4 tüfek** (gövde 90, kol/bacak 80, 15 sn aralık = 4/dk). Yakın dövüş zaman aralıkları var olan G5.4 `TYPES` profillerinden alınır. Silah değiştirmek mühimmat bekleme süresini sıfırlamaz.
- **`siege-preview.js`:** Var olan 3B S2 kale keşif karakteri FPS/TPS bakışı, gerçek WASD/E ve çarpışmasıyla yürürken yeni opt-in `getPlayerPose` sağlar. Gerçek savaş modunda **üç QA ışınlama düğmesi kapalı**, gerçek oyuncu HP=0 veya maç sonucu geldiğinde yürüme ve tırmanış durur. **S2 bağımsız önizleme bu modu otomatik etkinleştirmez.**
- **`siege-real-army-overlay.js`:** S3D1 ek modülü varsa her kaynak savaş tikinden **önce** gerçek oyuncu konumu senkronize edilir, **sonra** gerçek can/hasar alınır; taraf/maç sıfırlaması 140 gerçek askeri ve oyuncuyu birlikte yeniden kurar.
- **`siege-player-ui.js`:** FPS/TPS modunda **fare/ F** ile saldırı, **1–4** ile silah, yay için basılı tutma/bırakma; **100 HP**, vuruş/öldürme, saldırı hazır olma ve ölüm HUD; ekran nişangâhı. Harita kamerası spectator/orbit iken oyuncu hayalet hedef olarak savaşta aktif sayılmaz.
- **`build_siege_player_candidate.mjs`:** Orijinal G5.4 kaynağının SHA-256 değerini `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841` ile pinler, 15 scripti tek HTML içinde birleştirir. Eski FFA/TDM, G5.4 açık meydan, S2/S3C3 kuşatma HTML'si ve `main` **değişmedi**.

## İspatlanmış kontroller

[**S3D1 GitHub Actions #44521305319 — SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44521305319): iki bağımsız job başarılı.

- **15/15 yeni S3D1 gerçek native kaynak testi**: 140 askerle gerçek oyuncu konum/HP, spectator, 4 onaylı silah ve zaman ayarları, kapalı kale kapısının düşmana erişimi kesmesi, açık kapıdan gerçek **ilk hedefi** vuran tüfeğin `damageSoldier` olayına ve öldürme sayısına işlenmesi, dostun kurşunu engellemesi, yay min2 / 4 sn, yakın dövüş, yükseltilmiş hedefte güvenli ateş engeli, 0 HP ölüm, gerçek HP'yi gösterme, takım güvenliği. Asker konumları/hp sınır testleri gerektiğinde **QA fixture olarak** işaretlendi; bunlar doğal oyun sırasında insan isabet kanıtı sayılmaz.
- **97/97 S1–S3C3 regresyon testi** (15 S3C3, 15 S3C2, 15 S3C1, 13 gerçek ordu ve 39 S1/S2), doğal iç kale zaferi ve merdiven/kapı sistemi bozulmadı. **Toplam 112/112 PASS**.
- **Gerçek Chromium/SwiftShader:** 140 özgün G5.4 asker, 8 bölük, gerçek S3D1 modülü yüklendi. Harita orbit oyuncu hasar hedefi değil; FPS ile 100 HP/aktif oyuncu. Gerçek **KeyW** hareketi `z=-110 → -103,0259`; G5.4 `state.playerPosition.z` aynı doğrulanmış değer. Gerçek **KeyF** kılıç ve tüfek girişi, ikinci tüfek vuruşunun 15 saniyelik süre yüzünden reddi, **2 saniyeden kısa** yayın engellenmesi, mavi takım seçince gerçek komutan ve 70v70 yeniden yaratılması, sahte kapı/merdiven/zafer düğmeleri ve üç QA ışınlamasının kilidi **PASS**; `pageErrors=[]`, `consoleErrors=[]`.
- Bu kısa Chromium koşusu **gerçek hedef vurulmasını, düşmandan alınan doğal oyuncu hasarını veya tam maç boyunca oyuncu zaferini göstermiyor**. Doğrudan HP/öldürme yetkisinin kaynağı olan G5.4 API'leri ayrı birim testleriyle doğrulandı. Gerçek donanım GPU/Windows/30 dakika stres kabulü değil.

## Dosyalar

- [**S3D1 gerçek 140 asker + savaşan insan çevrim dışı HTML — Actions artifact #14527868070**](https://github.com/zxc28tarik/killtheking/actions/runs/44521305319/artifacts/14527868070), **890.819 byte**, SHA-256 `de52248ae5274846d0a5d2b919820bdd86df42f3c4efc0bcdceb8978994bf05b`.
- [**S3D1 Chromium ekran görüntüsü ve JSON — artifact #14526714351**](https://github.com/zxc28tarik/killtheking/actions/runs/44521305319/artifacts/14526714351).
- Sohbet içinde aynı SHA-256 doğrulanmış tek HTML ayrıca doğrudan indirilebilir dosya olarak teslim edildi.
- Geliştirme planı: [`SIEGE_CASTLE_DEVELOPMENT_PLAN_TR.md`](SIEGE_CASTLE_DEVELOPMENT_PLAN_TR.md).

## Hâlâ açık (S3D2 ve S4–S6)

1. **S3D2** özgün arena FPS yürüyüş/zıplama/kayma/animasyon, nişan hareketi ve hasar geri bildiriminin yalnız ayrık mod sözleşmesi üzerinden geri taşınması, gerçek insan oyuncunun birden fazla doğal savaş sahnesinde vurması/ölmesi/kazanması ve gerçek 3B yükseklikte ok/kurşun işlemesi. Şu an 3B yükseklikte oyuncu veya hedef için atış **kasıtlı kapalı**; sistem yükselti fiziği varmış gibi görünmemeli.
2. **S4 mavi savunma AI'sı:** önceki doğal kaynak testinde 48 mavi asker hayatta kaldığı halde iç kaleyi korumadı; mevcut FFA/ordu bireysel AI sözleşmesini bozmadan mavi savunucu yığılma, sur okçu/tüfekçi mevzileri ve anti-stuck.
3. **S5–S6:** ses/efekt/animasyon/harita son düzenleme, gerçek Windows Chrome/Edge GPU, 30+ dakika stres, özgün FFA ile izolasyon ve kullanıcı kabulü.
4. **Karar gerektiren maddeler:** kapı 600 HP, merdiven inşa hızı, işgal 12/20 saniye ve maç süresi **prototip**, kullanıcı onaylamadıkça nihai denge veya genel oyuna `main` merge yok.

**Özet:** S3D1 100 HP gerçek savaşan insan komutan prototipi testlerden geçti; tam özgün FPS karakter motoru ve yayına hazır genel oyun henüz değil. PR #50 taslak, `main` korunuyor.
