# Kill the King — G5.4 gerçek motor pasif savaş kaydı

17 Kasım 2026. **Bu kaynak G5.4'tür; kayıp G8.4 değildir.** `main` arena oyununun üzerine yazılmaz.

## Bu adımda eklenen

- `g5_4_passive_battle_trace.js`: Yalnızca gerçek `ArenaArmyBattle` durumunu okuyan UMD gözlemci. 140 askerin ilk konumları, 8 bölük, gerçek taktik/komutan karar değişiklikleri, gerçek vuruş olayları (orijinal kuyruğu boşaltmadan), seyrek konum/FPS simülasyon örnekleri ve oyun motorundan gelen nihai `ArenaArmyBattle.snapshot` kaydedilir.
- `inject_g5_4_passive_trace.mjs`: G5.4 orijinal HTML'yi **değiştirmeden** sadece çevrimdışı bağımsız yeni bir HTML üretir. Ordu modu giriş, `step`, sonuç ve terk etme noktalarına pasif ek bağlantılar ekler. Oyunun gerçek `ArenaArmyBattle` ve `ArenaWeaponBalance` scriptleri byte eşitliğinde korunur.
- Gözlemci oyunun `combatEvents` kuyruğunu `splice` veya `drain` etmez, oyunun `Math.random` / seed / yapay zekâ davranışlarına dokunmaz. Hasar, pozisyon, nişan ve FFA bot kodlarını değiştirmez.
- Yerel HTML `window.killTheKingArmyTelemetryReport()` (anlık/saklı kayıt) ve `window.downloadKillTheKingArmyTelemetry()` (maç sonunda JSON olarak kaydet) sağlar; ikisi de isteğe bağlı, ağ erişimi gerektirmez.
- Raporlar sınırlıdır (512 pozisyon örneği, 4096 karar, 2048 çarpışma; taşma sayaçları vardır). `frameMs` `null` ise bunun sebebi gerçek performans süresi ölçülmemiş olmasıdır; oyun `dt*1000` gerçek GPU render süresi diye etiketlenmez.

## Test kapsamı

`node --test recovered/army/test_g5_4_army_contract.mjs recovered/army/test_g5_4_passive_trace.mjs`

- Önceki 33 gerçek motor sözleşme testi + yeni 23 gözlem/entegrasyon testi = **56/56**.
- En önemli yeni kanıt: dört farklı sınıfta, aynı tohumla gözlemci AÇIK/KAPALI **120 simülasyon adımı** sonunda `JSON.stringify(state)` ve gerçek `ArenaArmyBattle.snapshot` tam eşit, her adımda vuruş kuyruğu ve sonrasında devlet karşılaştırması eşit.
- Gerçek AI komutan kararları kaydediliyor; gerçek `damageSoldier` vuruş olayı orijinal oyun tarafından hâlâ `drainCombatEvents` ile alınıyor.
- Yeni HTML'de eski 29 + yeni 1 = **30/30** gömülü JS bloğu sözdiziminden geçiyor.
- Chromium menü/script yüklenmesi doğrulandı, **WebGL context oluşturulamadığı için gerçek oynanış/GPU testi yapılamadı**.

## GitHub ve kaynak güvenliği

- Asıl `recovered/army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html` değiştirilmez.
- Üretilen `dist/KillTheKing_G5_4_Pasif_Telemetri_Oyna.html` GitHub Actions üzerinden indirilebilir.
- `main` ve PR #43 değiştirilmez; bu geliştirme PR #45 G5.4 kurtarma dalındadır.
- **G8.4 kaynak kodu hâlâ eksik; 144 gerçek G8.5 ayna maçı 0/144.** Bu G5.4 motorunun pasif izlenmesidir; G8.5'in tamamlandığına kanıt olamaz.

## Yeniden üretim

```bash
node recovered/army/inject_g5_4_passive_trace.mjs \
 recovered/army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html \
 recovered/army/g5_4_passive_battle_trace.js \
 recovered/army/dist/KillTheKing_G5_4_Pasif_Telemetri_Oyna.html
```

Sonrasında tarayıcıda HTML'yi aç, **Meydan Savaşı** modunu seç, maç bittiğinde geliştirici konsolunda `downloadKillTheKingArmyTelemetry()` çağır. `killTheKingArmyTelemetryReport()` savaş sırasında da anlık kayıt gösterir. 3D oynanış için WebGL destekli Chrome/Edge gereklidir.
