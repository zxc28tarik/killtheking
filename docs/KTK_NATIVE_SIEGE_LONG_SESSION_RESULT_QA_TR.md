# KTK-SIEGE-SESSION-02 — Kanonik G5.4 kuşatma: uzun savaş, erken zafer, sonuç HUD, yeniden başlatma

**Tarih:** 22 Kasım 2026  
**Kaynak:** Özgün Kill the King FPS + 140 gerçek G5.4 askeri / 8 bölük, aynı tek HTML / aynı oyun motoru  
**Kanıtlı CI:** [#45040457722 — PASS](https://github.com/zxc28tarik/killtheking/actions/runs/45040457722) · [Kanonik üç harita CI #45040457715 — PASS](https://github.com/zxc28tarik/killtheking/actions/runs/45040457715) · [Eski 175 regresyon testi #45040457685 — PASS](https://github.com/zxc28tarik/killtheking/actions/runs/45040457685)  
**PR:** [#53](https://github.com/zxc28tarik/killtheking/pull/53)

## Bulunan gerçek hatalar ve düzeltmeler

1. **Süre dolmadan G5.4 zaferi, sonuç ekranında JavaScript hatası veriyordu:** `ArenaMatch.finish`, `match.phase==='results'` bekliyor. Oysa gerçek ordu zaferi süre sıfırlanmadan olabiliyordu. Bu durum uzun WebGL testinde `Error: Match is not finished` olarak yeniden üretildi. Yalnız gerçek `meadowBattleState.winner` oluştuğunda sonuç fazına geçiş uygulanıyor; hiçbir asker pozisyonu, silah, HP, zafer, kalan zaman ya da kale kapısı değeri değiştirilmedi.
2. **Sonuç raporu Arena botlarını kazanan gibi gösterebiliyor ve 04:00 süre gösteriyordu:** Gerçek G5.4 kazanan tarafı ve geçen süre `result.battleOutcome`, `winnerId`, `playerWon`, `result.seconds` olarak kaydediliyor. Kuşatma süresi dolduğunda kale ele geçirilmediyse kale savunması kazanır; alan savaşında kendi tarafların hayatta kalan asker sayısı kullanılır. Fare kilidi çıkışında saat sıfırlanmaz.
3. **Zafer ekranı altında HUD/kumanda panelleri görünüyordu, Arena K/D başlıkları Kuşatma sonuçlarının önündeydi:** Sadece G5.4 sonuç ekranında `#hud`, `#native-siege-panel`, `#meadow-army-hud`, eski FFA açıklaması ve K/D başlığı gizlenir. Ekran `SÜREDE SONA ERDİ` diyerek gerçek süreyi gösterir; menü/replay ile HUD geri gelir.

## Gerçek Chromium / yazılımsal WebGL kabulü

Oynanan bütün savaş sistemleri **özgün oyun kodu** üzerinden ilerledi. Tarayıcıda sahne gerçek Three.js/WebGL ile açıldı; özgün menü ve gerçek F6/F7/F8 klavye olayları kullanıldı. Ardından özgün `updateGame(0.05)` fonksiyonu tekrarlanarak **yalnız oyun zamanı hızlandırıldı**. Bu, gerçek duvar saatiyle 65 saniyelik insan oyunu veya Windows GPU performans ölçümü **değildir**.

| Oyun anı | Gerçek oyun sonucu |
|---|---|
| Başlangıç | 140 özgün G5.4 asker, kapı 600 HP, tek motor, sıfır iframe |
| ~15 s | İlk fiziksel koçbaşı ve mancınık teması, kapı 470 HP |
| ~27 s | Kapı 254 HP; koçbaşı 4, mancınık 2 isabet |
| ~39 s | Kapı 0 HP ile açıldı; 6 koçbaşı / 4 mancınık isabeti; askerler kuşatma kulesini geçti |
| ~65,4 s | Mavi ordu, gerçek iç avluda **15 kesintisiz saniye** kontrol sonrası kazandı; normal maç saati daha dolmamıştı |
| Sonuç | Doğru kazanan, doğru geçen süre; savaş HUD'ı ve gereksiz FFA K/D tablosu gizlendi |
| Tekrar Oyna | Kapı 600 HP, 140 asker, temiz koçbaşı/mancınık sayaçları; gerçek savaş HUD'ı geri döndü |
| Hata günlüğü | Sayfa/konsol JavaScript hatası **0** |

**Kod kapsamı:** `recovered/native-siege/native-army-match-finish.js` modülü, `recovered/native-siege/build_canonical_three_maps.mjs` kanonik üretici, `recovered/native-siege/test_native_army_match_finish.mjs` Node testleri, `recovered/native-siege/browser_siege_long_session.mjs` gerçek Chromium testi, `.github/workflows/native_siege_long_session.yml`. Oyun tarihçesinde arşivlenen 28 eski motor/silah/hareket scriptinin byte-eşitliği korunuyor.

## Açık kalan işler

- [x] Tek motorlu gerçek Chromium/WebGL kuşatma savaşının oyun süresinde ilerlemesi, F6/F7/F8, kapı/koçbaşı/mancınık.
- [x] Erken gerçek G5.4 zaferinde doğru maç fazı, kazanan ve geçen süre.
- [x] Sonuç ekranındaki HUD/FFA sütun karışıklığı ve yeniden maç temizliği.
- [ ] Windows Chrome/Edge **gerçek GPU** üzerinde 4–8 dakika insan kontrolü, FPS/1% low, ses ve fiziksel tuş/işaretçi kilidi kabulü.
- [ ] Daha fazla seed / taraf / komut kombinasyonu, F9–F10 ve kale savunmasının kazandığı uzun maçlar.
- [ ] Harita 2 yürünebilir tepeciklerin fizik, mermi ve navigasyon sistemlerine gerçek entegrasyonu.
- [ ] Yayıncı sunumu için son görsel/UI cilası; kullanıcı istemeden pitch deck başlatılmayacak.
