# Kill the King — Botların oyuncuya saldırması: gerçek hasar ve ordu regresyonu

**Durum:** TESTLER GEÇTİ, YAYIN/DENGE ONAYI YOK. 18 Kasım 2026. `main` ve özgün FFA/G5.4 arşivi korunur.

## Gerçek FFA saldırı fonksiyonunun doğrulanması

[GitHub Actions #44221178738](https://github.com/zxc28tarik/killtheking/actions/runs/44221178738) **30/30 TEST PASS**: 7 kaynak/kurulum testi, 5 mod seçimi testi, 9 oyuncu hedefleme testi, 9 gerçek bot saldırısı ve hasar testi. Testler sahte bir hasar değeri koymak yerine oyun içindeki `arenaBotAttack` fonksiyonunu, gerçek **Three.js r128**, `ArenaCombatHit3D`, `ArenaWeaponBalance`, `ArenaCombatDefense` ve `ArenaBotOffense` modülleriyle çalıştırır.

100 HP gövde vuruşları: kılıçlı **20**, mızrakçı **35**, okçu **23**, tüfekçi **90**. Hedef seçimi→gerçek bot saldırısı→oyuncu HP kaybı aynı VM akışında doğrulanır. Siper arkasından yanlış isabet, dost oyuncu hasarı, arkaya dönük vuruş ve tüfek atış sıklığı testleri de geçti. **Gerçek GPU/WebGL oynanış testi değildir.**

## Ordu hedefleme yamasının 32 gerçek savaşlık regresyonu

- İlk **1,25** yakınlık eşiği, `1600 / sword / hold / blue` oyununda **600 sn'de doğal sonuç üretmedi**. Bu sürüm reddedildi; iş akışı hatayı doğru biçimde yakaladı.
- Yeni **1,0** yakınlık eşiği ve **1/5** düşman askeri oranıyla 16 eşleştirilmiş G5.4 senaryoda eski/yeni CPU motorları toplam 32 tam savaş koşturuldu.
- [GitHub Actions #44222071908](https://github.com/zxc28tarik/killtheking/actions/runs/44222071908): **32/32 doğal bitiş**, kaynak SHA ve gerçek kazanan bütünlüğü geçerli.
- Oyuncuya isabet toplamı **13 → 15**, ortalama bitiş süresi **284,91 → 283,69 sn**.
- **1/16 kazanan değişti**: `1600 / pike / hold / blue` — orijinal mavi zafer, güncel deneysel yamada kırmızı zafer.
- Test sınırlaması: **tek tohum 1600**, dört sınıf, iki emir, mavi/kırmızı oyuncu. Matematiksel tam ayna, gerçek insan nişanı ve GPU oynanışı doğrulanmadı.

## Son karar

FFA'da kullanıcıya saldırma kodu, hedef→isabet→HP kaybına kadar gerçek kaynaklarla test edildi. Ordu yaması yeni kilitlenme yaratmayan bir adaydır; **denge onayı verilmedi**. Bu tek HTML prototipi eski iki modu ayrı iframe ortamında çalıştırır; G8.4 kaynağı halen kayıp, gerçek GPU kabulü açık. `main` değiştirilmez, PR #48 taslak olarak kalır.
