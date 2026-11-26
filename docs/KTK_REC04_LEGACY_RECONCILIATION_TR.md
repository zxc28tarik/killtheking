# REC04/05 — 15 eski PR kaynak kodu uzlaştırması
2026-11-26. Referans: PR #89, otomatik kabulü geçen eb2e46c4184473b2c37924812689a01e4947c06c; HTML blob bcc417ea91bbab7a713e7f29b35e66fb18f03d6a. Her PR'ın kendi unified diff'i incelendi; eklenen 20 karakterden uzun satırlar gerçek inline HTML ile karşılaştırıldı. Sayılar yalnızca satır eşleşmesidir, davranış eşdeğerliği yüzdesi değildir. Eski src dosyaları güncel HTML'ye kopyalanmayacak.

| PR | Somut kod kanıtı | REC05 kararı |
|---|---|---|
| #28 | match-flow 13/13, oyun 74/78, CSS 31/31; ArenaMatch.DURATIONS 120/240/480, renderLiveScoreboard, hideLiveScoreboard | Mevcut, eski menüye dönülmez |
| #29 | QA 67/68, telemetry 48/51, oyun 35/38; killtheking-match-qa-v2 JSON export; sürekli navStuck sayacı | Mevcut, v1 şeması ve yanlış waypoint filtresi geri getirilmez |
| #30 | recovery modülü 33/33; chooseArenaTarget içinde ArenaBotRecovery.allows, 3.2s eşik | Mevcut temel, hedef seçimi ilerlemiş; AI değişikliği yasak |
| #31 | motion 8/8; telemetry 3/3; gerçek turnToward çağrısı; navStuck sürekli ölçülüyor | Mevcut temel, eski dönüş çağrısı kopyalanmaz |
| #32 | offense 31/33, combat tactics 13/15, oyun 50/71; eski 1.70/1.95s saldırı aralıkları artık 4/15 | Eski AI/damage önerisi uygulanmaz, kullanıcı dondurması |
| #33 | weapon balance 44/46, oyun 57/69; RULES hasar değerleri, 4/15s cadence; eski 1.5s draw yerine 3s | Sonraki onaylı sistem korunur; eski menü/AI geri getirilmez |
| #34 | weapon balance 21/22, oyun 37/43; #35 gerçek mesh/proxy hit ile eski yaklaşım değiştirilmiş | Eski ranged shot algoritması geri getirilmez |
| #35 | hit3d modülü 49/49, telemetry 15/15; ArenaCombatHit3D.resolveBot/resolvePlayer gerçek çağrıları | Mevcut; dinamik çatışma kabulü ayrıca |
| #36 | teams 20/20, oyun 100/108; teamForBot 4v3, canDamage dost ateşi koruması | Mevcut, eski hedef mantığı kopyalanmaz |
| #37 | performance 41/41, motion 11/15, oyun 31/43; sonraki FIT04 uzak etiket optimizasyonları | Mevcut temel; donanım benchmark yok |
| #38 | weapon balance 21/21, oyun 46/48; 1s recovery/2s minimum/3s full draw | Mevcut, HUD daha yeni |
| #39 | performance 41/41, motion 12/12, oyun 35/37 | #37/#38 ile örtüşür; eski projeksiyon geri yüklenmez |
| #40 | settings 30/30, oyun 64/64; ArenaSettings.load/save, pixelRatio ve menü bridge | Mevcut |
| #41 | layout 18/49, oyun 96/103; eski 98x98 arena yerini büyütülmüş düzene bıraktı | Superseded; harita küçültülmez |
| #42 | layout 44/44, grass 107/122, oyun 24/47; PREVIOUS_AREA_MULTIPLIER=20, AREA_MULTIPLIER=300, OPT02/GR01 | Superseded/extended; eski çimen render sistemine dönülmez |

#43 ayrı QA araçları: metadata doğrulandı. 357 izole test ve 0/144 gerçek eşleştirilmiş maç. Üretim motoru değildir, eski kaynak eksikliği nedeniyle bu adayın içine katılmaz. G8.4 kaynağının birebir doğrulaması olmadan yeniden entegrasyon yok.

## Yeni kabul kanıtı
tests/rec04_inline_legacy_reconciliation.test.mjs: sekiz Node testi doğrudan gerçek HTML içindeki modülleri VM'de çalıştırır; maç süresi, telemetri, sıkışma kurtarma, silah kuralları, takım, performans sayacı, ayarlar ve meydan ölçeği. Ayrıca canlı runtime çağrı işaretleri kontrol edilir. Yeni CI sonucu henüz görülmedi. Bunlar tam maç/gerçek GPU testi yerine geçmez.

## Durum
REC04: 15/15 PR diff karşılaştırıldı; eski testlerin birebir fonksiyon düzeyindeki tüm farkları ve gerçek oyun eşdeğerliği henüz tam kanıtlanmadı.
REC05: yeni bir güvenli eksik özellik tespit edilmedi; önceki REC02 FIT04a düzeltmeleri korunur. Eski kodu gereksiz yere birleştirme. AI, aydınlatma, renk, menü ve mevcut haritalar değiştirilmedi. Bu turda gameplay kodu değişmedi; sadece test ve bu kayıt eklendi. Eski PR'lar REC08'e kadar açık kalır. 
