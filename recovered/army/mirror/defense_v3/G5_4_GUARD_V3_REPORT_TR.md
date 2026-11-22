# Kill the King — G5.4 koruma AI v3 (görev bitişinde hedef serbest bırakma)

**Durum: DENEYSEL / NOT APPROVED.** Yalnızca G5.4 CPU ordu motoru. Ana oyun, FFA hareketi, oyuncu emirleri, silah değerleri ve `main` değiştirilmedi.

## Kök neden ve tek kod değişikliği

V2'de kılıçlı müdahalesi 4 saniyelik görev ve 16 saniyelik yeniden çağrı penceresiyle sınırlandırılmıştı. Ancak `moveSquad` işlevindeki ikinci ateş hattı hedefi, bölüğün hiç operasyon rolü yoksa `(!s.operationRole || s.aiRole==='second-fire-line-guard')` üzerinden **görevi bitmiş kılıçlıyı da** ateş hattına yönlendirebiliyordu. Bu, hücum niyetiyle koruma hedefine doğru hareket arasında uyumsuzluk yaratan kaynak düzeyi risktir.

V3'te ikinci ateş hattı mevzisi yalnızca **`s.aiRole==='second-fire-line-guard'` ve `state.elapsed<s.secondGuardUntil`** durumunda kullanılabilir. Yeni hasar, hız, silah veya galibiyet kuralı eklenmedi; ayrı kaynak adayı oluşturuldu.

**Kaynak SHA-256:** `5ba893b6e812943e77607ed1b288be93b1e2daeeb6fdf6569b54907a38db0826`.

## Gerçek CPU A/B sonuçları

Eski motorun ve v2'nin daha önce GitHub CI tarafından onaylanan kayıtları kaynak SHA ile sabitlendi. V3 aynı 12 senaryoda **yeniden çalıştırıldı** (4 tohumdan örnekler; tüfekçi/mızrakçı komutası, iki oyuncu tarafı ve ADVANCE/HOLD). Gerçek 140 askerli `ArenaArmyBattle` kullanıldı, en fazla 600 simülasyon saniyesi.

| Ölçüm | Eski motor (kayıt) | Koruma v2 (kayıt) | Koruma v3 (yeniden CPU) |
| --- | ---: | ---: | ---: |
| Yakın koruma (30 birim) | %42,93 | %46,25 | **%45,97** |
| Ortalama bitiş süresi | 280,89 s | 308,01 s | **283,66 s** |
| Oyuncu ordusu galibiyeti | 2/12 | 3/12 | 2/12 |
| Doğal kazanan | 12/12 | 12/12 | 12/12 |
| Orijinale göre koruma artışı | — | 8/12 | **6/12** |
| Orijinale göre koruma gerilemesi | — | 4/12 | **6/12** |

V3, v2'ye göre **24,35 saniye** daha hızlı; eski motorla farkı **+2,77 saniye**. V3'te 12/12 kazanan orijinal motorla aynı, v2 ile 11/12 aynı. Her 12 oyunun galibi gerçekten askerlerin elenmesiyle belirlendi; süreye dayalı yapay zafer eklenmedi.

**Karar:** Takımın tüm koşullarında savunma iyileşmediği için **oyuna entegre edilmez**. Yakın koruma bir vekil metriktir; engellenen gerçek hasarı kanıtlamaz. Bir sonraki aday için düşman tehdidine dayalı görevlendirmeyi ve oynanış hızını birlikte test etmek gerekir.

## Kanıtlar ve sınırlar

- Gerçek motor sürümleri: `arena-army-battle-true-side-swap.js`, `arena-army-battle-protection-v2-bounded.js`, `arena-army-battle-protection-v3-role-gated.js`.
- 12 v3 simülasyonunun beklenen olay ve hasar sayıları `guard_v3_reference.json` içinde tutulur.
- `test_guard_v3.mjs` yalnız bir hedef belirleme bloğunun değiştiğini, oyuncu komutlarını, takım kimliğini ve dost ateşi kurallarını kontrol eder.
- GitHub iş akışı `g5_4_protection_v3_gate.yml` 12 v3 maçını yeniden koşturur; `audit_v3.mjs` motor özetlerini kaynak SHA ve eski v2 kayıtlarıyla karşılaştırır.
- Bu denetim **mükemmel geometrik aynalama**, **WebGL/GPU oynanışı**, **200/280 askerli savaş**, **bireysel FFA entegrasyonu** veya **kayıp G8.4 kaynak kurtarma** kanıtı değildir.

İlgili izleme: #44 (G8.4), #46 (savaş bitişi), #47 (koruma/birim dengesi). PR #45 taslak olarak korunur.