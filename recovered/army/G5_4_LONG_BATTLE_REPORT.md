# Kill the King — G5.4 uzun savaş analizi (GERÇEK KOD / CPU)

**Tarih:** 17 Kasım 2026. **Kapsam:** Kullanıcı tarafından komutlandırılan 8 ayrı gerçek `ArenaArmyBattle G5.4` örneği; **G8.4 değil**, 144 G8.5 ayna maçın **0/144**.

## Çalışmanın sınırı

- Dört asker sınıfı (`musket`, `pike`, `bow`, `sword`) × iki oyuncu bölük emri (`advance`, `hold`) × `seed=1600` = **8 farklı koşu**. Her biri **120 saniye**, `dt=0.08` sabit; toplam **960 savaş saniyesi**.
- Gerçek motordan alınan anlık sekiz bölük, 140 asker, komutan karar sayaçları, takım operasyonları, geri çekilme durumu, asker kayıpları ve konum kayıtları gözlendi. Her 15 saniyede dönem örneklemesi yapıldı. *Oyuncu emirleri betik ile verildi; insan oynanışı ve WebGL testi yapılmadı.*
- Eski G5.4 kaynak dosyasına, asker zekâsına, ateş hızlarına, FPS/FFA koduna veya fizik motoruna dokunulmadı.

## Ölçümler

| Ölçüm | 8 koşu toplamı |
|---|---:|
| Savaş süresi (s) | 960 |
| Komutan kararları | 1673 |
| Emir değişimi | 339 |
| 10s A→B→A emir dönüşleri | 77 |
| Uzun süreli hareket duruşu uyarıları | 28 |
| Gerçek asker-stall sayacı eşiği uyarıları | 0 |
| Bilinen hedefe varılmış duruş | 13 |
| Bilinen hedefle ilişkilendirilemeyen duruş | 15 |
| Mavi ordu kaybı | 231 |
| Kırmızı ordu kaybı | 190 |
| 120 saniye içinde kazanan çıkan savaş | 0 |

## Kritik yanlış alarmın çözümü

Önceki gözlemci, 28 duruşu üç gruba ayırmıştı: 4 olası atış pozisyonu, 13 olası koruma perdesi ve **11 “needs-review”**. Bu 11 olayı gerçek G5.4 takımın *kendi hesapladığı görev noktasına göre* ayrıca ölçtük:

- 7 olay: planlı `staged-withdrawal` atıcı bölük toplanma noktası;
- 3 olay: kendi `rally`/`operational-reform` toplanma noktası;
- 1 olay: `enveloping` kanat harekâtının bekleme hedefi (motor koordinatıyla fark tam 0).

**11/11 şüpheli olayın tamamı planlanan varış noktasında beklemedir.** Bu olaylarda zorla ileri hareket uygularsak taktik AI’yı bozabiliriz. Ek 2 koruma perdesi duruşu da görev hedefiyle eşleşti (**toplam 13/28**). Kalan **15/28** olay, hedef-koordinat sınıflamasına girmediği hâlde ilk gözlemcinin 4 olası muharebe duruşu ve 11 koruyucu perde sınıfına denk geliyor. Bunların fiziksel sıkışma olduğu kanıtlanmadı.

**Yapılan düzeltme:** Yalnızca **pasif kalite denetimindeki yanlış alarm ayrıştırması** geliştirildi. Asker komutları, hedefleri, hareket fiziği, oyuncu veya FFA davranışları **değişmedi**.

## Dönemsel durumlar

Her 15s örneklemeye göre karşılaşma devam ederken hem `operation.stage` hem de bir kısım birliklerin `withdrawal.stage` değişti; geri çekilme ve yeniden saf kurma örnekleri görüldü. Bu örnekleme ara geçişleri kaçırabilir; gerçek geçiş sayısının kesin alt sınırıdır. Sekiz savaşın **hiçbirinde 120 saniyede bir kazanan çıkmadı** (her iki tarafta asker hayatta kaldı). Tam maç bitişi bu testle doğrulanmış değildir.

| Oyuncu sınıfı | Emir | 120 sn sonunda mavi/kırmızı yaşayan | Komutan kararı | Emir dönüşü | Duruş |
|---|---|---|---:|---:|---:|
| musket | advance | 24 / 36 | 196 | 8 | 3 |
| musket | hold | 42 / 45 | 217 | 13 | 2 |
| pike | advance | 35 / 41 | 214 | 5 | 1 |
| pike | hold | 45 / 48 | 213 | 10 | 6 |
| bow | advance | 28 / 43 | 193 | 5 | 4 |
| bow | hold | 43 / 53 | 208 | 10 | 5 |
| sword | advance | 50 / 54 | 220 | 11 | 1 |
| sword | hold | 62 / 50 | 212 | 15 | 6 |

## Sürdürülebilir kanıt / sonraki iş

- `g5_4_long_battle_diagnostics.mjs`: gerçek ordu motoruna yalnızca okuma amaçlı 15s dönem ve durağanlık analizi.
- `run_g5_4_extended_trials.mjs`: G5.4 kaynak modüllerini yükler, 8×120s koşuyu deterministik biçimde yeniden üretir ve JSON yazar.
- `test_g5_4_long_battle_diagnostics.mjs`: gerçek motorla çalışan 15 test (özellikle şüpheli 11 olay için hedefe varma ayrıştırması, oyun durumuna müdahale etmeme, tekrarlanabilirlik, zaman/girdi doğrulaması).
- `G5_4_LONG_BATTLE_MATRIX.json`: 8 tam gözlem ve 15s zaman dilimleri; `G5_4_LONG_BATTLE_SUMMARY.json`: CI karşılaştırma özeti.
- Eski **78 test** + **15 yeni test** = **93/93** yerel Node testinde başarılı. Bu, gerçek WebGL performansı veya G8.4'ün kurtarıldığı anlamına gelmez.
- **Sonraki adım:** Tam maç kazananı çıkana kadar veya ayrı bir süre kapısı ile uzun (>120s) stres testi; ardından gerçek GPU/Chrome-Edge kabulü. Stratejik G8.4 ikmal sistemi ve yeni ordu ölçekleri hâlâ ayrı eksik kaynak sorunudur.
