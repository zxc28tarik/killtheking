# Kill the King — G5.4 gerçek ordu AI kalite değerlendirmesi

**17 Kasım 2026.** Motor: G5.4 gerçek `ArenaArmyBattle` kaynak modülü. G8.4 kaynağı hâlâ eksik; G8.5 gerçek ayna maç testi **0/144**.

## Test yöntemi

- 16 farklı 40 saniyelik (500 × 0,08 saniyelik) G5.4 savaş koşusu: 4 asker sınıfı × 3 tohum (1600, 1701, 1802) için oyuncunun ilk bölüğüne `advance` emri, ayrıca 4 sınıf × tohum 1600 için `hold` komutu. Her koşuda toplam 140 asker ve 8 bölük.
- Komutlar senaryo gereği koddan verildi; bir insan oyuncu oyunu oynamadı. Tarayıcı WebGL/render performansı ölçülmedi.
- Her adımda gerçek motor çalıştı, kalite denetçisi **motor durumunu değiştirmeden** onun gerçek `squads`, `soldiers`, `teamPlans` ve `snapshot` verilerini okudu.
- Savaşın gerçek `drainCombatEvents` fonksiyonu her adımda çağrıldı; gerçek tarayıcının olay tüketimine uygun.
- Bağımsız 20 kalite denetimi testi ve önceki 56 gerçek motor testi: **76/76 PASS**.

## Sayısal bulgular

| Ölçüm | 16 koşunun toplamı |
|---|---:|
| Simüle edilmiş savaş süresi | 640 |
| Komutan kararları | 1186 |
| Emir değişimleri | 168 |
| Kısa süreli A→B→A emir dönüşleri | 29 |
| Düşman hedefi değişimleri | 178 |
| Yerinde kalma uyarıları | 9 |
| Askerlerin yerel sıkışma sayacı eşiği | 0 |
| Bölük rota yeniden planlamaları | 0 |

- **Kısa dönüş:** 29 kez A→B→A emir akışı 10 saniyelik pencerede gözlendi. Bu gözlem **AI hatası olduğunun kanıtı değildir**; taktiksel tehlikeye tepki olabilir.
- **Yerinde kalma:** 9 uyarının 4’ü okçu bölüğünün rakibe yaklaşık 24–57 birim mesafedeyken atış pozisyonunda durmasıyla uyumlu (`possible-tactical-engagement`). Diğer 5’i inceleme gerektiriyor; tamamı mızrakçı bölüklerinde gözlendi (düşmana yaklaşık 51–121 birim mesafe).
- **Sıkışma:** Gerçek motorun asker başına tuttuğu `stalledTicks` sayacı bu örnekte belirlenen 10 eşik değerini geçmedi (0 uyarı). Bu, tüm savaşların sıkışmasız olduğunu **kanıtlamaz**.
- **Maç galibi:** 40 saniyelik hiçbir koşuda savaş tamamlanmadı (16/16 `winner=null`). Bu 144 adet G8.5 eşleştirilmiş savaşın hiçbiri değildir.

## Sınıflara göre

| Oyuncu sınıfı | Koşu | Karar | Kısa dönüş | Mavi kalan ort. | Kırmızı kalan ort. |
|---|---:|---:|---:|---:|---:|
| musket | 4 | 296 | 7 | 64.5 | 65.25 |
| pike | 4 | 295 | 11 | 63.25 | 66.5 |
| bow | 4 | 298 | 1 | 64.25 | 65.25 |
| sword | 4 | 297 | 10 | 66.25 | 66.25 |

## Sonraki teknik kararlar (bulguya dayalı)

1. **P1: uzun süreli hareket emri duruşlarını ayrıştır:** 5 `needs-review` vakasında birliğin koruma görevi, menzilli savunma hattı ve fiziki engel bilgisiyle yeniden değerlendirme yap. Salt durduğu için AI’yı zorla ileri sürme; okçuların/misketçilerin savunma davranışı korunmalı.
2. **P2: yakın aralıklı A→B→A emir geçişlerini incele:** Özellikle mızrak ve kılıç sınıflarında (sırasıyla 11 ve 10) emri sıklıkla geri alan komutan davranışlarını tekrarlı muharebede izle. Eşsiz olay/kök neden kanıtlanmadan AI karar süresini değiştirme.
3. **P2: daha uzun simülasyon ve gerçek GPU kabulü:** Bu koşu yalnızca ilk 40 saniyeyi kapsar. En az 1 tam maç, farklı seed’ler, senaryoda müttefik koruma, doğrulanmış gerçek oyuncu hareketi ve tarayıcı FPS testi hâlâ gerekli.
4. **G8.4 kurtarma:** Bu eski G5.4 modülü ikmal, stratejik bölge ve 200/280 asker geliştirmelerini barındırdığı iddiasıyla kullanılmamalı.

## Dosyalar ve yeniden üretilebilirlik

`recovered/army/g5_4_commander_quality_audit.mjs` gerçek motoru değiştirmeyen gözlemci; `run_g5_4_commander_quality_trials.mjs` 16 koşu testçisi; `test_g5_4_commander_quality_audit.mjs` 20 regresyon testi; `G5_4_REAL_ENGINE_QUALITY_MATRIX.json` tüm koşu detayları; `G5_4_REAL_ENGINE_QUALITY_SUMMARY.json` GitHub inceleme özeti.

Yeniden üretmek için: `node recovered/army/run_g5_4_commander_quality_trials.mjs recovered/army/G5_4_REAL_ENGINE_QUALITY_MATRIX.json`; `node --test recovered/army/test_g5_4_*.mjs`.

**Karar:** G5.4 gerçek AI üzerinde gözlenebilir ilerleme var; fakat şu andaki kanıt zorunlu gameplay değişikliği gerektiren kesin bir AI hatası göstermiyor. Mevcut oynanış kodu korunur.
