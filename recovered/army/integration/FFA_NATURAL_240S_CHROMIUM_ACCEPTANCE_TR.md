# Kill the King — 240 saniyelik doğal FFA meydan savaş testi

**Tarih:** 18 Kasım 2026  
**Durum:** **PASS — native oyun mantığı / Chromium DOM / yazılımsal WebGL**  
**ÖNEMLİ SINIR:** Bu test **gerçek zamanlı 4 dakika süren GPU oynanışı** veya manuel oyuncu kabulü değildir. Chromium'da kodun gerçek `updateGame(0.05)` adımları render olmaksızın hızlandırılarak 240 saniye **oyun zamanı** test edilmiştir.

## Kaynak ve kanıt

- Kaynak/test commit'i: [061ff24](https://github.com/zxc28tarik/killtheking/commit/061ff24cc9c6bc46cf82404bd9f5e4be14006c64).
- [GitHub Actions Chromium/SwiftShader — PASS #44298003383](https://github.com/zxc28tarik/killtheking/actions/runs/44298003383).
- [JSON, görsel, tarayıcı raporu — artifact #14424372540](https://github.com/zxc28tarik/killtheking/actions/runs/44298003383/artifacts/14424372540), özellikle `ffa-natural-240s-match.json`, `ffa-natural-240s-results.png`.
- Otomatik entegrasyon/derleme kontrolü: [#44298003411 — PASS](https://github.com/zxc28tarik/killtheking/actions/runs/44298003411).
- Oyun HTML, silah dengesi, yapay zekâ ve oyuncu/bot pozisyonları **değiştirilmedi**; bu commit **yalnız test kodunu** genişletti. Oyun başlatılırken 6 özgün FFA botu doğal spawn ve doğal hedef kararıyla çalışıyor.

## Tam maç sonucu

| Ölçüt | Sonuç | Açıklama |
| --- | ---: | --- |
| Maç zamanı | **240/240 saniye** | `results`, kalan `0`, HUD `00:00` |
| Sonuç ekranı | **PASS** | 6 bot + 1 oyuncu = 7 sıralama satırı |
| Bot hedef değişimi | **169** | 4s erken kanıt fazından sonraki izleme |
| Botun oyuncuyu hedeflediği kareler | **3.376** | Bot-kare toplamı, benzersiz zaman değil |
| Botun botu hedeflediği kareler | **23.852** | FFA kendi arasında dövüşmeyi sürdürüyor |
| Menzilli atışlar | **64** | Maç sonu toplamı: 39 ok + 25 tüfek |
| Uzun fazda ölçülen menzilli atış | **62** | İlk doğal 4s doğrulamasından sonra |
| Yakın dövüş hazırlığı bitişleri | **126** | İndekslenen uzun test evresi |
| Oyuncuya yaklaşma kareleri | **1.439** | Hedefli bot mesafe azalma adımları |
| Bot ölümü | **29** | Her biri gerçek oyun döngüsünde |
| Bot yeniden doğma | **29** | 29/29 eşleşti |
| Oyuncuya hasar olayları | **25** | Uzun izleme evresinde |
| Oyuncu ölümü | **8** | Ölüm telemetrisi ve tablolar tutarlı |
| Geçersiz/self hedef | **0** | Uzun izleme evresi |
| NaN/Infinity pozisyon-can | **0** | Uzun izleme evresi |
| Erken ok veya tüfek atışı | **0** | Ok 4s, tüfek 15s asgari aralık |
| Konsol/JavaScript hata | **0** | Chromium test raporu |

**Birinci:** Mızraklı_Kurt (`bot:2`), **11 öldürme / 4 ölüm**.  
**Oyuncu:** 0 öldürme / 8 ölüm. Oyuncu testte yönetilmediği için bu sıralama oyuncu beceri dengesini değerlendirmez.

### Silah/onay sınırları değişmedi

- Arena FFA **bot okçusu hazırlığı 0,5 saniye**.
- **Oyuncunun normal yayı**, ilk **2 saniye bırakılamaz**, **3 saniye tam germe**.
- İki ok arası en az **4 saniye**, ok atışı sonrası **1 saniye toparlanma**.
- Tüfek atış aralığı **15 saniye**, diğer sınıfların hasarları korunuyor.
- G5.4 ordu motoruna veya ordudaki okçu kurallarına değişiklik yapılmadı.

## Kabul edilmemiş açık başlıklar

Gerçek donanım GPU FPS/1%-low, 4 dakikalık gerçek zamanlı oyuncu oturumu, manuel fare kilidi/ESC, sur/duvar çarpışmalarının oyun içi kontrolü, 30 dakikalık stres, ağır asker sahneleri ve G8.4 tam kaynak/senaryo entegrasyonu bu sonuçla **tamamlanmış sayılmaz**. Maçın çıkış ekranına ulaşması bir **oyun mantığı** doğrulamasıdır; uzun süreli gerçek render kararlılığı doğrulaması değildir.

**GitHub durumu:** PR #48 **DRAFT**. `main` değiştirilmedi. **Yayın onayı yok.**
