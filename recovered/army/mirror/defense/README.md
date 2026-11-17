# G5.4 — koruma hattı / oyuncu avatarı / komuta kaynaklı etki

**Yayın kabulü değil; orijinal G5.4 üzerinde gerçek CPU testleri.**

## Ölçüm tasarımı (17–18 Kasım 2026)

1600 tohumu × (tüfekçi, mızrakçı) × (ilerle, mevzi tut) × (oyuncu mavi, oyuncu kırmızı) × (4 geçici test durumu) = **32 doğal savaş**. Motor kimliği: `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`.

Geçici koşullar: normal oyuncu komutası, hareketsiz oyuncu karakterini hedef dışına çıkarma, bölüğü tekrar AI komutanına bırakma, ikisinin birleşimi. Testler yalnız **ayrı simülasyon durumlarını** değiştirir; kaynak motor, FFA, silah hasarı, atış hızı, dost ateşi ve galibiyet koşulu değişmez.

| Oyuncu bölüğü / emir | Doğal galibiyet | 30 birim içindeki canlı yakın koruma | Komuta edilen bölük öldürmesi |
| --- | ---: | ---: | ---: |
| Tüfekçi / ilerle | 0/2 | %59,7 | 18 |
| Tüfekçi / mevzi tut | **0/2** | **%29,1** | **42** |
| Mızrakçı / ilerle | 1/2 | %56,0 | 2 |
| Mızrakçı / mevzi tut | **2/2** | **%58,5** | **9** |

**Hareketsiz avatar hedeflemeyi kapatmak:** bu 8 başlangıç senaryosunun **0/8**'inde galibi değiştirdi; bazı maç süreleri farklı. **Oyuncunun bölüğünü AI'ya vermek:** **3/8**'inde galibi değiştirdi. Bu, ön hat/komuta bağlantısının önemli bir katkı sağlayabileceğini gösterir, tek başına mekanizmanın nedensel ispatı değildir.

**Yakın koruma vekil ölçümü:** canlı bir menzilli asker 30 dünya birimi yakınında en az bir canlı dost mızrakçı veya kılıçlı bulunması; gerçek mermi durdurma/hasar önleme/AI hedef devretme sayısı değil.

## Tekrar üretim

- `node recovered/army/mirror/defense/protection_counterfactual.mjs 0 1` — 1600, mavi tüfekçi ilerle, 4 gerçek koşul.
- `node recovered/army/mirror/defense/protection_counterfactual.mjs 6 1` — 1600, mavi mızrakçı mevzi tut.
- GitHub Actions [8 paralel grup ve kaynak bütünlüğü denetimi](https://github.com/zxc28tarik/killtheking/actions/workflows/g5_4_defense_exposure_gate.yml) bütün 32 koşulu yeniden üretir; en son akışın başarılı olduğunu doğrulamadan CI'ya PASS denmez.

## Öncelik / koruma ilkeleri

1. Birlik koruma görevi ve düşman hedef seçimi ölçümlerini farklı tohumlarla tekrar et.
2. Kılıçlı/mızrakçı savunma rollerini oyuncu tüfekçi komutası altında korumak için gerekirse AI koordinasyonuna **izole bir aday düzeltme** ekle; önce gerçek 32–64 savaşla güvenli olduğunu doğrula.
3. Onaylanmış tüfeğin 4 atış/dakika ve okçunun 15 atış/dakika kurallarını değiştirme.
4. Gerçek kırmızı oyuncu web menüsü, GPU/WebGL ve kayıp G8.4 ayrı açık kabul kapılarıdır.

Sınır: tek başlangıç tohumu, gerçek avatar nişan alışı yok, CPU simülasyonu; matematiksel olarak tam aynalı rastgele özellik dağılımı değil.
