# KUŞATMA KALESİ — TASARIM VE OYUN SÖZLEŞMESİ

**Sürüm:** S1 ön sözleşme / kullanıcı tarafından revize edilebilir, 18 Kasım 2026.  
**Kaynak:** Kullanıcı **bir adet** kuşatma kale savaşı istiyor; ayrı bir üçüncü serbest arena haritası değil.

## Kısa oyun tarifi

- **Kırmızı saldıran ordu:** Dış kuşatma hattında başlar. Ana kapıyı kırar **veya** yan sur çıkışlarından birini açar. İç avluya girer, ardından iç kale/komuta noktasını ele geçirir.
- **Mavi savunucu ordu:** Sur üstü atış mevzileri, kapı arkası yakın dövüş hattı, avlu rezervi ve iç kale savunması kurar. Süreyi bitirir veya saldıran tarafın askerlerini tüketirse kazanır.
- **Oyuncu:** Gelecek 3B modda saldıran ya da savunucuyu seçer; dört mevcut asker tipinden birini seçer. Ayrı oyuncu emirleri ve takım AI birbiriyle çatışmayacak.

## Fiziksel katmanlar

1. **Dış alan:** Rampa/ana kapı önü, açık savaş ve topyekûn kuşatma yerleşimi.
2. **Kale çevresi:** Dört sur parçası, ana kapı, iki güvenli yan merdiven/çıkış bağlantısı, savunma atış pozisyonu.
3. **İç avlu:** Kapı veya merdivenden içeri girilen çoklu girişli geniş mücadele bölgesi.
4. **İç kale:** Avludan ayrı güvenlik eşiği ve son komuta bölgesi.

## Faz ve zafer sözleşmesi

- `APPROACH`: Henüz geçerli sur yolu açılmadı. Kapı HP düşebilir; iki merdiven/çıkış kurulumu ilerleyebilir.
- `BREACH`: Kapı HP 0 oldu **veya** en az bir sur erişimi geçerli açıldı. Bu **tek başına kazanmak değildir.**
- `COURTYARD`: Gerçek kırmızı işgalci birlik iç avlu kontrolünü savaş kurallarına göre elde etti. Savunma buna itiraz edebilir; sonraki iç kale noktası ancak ondan sonra açılır.
- `KEEP`: İç kale noktası aktif; kırmızı oyuncular/silahlar gerçek savaş ve bölge kontrolüyle bu noktada tutunur.
- `RESULT`: Saldıranlar iç kaleyi tamamlar, savunanlar süreyi tamamlar ya da saldıran tüm askerler ölür. Tek açık sonuç vardır.
- **Kapı HP sıfır + avlu boş** = hâlâ saldıran kazanmadı.
- **Merdiven açık + iç kale noktası** = avlu şartı atlanamaz.
- **Bir bölgeyi gerçekten kontrol etmek için** canlı saldırgan varlığı ve canlı savunucu yokluğu gerekir; aynı anda iki takım varken işgal süresi ilerlemez.
- Her durumda taraf, hasar/işgal ve zaman olayları doğrulanır. Önizleme debug düğmeleri G5.4 yapay zekâsının yerine geçmez.

## Ordu taslak dağılımı (nihai sayılar onaya açık)

İlk motor bütünleşmesinde **140 asker / taraf başı 70** mevcut G5.4'ten türetilir. Doğrulanmış mevcut G5.4 takım başı bölükler: 10 tüfekçi, 25 mızraklı, 15 okçu, 20 kılıçlı. Gerçek kuşatma AI'sı ayrı eklenene kadar bu bir **yerleşim önerisi**, kuşatma denge kabulü değil.

## Olmayan/ertelenenler

İlk kuşatmada oyuncu komutasında **gerçek** mancınık, kaynar yağ, birden fazla yıkılabilir sur, devasa kale şehirleri ve beş ayrı kuşatma senaryosu zorunlu değildir. Bunlar ileride ayrı kapsam/onay işidir.

## Kaynak sınırları

Mevcut birleştirilmiş aday, FFA/TDM ve G5.4 ordu modlarını **izole iki iframe** ile çalıştırır. Kuşatmayı ayrı üçüncü mod olarak eklemek S3'te planlanır; bu belgeler ve S1 kodları o başlatıcıya henüz bağlanmış değildir. Kullanıcının önceki kritik kararı: arena **bot** okçusu 0,5 saniye, normal oyuncu yayı 2 saniye minimum/3 saniye tam güç; diğer onaylar korunur.

## Önizleme uyarısı

S1'deki geometri, kapı HP ve faz ilerleme simülatörü **gerçek asker nişan alma, 140 gerçek asker ve grafiksel oyun kabulü değildir**. Demo sonucu yalnız senaryo kodunun ve görsel harita yerleşiminin ilk denemesidir. S2/S3 bu sınırı kaldırmayı hedefler.
