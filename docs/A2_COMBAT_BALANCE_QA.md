# A2 — Serbest Arena savaş dengesi ölçüm kılavuzu

**Durum:** PR #29 üzerinde kod ve otomatik testler; **gerçek Chrome/Edge WebGL kabulü bekliyor**. Bu belge başarıyla sonuçlandırılmış denge testi değildir.

## Ne kaydediyoruz?

- **Gerçek öldürmeler:** `killsByDirection.playerToBot`, `botToPlayer`, `botToBot` yalnız öldürücü vuruşta güncellenir. Böylece bot-bot öldürmeleri, botların oyuncuyu öldürmeleriyle karışmaz.
- **Hedef tercihleri:** `targetingOverTime` oynanan oyun zamanı içinde yaklaşık her saniye, hayatta olan her botun hedefini örnekler. `botTargetShare` hedef anlık gözlemlerinin toplamı içindeki diğer-bot hedef payıdır. Bu değer saldırı sayısı veya vurma oranı **değildir**.
- **Sıkışma örnekleri:** `navigationStuckSamples` bot başına potansiyel rota takılmalarını sayar; görsel doğrulama gerekir.
- **Sınıf katkısı:** `playerKillsByClass` her oyuncu öldürmesini vuruş anında seçili olan sınıfa kaydeder. **Sınıfta geçirilen süreyi** kaydetmez; sınıflar arasında hasar/denge sonucu çıkarmak için yeterli değildir.
- **Tutarlılık:** `scoreCrossCheck` telemetri olaylarını oyun skoruyla karşılaştırır. Normal maçta tüm eşitlikler `true` olmalı.
- **Son 24 olay:** `recentKills` sınırlı örnek tutar; toplam öldürme sayıları bundan bağımsız olarak tam sayılır.

Her yeni maç başladığında ölçümler sıfırlanır, duraklatılan maçta örnekleme işlemez. Hiçbir telemetri internetten gönderilmez.

## Kolay test akışı

1. GitHub Actions'taki en güncel PR #29 `killtheking-playable-html` paketini indirip çıkart; HTML'yi Chrome veya Edge'de aç.
2. Şimdilik **4 dakika varsayılan** FFA'yı oyna. TAB canlı sıralamayı gösterir. ESC ile duraklatmayı dene.
3. Maç sonunda **TEST RAPORU (JSON)** düğmesine bas. `KillTheKing_FFA_QA_4min.json` benzeri dosyayı kaydet. Rapor hem sonuç tablosunu hem de ölçüm özetini içerir.
4. 2 ve 8 dakikalık maçlarda aynı süreci tekrarla. Yeni maça geçildiğinde skor ve telemetri tamamen sıfırlanmalı.
5. Dört sınıfın her biri için **en az 10 dakika toplam oynanış** hedefle; tek maç en fazla 8 dakika olduğundan aynı sınıfla art arda maçlar oyna. Raporları ayrı ayrı tut.
6. Surlar/kapı, rampalar ve ateş noktalarında dolaş; duvar arkasından isabet, botların sıkışması ve yanlış sınıf/respawn davranışını gözle kontrol et.

İsteğe bağlı geliştirici konsolu komutları:

```js
// Maçın o ana kadarki kümülatif istatistikleri
const qa = window.krunkerArenaBalanceReport();
console.log(qa.killsByDirection, qa.targetingOverTime, qa.scoreCrossCheck);
console.table(qa.fighters);
// O anki bot hedefleri (yalnız anlık ölçüm)
console.log(qa.targetingAtSnapshot);
```

## Yorumlama uyarıları ve kabul kapısı

Gerçek tarayıcı testleri olmadan AI dengelendi veya maç kararlı sonucu çıkarma. Bot hedefleri bir saniyelik yaklaşık örneklerdir, bütün atakların dökümü değildir. Sadece `kill` dağılımına bakarak silah dengesi ayarlanamaz; sınıfta geçirilen süre, isabetler, parry ve duvar engeli videolarla birlikte değerlendirilmelidir.

**Kabul:** A0 issue #27 tam 4 dakikalık GPU maç/replay; A1 2/4/8 süre/ESC/TAB denemeleri; A2 dört sınıfla 10+ dakika gerçek oynanış, diğer botları hedefleyen savaşlar, kapı/sur sıkışma kontrolü, skorların ve indirilen raporun tutarlılığı. Node testleri yalnız otomatik doğrulama kapısıdır.
