# P0 — Silah teması, bot isabeti ve atış sınırı kabul raporu

**Durum:** Geliştirme dalında kodlandı, GitHub Actions `248/248` test PASS. Gerçek tarayıcı/WebGL oynanış testi **yapılmadı**. Ana dalda değil.

## Korunan silah değerleri

| Silah | Gövde | Kafa | Kol/bacak | Asgari atış aralığı |
| --- | ---: | ---: | ---: | ---: |
| Kılıç | 20 | 30 | 16 | Yakın dövüş |
| Kargı | 35 | 52,5 | 28 | Yakın dövüş |
| Hançer | 10 | 15 | 8 | Yakın dövüş |
| Yay (%50 çekiş) | 23 | 34,5 | 18,4 | 4 saniye |
| Yay (%100 çekiş) | 35 | 52,5 | 28 | 4 saniye |
| Tüfek | 90 | 135 | 80 | 15 saniye |

HP türlere/sınıflara göre 100–130 olabilir; bu değerler **sabit puandır**, can yüzdesi değildir. Kalkan/parry mevcut koruma kurallarını uygular.

## Giderilen sorunlar

1. **Bot otomatik isabeti:** Eski bot saldırısı sadece menzil/görüş kontrolünden sonra rastgele `head/body/limb` bölgesi seçip kesin hasar uyguluyordu. Yeni kodda atış, hedefin yaklaşık fiziksel siluetine yönelir. Yatay/dikey sapma siluetin dışına taşarsa hasar yok; engellenen atış da hasar vermez. İsabet bölgesi atışın hesaplanan temas konumundan türetilir. Bu, henüz gerçek 3D model/raycast hassasiyetinde bir bot hitbox sistemi **değildir**.
2. **Süre aşımı:** Botların son atış zamanları tutulur; menzilden çıkma, yeniden hedef seçme veya ölüm/respawn 4/15 saniye sınırını aşamaz. Yalnız yeni maç başlangıcı atış geçmişini sıfırlar.
3. **Yanlış kol isabeti:** Elde tutulan silahlar fiziksel kol hitbox'ı sayılmaz. Kılıç/kargı temaslarında botun gerçek kol/bacak/kafa/gövde mesh etiketi dikkate alınır; mevcut çarpışma önceliği korunur.
4. **Sınıf değiştirme ile iyileşme:** Oyuncunun kalan can yüzdesi maç sırasında korunur; yeni maç/menü sınıf seçiminde tam can ile başlar.
5. **Barut doldurma görünürlüğü:** Tüfekçi sınıfına dönüldüğünde son atıştan kalan süre ve doldurma göstergesi korunur.

## Kanıt

- GitHub Actions: `248 / 248 Node PASS`, JS sözdizimi ve tek HTML çevrim dışı paketleme başarılı.
- Dinamik VM testleri, gerçek `arenaBotAttack` fonksiyonunda 15 saniyelik engeli ve duvar arkası/ıskalanan atışların hasar vermediğini kontrol eder.
- `tests/combat-p0-shots-anatomy.test.mjs`, `tests/combat-p0-runtime-fire.test.mjs`, `tests/combat-p0-class-switch.test.mjs` yeni kontrolleri içerir.

## Gerçek tarayıcı kabulü — tamamlanmadı

- Chrome ve Edge'de en az 4 dakikalık FFA; sonuç, duraklatma, tekrar başlatma.
- Tüfekçi ile atışlar arası gerçek oyun saatinde 15 saniye; sınıf değiştirip geri dönme, yeniden doğma ve duraklama kontrolü.
- Okçu ile 4 saniye aralık, farklı germe güçleri ve dört vuruş bölgesi.
- Bot ok/tüfek isabetinde hareketli hedefe bazen ıskalama ve duvar engelinin hasarı önlemesi; görsel tracers.
- Botların başka botlara da saldırmayı sürdürmesi, sur/kapı/rampada takılma ve 30 dakika stres denemesi.
- Kılıç/kargı teması ve taşıdığı silahın gövde/kol sayılmaması; FPS/TPS modellerinin tutarlılığı.

**Sıradaki mühendislik:** Aynı anatomik tutarlılığı botlardan gelen menzilli atışlarda daha kesin 3D hitbox/raycast ile doğrulamak; ayrı takım modu modülü henüz oyun döngüsüne bağlanmadı. Harita teması kullanıcı kararı bekliyor.
