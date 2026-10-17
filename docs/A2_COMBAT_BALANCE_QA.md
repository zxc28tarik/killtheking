# A2 — Serbest Arena savaş dengesi ölçüm kılavuzu

**Durum:** Kod hazırlığı (A2); **gerçek GPU oynanış kabulü bekliyor**. Bu belge sonuç/denge onayı değildir.

## Amaç
Dört sınıfın karşılaştırmalı öldürme/ölüm davranışını, botların yalnız oyuncuya saldırmak yerine birbirlerini hedeflemesini ve navigasyon sıkışmalarını gözlemlemek. Bu aşama hız, hasar, görsel, sınıf veya bot sayısını değiştirmez.

## Nasıl test edilir?
1. Chrome/Edge'de offline HTML'yi aç. F12 > Console'da `window.krunkerArenaBalanceReport()` çağır. Bu nesne **yalnız mevcut andaki** FFA skorlarını ve anlık hedefleri raporlar.
2. Her sınıf (şövalye, piyade/kargı, okçu, tüfekçi) ile aynı süre ve aynı haritada 10 dakika oyna. **Maç sırasında sınıf değiştirme**: rapor yalnız geçerli sınıfı gösterir, değişiklik geçmişini tutmaz.
3. Oynanış esnasında farklı zamanlarda `window.krunkerArenaBalanceReport().targetingAtSnapshot` çıktısını incele. `otherBots` alanı botların o andaki diğer bot hedeflerini sayar. Sıfır tek başına hedefleme hatası kanıtlamaz; zaman boyunca gözlemle.
4. Raporun `fighters` ve `standings` alanlarını karşılaştır, oyuncu K/D ve sınıflar arası aşırı üstünlük olup olmadığına bak. `navigationStuckCandidates` listesine düşen isimler yalnız potansiyel sıkışma göstergesidir; gerçek konumda doğrula.
5. Duvar arkasından mermi/ok isabetini ve yakın dövüş temasını görsel olarak ayrıca kontrol et. Otomatik Node testleri fiziksel WebGL hatalarını görmez.

### Örnek tarayıcı komutları

```js
// O anki ölçüm
console.table(window.krunkerArenaBalanceReport().fighters);
console.log(window.krunkerArenaBalanceReport().targetingAtSnapshot);

// İsteğe bağlı 1 saniyelik gözlem (Console'da çalıştır)
const qaSamples = [];
const qaInterval = setInterval(() => qaSamples.push(window.krunkerArenaBalanceReport()), 1000);
// Durdurmak için:
clearInterval(qaInterval);
console.table(qaSamples.map(s => ({ second: s.elapsedSeconds,
  botTargets: s.targetingAtSnapshot.otherBots,
  playerTargets: s.targetingAtSnapshot.player,
  suspectedStuck: s.navigationStuckCandidates.length })));
```

**İstatistik yorumu:** `botKillsTotal`, botların oyuncuyu öldürdüğü olayları da içerir; tamamını bot-bot öldürmeleri olarak yorumlama. `targetingAtSnapshot` zaman aralığı/olasılık değil, sadece gözlem anıdır. Sınıf için hasar/AI değişikliği yalnız ölçüm + kullanıcı oynanış geri bildirimi sonrasında.

**Kabul kapısı:** Dört sınıfın 10+ dakikalık gerçek maç denemeleri, bağımsız bot-bot savaşının doğrulanması, bariz duvar arkası isabeti ve tek sınıfın mutlak üstünlüğü bulunmaması. A0 (#27) GPU kabulü halen ayrı açık görevdir.
