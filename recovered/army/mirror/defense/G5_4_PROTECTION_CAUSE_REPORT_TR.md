# Kill the King — G5.4: Koruma hattı, komuta ve hareketsiz oyuncu etkisi

## Doğrulanmış kapsam
- Kaynak: **G5.4 gerçek CPU motoru**, SHA-256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`.
- **1600 tohumu; 2 sınıf (tüfekçi/mızrakçı) × 2 emir (ilerle/mevzi tut) × 2 taraf (mavi/kırmızı) × 4 koşul = 32 gerçek motor savaşı**.
- Dört koşul: mevcut oyuncu komutası; oyuncu karakterini hedef dışı bırak; aynı bölüğü AI komutanına bırak; AI + hedef dışı karakter.
- Değişiklikler yalnız test sırasında kurulan geçici oyun durumunda; yayımlanan oyun motoru, silah dengesi, atış hızı, FFA ve kazanan hesabı değiştirilmedi.
- 8 temel oyunun **kazananı ve bitiş saniyesi**, geçmiş GitHub 64-savaş raporuyla birebir eşleşiyor.

## Sonuçlar
| Oyuncunun yönettiği birlik ve emir | Kazanılan maçlar | Menzilli yakın koruma oranı | Yönetilen bölük öldürmeleri |
|---|---:|---:|---:|
| Tüfekçi / İlerle | 0/2 | %59.7 | 18 |
| Tüfekçi / Mevzi tut | 0/2 | %29.1 | 42 |
| Mızrakçı / İlerle | 1/2 | %56.0 | 2 |
| Mızrakçı / Mevzi tut | 2/2 | %58.5 | 9 |

- **Hareketsiz oyuncuyu hedef dışı bırakmak:** Kazanan tarafı **0/8** maçta değiştirdi. Bazı maçların süresinde küçük farklılık oluştu; bu, oyuncu karakterinin hiçbir etkisi olmadığı anlamına gelmez.
- **Bölük komutasını AI'ya devretmek:** Kazanan tarafı **3/8** maçta değiştirdi.
- Tüfekçi / mevzi tut: yakın koruma **%29.1**, 0/2 galibiyet, 42 bölük öldürmesi.
- Mızrakçı / mevzi tut: yakın koruma **%58.5**, 2/2 galibiyet, 9 bölük öldürmesi.

## Yorum ve sınırlar
Yakın koruma, menzilli bir askerin çevresinde **30 dünya birimi** içinde canlı bir dost mızrakçı veya kılıçlı bulunmasıdır. Bu yalnızca **mekânsal vekil ölçümüdür**; fiziksel olarak hedef alınmayı veya merminin engellenmesini doğrudan ölçmez.

Bu sonuçlar tüfek hasarı ya da atış hızında bir hata kanıtlamıyor. Ayrı bir tohum, elle nişan alma ve gerçek WebGL olmadan dengenin kesin açıklaması olarak yorumlanmamalı. AI komutanına devretmek, **oyuncunun aynı kararları alması** anlamına gelmediğinden, deney komuta otoritesinin etkisini gösterir; tek tek taktik nedenleri ayırmaz.

**Sonraki teknik iş:** 1) Okçu–tüfekçi koruma atamalarının sürekliliği, 2) Kimin kimi hedef aldığına dair canlı isabet olayları, 3) Farklı tohumlarda kontrol, 4) GPU/WebGL tarayıcı testi. G8.4 kaynağı hâlâ kayıp.

## Düşman hasar olaylarının hedef türüne göre dağılımı
1600 tohumu, mavi+kırmızı oyuncu, **mevzi tut** emri ve orijinal oyuncu kontrolü altında:

| Ölçüm | Tüfekçi komutası | Mızrakçı komutası |
| --- | ---: | ---: |
| Orduya isabet eden düşman hasar olayları | 498 | 511 |
| Hedefi menzilli asker (tüfekçi+okçu) olanlar | 178 | 84 |
| Menzilli askere isabet oranı | **%35,7** | **%16,4** |

Bu, kayda geçmiş **başarılı hasar olaylarının hedef türü** dağılımıdır; AI'nın hedefleme niyetini veya tamamen bloke edilen atışları saymaz. Sonuçlar aynı başlangıç tohumuna ait iki farklı oyuncu birliği ve emri için karşılaştırıldı.