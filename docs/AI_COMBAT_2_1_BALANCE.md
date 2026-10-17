# KILL THE KING — BOT SAVAŞ ZEKÂSI 2.1 / HASAR DENGESİ

**Durum:** Kod + Node/CI doğrulaması; gerçek Chrome/Edge GPU oynanış kabulü henüz yapılmadı.
**Bağımlılık:** PR #28 → #29 → #30 → #31 → bu özellik. Varsayılan altı bağımsız FFA botu ve kabul edilen eski grafikler korunmuştur.

## İlk kod incelemesinin bulgusu
Önceki altı botun taban hasarı **14–20**, oyuncu sınıflarının azami canı **100–130** idi. Yakın dövüş botlarının normal vuruş aralığı 1,45–2,60 s, menzilli botların 1,75–2,90 s idi. Etkili saldırı süresi ayrıca silah menzili, yön, görüş, parry/guard, hareket ve animasyonlara bağlıdır.

## İlk kontrollü ayar (oyuncu değerlerini değiştirmez)

| Bot | Rol | Eski hasar | Yeni hasar | Değişim |
|---|---|---:|---:|---:|
| Şövalye_34 | Şövalye | 14 | 19 | +%36 |
| Ahmet_1600 | Tüfekçi | 20 | 25 | +%25 |
| Mızraklı_Kurt | Kargılı | 16 | 21 | +%31 |
| Okçu_Reis | Okçu | 15 | 20 | +%33 |
| Kara_Şövalye | Şövalye | 15 | 20 | +%33 |
| Yeniçeri_Ali | Tüfekçi | 19 | 24 | +%26 |

Çıplak hasar değerlerinden tahmini öldürme süresi ancak **ideal, engelsiz, savunmasız sürekli isabet** varsayımıyla hesaplanabilir. Bu nedenle saniyelik hasar/gerçek ölüm süresi için oynanış testi gerekiyor. Oyuncu sınıflarının mevcut hasarı (örn. musket gövde 115) değiştirilmedi.

## AI değişiklikleri

1. **Sınıfa özgü saldırı aralığı:** Şövalye daha hızlı baskı kurar; kargı mesafesini korur; yaycı ve tüfekçi daha uzun fakat farklı aralıklarla atış yapar.
2. **Nişan alma ve görünür hazırlık:** Menzilli botlar ateş etmeden önce yaklaşık 0,28–0,36 saniye hazırlanır. Yakın dövüşte sınıfa özgü yaklaşık 0,34–0,40 saniye hamle hazırlığı vardır.
3. **Gerçek yön kontrolü:** Bot geriye veya yan tarafa dönükken isabetli saldırıyı tamamlayamaz; hedefe doğru mevcut yumuşatılmış dönüş hareketiyle yönelir. Atışın önünde sur/kapı varsa saldırı iptal olur.
4. **Hedefe bağlı vuruş:** Hazırlık sırasında hedef değişirse, bot eski hazırlıkla yeni kişiye birden saldırmaz; hazırlığı sıfırlanır.
5. **Baskı altında konum alma:** Okçu/tüfekçi yaralanınca 2 oyun saniyesi süreyle güvenli, erişilebilir yan mevziye geçmeye çalışır; fizik dışı kayma/duvar içinden geçiş yoktur. Kapalı koridorda yol yoksa durur.
6. **Şövalye savunması:** Bot şövalyeler yalnız diğer botların değil, yakın menzilde görünür oyuncu kılıç/kargı hamlesinin de hazırlığını fark edebilir. Kalkan açma/parry pencereleri korunur.
7. **FFA sınırı:** Hedef dağıtma, player dogpile sınırlaması, bot-bot hasar ve ölüm kayıtları korunur. Düşmanların hepsi oyuncuya odaklanmaz.

## Görsel kabul ve ölçüm kontrol listesi

- Her sınıfla ilk olarak 2–4 dakikalık maç: botların saldırı hazırlığı okunabilir mi; eskisine göre ölüm daha anlamlı ama aşırı ani değil mi?
- Şövalyeye kılıç/kargı ile yaklaş: gerçek görüşte kalkan kullanıyor mu, arkadan saldırıya karşı koruma kazanmıyor mu?
- Okçu/tüfekçiyi vur: mümkünse yana hareket edip hâlâ açık mevziden ateş ediyor mu; kapalı taş/ahşap duvar içine girmiyor mu?
- Ranged saldırı sırasında sur/kapı arkasına geç: mermi/ok hâlâ vuruyor mu?
- Aynı anda altı botun birbirlerini hedeflediğini, bot-bot öldürmelerini, canlı TAB ve JSON test raporunu doğrula.
- 8 dakikalık maç + tekrar oyna: aim/windup, bot hasarı ve stat sıfırlama hata üretmemeli; konsolda siyah ekran hatası olmamalı.

**Karar:** Bu ilk değerler kullanıcı denemesiyle değerlendirilecek, mutlak optimum oldukları iddia edilmiyor. Hasar çok yüksek/az çıkarsa oynanış raporlarına göre ikinci, daha küçük ayar yapılabilir. Gerçek GPU testinden önce PR main'e birleştirilmez.
