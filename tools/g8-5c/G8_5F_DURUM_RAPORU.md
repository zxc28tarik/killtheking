# Kill the King — G8.5F Kaynak Kurtarma ve Pasif Olay Köprüsü

Tarih: 17 Kasım 2026

## Geçerli kullanıcı kararları

Önceden kabul edilen 5 madde kullanıcı aksini söyleyene kadar değiştirilebilir karar olarak geçerlidir: mevcut oynanış/FFA-ordu ayrımı korunur, tekrarlanabilir tohum, gerçek karşılıklı başlangıç yer değişimi, gerçek maç performans/karar kaydı ve 144 ayna maç planı. Bunlar yeni G9 tasarımını otomatik onaylamaz.

## Bu adımda gerçekten yapılanlar

1. `g8_5f_source_gate.py`: G8.4/G8.5 adayı HTML için SHA256, gömülü JavaScript sözdizimi, ordu/senaryo kodu işaretleri, ZIP varsa paketteki aynı adlı HTML'nin byte-byte tutarlılık kontrolü. Kaynağa hiçbir değişiklik yapmaz. Hatalı ya da eski kaynakla ilerlemeyi bloke eder. İşaretler **kesin sürüm kanıtı değildir**.
2. `g8_5f_event_bridge.mjs`: gerçek motorun **kendi ürettiği** `battle:ready`, `battle:frame`, `army:decision`, `battle:result`, `battle:aborted` olaylarını pasif şekilde dinlemeye hazır bağlantı. Oyun motorunu değiştirmez, `Math.random` ile oynamaz, FFA davranışlarını etkilemez. Eksik veya bozuk olayda veri kaydını güvenle iptal eder.
3. 30 sahte olay yayıcısı testi + 22 sentetik kaynak denetimi = **52 yeni bağımsız test**.
4. Önceki G8.5C–E bağımsız 255 testi tekrar çalıştırıldı; toplam **307/307 yerel bağımsız test başarılı**.
5. Daha önce yalnızca ZIP'te duran regresyon testlerini ve G8.5F araçlarını GitHub taslak PR #43'e ekleme ve CI kapsamını genişletme.

## Hâlâ yapılmamış işler

- En yeni G8.4 oynanabilir HTML / kaynak ZIP'ine erişilemiyor: `KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html` ve `KillTheKing_G8_4_KaynakKod.zip`. 16 Kasım tarihli üretim dosyaları bu oturumdaki çalışma klasörü veya projede bulunamadı.
- Oyun motoruna gerçek bağlantı **yapılmadı**; olay yayıcısı adaptörü yalnızca testlerde sahte olaylarla denenmiştir.
- Gerçek WebGL 144 eşleştirilmiş maç **0/144**; önce bildirilen 388 oyun üretim regresyonu bu oturumda **tekrar çalıştırılmadı**.
- Oyun görselleri, hareket/çarpışma, bot AI ve denge kodları **değiştirilmedi**.
- Tek kişilik FFA / ordu savaşı ayrımı korunur; G9'a geçiş henüz yapılmadı.

## Kaynak bulunduğunda ilk adım

```
python g8_5f_source_gate.py "KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html" --zip "KillTheKing_G8_4_KaynakKod.zip" --json G8_5F_SOURCE_AUDIT.json
```

Aday kaynak onaylandıktan sonra gerçek oyun kodunda mevcut `ArenaArmyBattle` ünite kurulum ve maç sonuç fonksiyonları incelenir. Gerçek ordu kurulum, kare, karar ve maç sonucu olayları yayımlanır; `attachPassiveBattleTelemetry(engine)` ile gözlem yapılır. Bu olaylar gerçek motor tarafından üretilmeden test raporuna "oyun geçti" yazılmaz. Sonra gerçek 388 oyun testleri ve 144 ayna maç koşusu yapılır.

**Kontrol kararları değiştirilebilir.** Yeni, kapsamlı mekanik veya mimari kararlar için kullanıcıya başvurulur.
