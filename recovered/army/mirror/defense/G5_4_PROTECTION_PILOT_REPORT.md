# G5.4 — İki menzilli bölük koruma koordinasyonu: deneysel aday

**Durum: RED / NOT APPROVED.** Silah/oyuncu/FPS kurallarını değiştirmeyen, G5.4'e özgü ayrı bir adaydır. Ana oyuna uygulanmaz ve GitHub PR birleştirilmez.

## Kodda değişen

- Mevcut pike `screen` koruması korunur.
- Kılıçlı `intercept` bölüğü, **ikinci menzilli bölüğe gerçek bir yakın dövüş tehdidi 120 birim içinde yaklaşmışsa** hedefe doğru koruma mevzisine gelir. İkinci asker bölüğünün mevzisi ve tehdit yönü gerçek dünya koordinatlarıyla hesaplanır.
- Yeni `second-fire-line-guard` rolü, daha yüksek öncelikli **geri çekilme, saf toparlama, yardım görevi** kararlarını ezmez.
- Oyuncu bölüğünün `HOLD`/`ADVANCE` komutları, dost ateşi, silah değerleri, maç bitiş kuralı, eski G5.4 kaynak arşivi, bireysel FFA kodu değiştirilmez.

## Sabit koşullarda gerçek A/B karşılaştırması

- Kaynak: gerçek `ArenaArmyBattle` CPU motoru, 4 tohumdan (1600, 1776, 2026, 31415) seçilmiş 12 eşleştirilmiş senaryo; mavi/kırmızı oyuncu, tüfekçi ve mızrakçı, ilerle/mevzi tut emirleri. **12 × 2 = 24 tam savaş**.
- Eski motor SHA-256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`.
- Koruma adayı SHA-256 `a88db6741e82e34af6ac8903f7c1ab87550a92a0c07dd889d3ba0a192b8b908a`.
- 24/24 savaş son askerin elenmesiyle bitti; eski ve yeni motorda **galip değişen 0/12**.
- Oyuncu ordusu kazancı her ikisinde **2/12**. Tüfekçi komutasında galibiyet çözülmedi.
- Yakın koruma: **%42,93 → %49,68** ortalama (+6,75 yüzde puan); **9/12** senaryoda arttı, **3/12** senaryoda azaldı.
- Ortalama bitiş: **280,89 → 381,22 saniye** (+100,33 saniye). Bu kadar büyük yavaşlama oyun temposu ve bitiş güvenliği açısından risk.
- Koruma ölçüsü: canlı menzilli askerlerin 30 birim çevresinde canlı dost kılıçlı/mızrakçı bulunma oranı; **gerçekten engellenmiş hasarı tek başına göstermez**.

## Karar ve sıradaki iş

**Deneysel aday reddedilmedi ama onaylanmadı.** Kılıçlıyı uzaktaki tehdide çok erken çekme davranışının 3 başarısız koruma örneğini ve savaş süresinin uzamasını açıklayıp daha kısa süreli/tehdit odaklı bir savunma görevine dönüştürmek gerekiyor. Bir sonraki varyantı ancak aynı tohumların A/B testinde saldırı temposu ve koruma birlikte iyileşirse kabul et.

Gerçek WebGL/GPU testleri ve kalıcı 64/144 aynalı denge kabulü yapılmadı. November G8.4 kaynak sürümü kayıp: issue #44. P0 #46 açık, denge issue #47 açık. CI testleri başarılı olsa bile **oyun yayın kabulü başarısız** olarak kalır.