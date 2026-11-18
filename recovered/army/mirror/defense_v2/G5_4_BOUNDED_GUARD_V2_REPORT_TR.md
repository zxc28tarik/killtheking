# G5.4 — Kısa süreli ikinci ateş hattı koruması (deneysel v2)

**Durum: NOT APPROVED / YAYIN KABULÜ YOK.** Orijinal G5.4 oyunu, FFA, silah hasarları, oyuncu emirleri ve GitHub main değişmedi.

## Gerçek kodda değişen

Önceki koruma adayı ikinci atıcı bölüğe 120 birimden erken müdahale ediyor ve kılıçlı hücumunu uzun süre geciktiriyordu. Yeni aday sadece:
- ikinci menzilli bölüğe **100 birimden yakın** gerçek yakın dövüş tehdidini ve kılıçlı bölüğün atıcıya **126 birimden yakınlığını** değerlendirir;
- ikinci koruma için **en fazla 4 saniyelik** görev başlatır; yeniden aynı göreve geçmeden **16 saniyelik aralık** uygular;
- önceki en yüksek öncelikli geri çekilme, toparlanma ve acil destek işlerini korur; oyuncu bölüğüne emir yazmaz.

Bağımsız aday kodu: `recovered/army/mirror/arena-army-battle-protection-v2-bounded.js`. Kaynak SHA-256: `f911e9175f6ab9c23fc06b5e123fe94c018853f2fd813cb8dfd937f60e5907d4`.

## Karşılaştırmalı gerçek CPU muharebesi

Dört tohum, iki komuta sınıfı, iki emir, iki oyuncu tarafı arasından seçilen **12 özdeş senaryo** üç kaynak sürümünde çalıştırıldı: önceki sabit motor + eski koruma adayı + yeni kısa görev adayı = **36 tam maç**. Yeni aday için **12/12 gerçek eliminasyonla bitiş** (600 saniye sınırı). Galibiyet kuralları ve tüfek/ok hasarı değiştirilmedi.

| Ölçüm | Başlangıç motoru | Önceki koruma | Kısa görev v2 |
| --- | ---: | ---: | ---: |
| 30 birim içinde menzilli yakın koruması | %42,93 | %49,68 | **%46,25** |
| Ortalama maç süresi | 280,89 sn | 381,22 sn | **308,01 sn** |
| Oyuncu ordusu galibiyeti | 2/12 | 2/12 | **3/12** |
| Doğal bitiş | 12/12 | 12/12 | **12/12** |
| İkinci hat koruma gözlem örneği | 0 | 136 | **21** |

Önceki adaya göre **73,21 saniye daha hızlı**, fakat eski oyuna göre **27,12 saniye daha yavaş**. Eskiye göre koruma **8/12** senaryoda iyileşti; **4/12** geriledi. **Bir** muharebenin galibi değişti (1600 tohum, mavi tüfekçi, mevzi tut); bu, yeterli adalet verisi değildir.

Koruma oranı, yalnızca canlı menzilli askerin çevresinde canlı dost yakın dövüş askerinin bulunmasıdır. Engellenmiş hasar miktarı veya gerçek oyuncu becerisini ölçmez.

## Kalite kapısı

14 motor/sözleşme testinin yanı sıra GitHub Actions 12 karşılaştırma çiftini tekrar çalıştırıp SHA-256 ve referans değerleriyle eşleştirmelidir. Bu testlerin başarılı olması dahi **sürümü onaylamaz**.

**Kabul edilmeme gerekçeleri:** dört gerileme, hâlâ +27 sn maç süresi, her sınıf için geniş örneklem yok, manuel WebGL/GPU testi yok, G8.4 kaynağı hâlâ eksik (#44). Sorunlar #46 ve #47 açık kalır. Ne bu aday ne de önceki deneysel koruma motoru `main`'e alınacaktır.
