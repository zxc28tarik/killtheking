# G5.4 — Çoklu tohum / gerçek motor sonuçları (17 Kasım 2026)

**Kapsam:** Daha önce seed 1600 ile 8/8 doğal galibiyet veren `G5.4 contact recovery` AI düzeltmesinin 1776, 2026 ve 31415 tohumlarıyla yeniden sınanması. Her tohumda 4 asker sınıfı × iki emir = 8 adet 70v70 gerçek CPU maçı, azami 600 simülasyon saniyesi.

| Tohum | Doğal bitiş | Bitmeyen | Son 300 sn kayıp yok |
|---|---:|---:|---:|
| 1600 (önceki test) | 8 | 0 | 0 |
| 1776 | 5 | 3 | 1 |
| 2026 | 5 | 3 | 1 |
| 31415 | 7 | 1 | 0 |
| **Toplam** | **25/32** | **7/32** | **2** |

**Sonuç: P0 savaş bitişi yayın kapısı BAŞARISIZ.** 24 yeni gerçek motor maçının 17'sinde galibiyet var, 7'si 600 saniye sınırında sonuçlanmıyor. Bitmeyenler beraberlik olarak değerlendirilmedi. **Şimdiye kadar sonuçlanan 25/32 CPU savaş** tam ürün kabulü değildir.

## Tek tek sonuçlanmayan senaryolar

| Tohum | Oyuncu sınıfı | Emir | Yaşayan mavi/kırmızı | 600 sn en yakın karşıt asker mesafesi |
|---|---|---|---|---:|
| 1776 | Tüfekçi | İlerle | 7 / 10 | 130.6 |
| 1776 | Okçu | İlerle | 7 / 14 | 135.1 |
| 1776 | Okçu | Mevzi tut | 2 / 10 | 129.0 |
| 2026 | Okçu | Mevzi tut | 8 / 9 | 127.8 |
| 2026 | Kılıçlı | İlerle | 4 / 7 | 131.2 |
| 2026 | Kılıçlı | Mevzi tut | 10 / 5 | 89.3 |
| 31415 | Tüfekçi | İlerle | 5 / 9 | 131.3 |

İki senaryoda son 300 saniyede hiç yeni kayıp yoktu. Diğer beşinde bazı kayıplar yaşandı ama doğal galibiyet oluşmadı. Mesafe, ateş/siper/görüş hattı hatasının doğrudan kanıtı değildir; bir sonraki aşamada canlı birlik hedefi, gerçek atış fırsatı ve koordinatları incelenmeli.

## Kanıt ve sınırlamalar

- Değişmeyen kaynak: `recovered/army/candidates/arena-army-battle-contact-recovery.js`, SHA-256 `9e992cf37f621172036ff06a3a27eb227c69fa81fcb043666ccf160f26d17df3`.
- CI'daki `g5_4_multiseed_gate.mjs` 24 gerçek maçı yeniden çalıştırır; doğrudan motorun `winner`, canlı birimleri ve dakika kontrol noktalarını inceleyerek sonuçları doğrular. Normal test çalışmasının başarılı olması bu **yayın kapısının başarısız** olduğu gerçeğini değiştirmez.
- **Gerçek aynalı taraf değişimi 0/144.** G5.4'te `create(seed, playerType)` oyuncuyu daima mavi/sol tarafta açar; `frontDir`, rakibin oyuncuya hasarı ve takım AI renk/saha yönüne bağlıdır. X koordinatlarını keyfî eksiyle çarpmak geçerli taraf aynalaması değildir. Bu destek eklenene kadar simetrik adalet sonucu çıkarılamaz.
- Kayıp Kasım `G8.4` oyun motoru hâlâ geri alınamadı (issue #44).
- `main`, FFA, hasar/atış ritmi, galibiyet kuralı ve orijinal G5.4 arşivi değişmedi. Bu sürüm gözlemsel denetimdir.
- Ekim ordu sürümünün insan tarafından GPU/WebGL kabulü henüz yapılmadı.

## Sıradaki eylemler

1. Yayın engeli #46 açık tutulmalı; bu yedi senaryonun kaynak özeti ve verileri referans alınmalı.
2. 300–600 saniyedeki yaşayan menzilli bölüklerin gerçekten düşman görebildiği, nişan alabildiği ve ateş edip etmediği ölçülmeli.
3. Gerekiyorsa yalnız kanıtlanmış AI problemi düzeltilmeli; tüm dört tohum × 4 sınıf × 2 emir yeniden ölçülmeli.
4. Önce G5.4 için güvenilir yer değiştirme altyapısı, sonra güncel G8.4 geri kazanıldığında 144 gerçek karşılıklı ayna maç. Sahte aynalama raporlanmamalı.
