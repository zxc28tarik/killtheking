# G8.5F — Kaynak kurtarma ve gerçek motor için pasif kayıt köprüsü

Bu klasör, oynanabilir **G8.4/G8.5 oyun sürümü değildir**. Güncel kaynak elde edilene kadar eski G5.4'e geri dönüş yapmak yerine oyun dışı uyum kontrolleri oluşturulmuştur.

## Kullanım

Kaynak doğrulama (HTML/ZIP'i geri getirdikten sonra):

```sh
python g8_5f_source_gate.py KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html --zip KillTheKing_G8_4_KaynakKod.zip
```

Sonuç `candidate_for_manual_review` dönerse sürüm incelemesine geçilebilir; **oynanışın veya entegrasyonun doğrulandığı anlamına gelmez**. ZIP'te aynı adlı HTML farklıysa kırmızı hata verir. Eski G5.x benzeri kaynaklar işaretleri taşımıyorsa reddedilir.

Sadece mevcut QA testlerini çalıştırma:

```sh
for f in test_*.mjs; do node "$f" || exit 1; done
python test_g8_5f_source_gate.py
```

Windows PowerShell'de:

```powershell
Get-ChildItem test_*.mjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw 'Node testi başarısız' } }
python test_g8_5f_source_gate.py
```

## Gerçek motordan beklenen olaylar

| Olay | Gerekli alanlar | Kaynak |
|---|---|---|
| `battle:ready` | `battleId, meta, rosters` | Gerçek askerler yaratıldıktan sonraki fiilî konumlar |
| `battle:frame` | `battleId, frameMs, stuckSoldiers?` | Gerçek render/physics döngüsü |
| `army:decision` | `battleId, tick, kind, actorId, payload` | Gerçek AI karar noktası |
| `battle:result` | `battleId, outcome` | Motorun nihai maç sonucu |
| `battle:aborted` | `battleId, reason?` | Motorun gerçek durdurma olayı |

Köprü kullanımı: `import {attachPassiveBattleTelemetry} from './g8_5f_event_bridge.mjs'` ve `const watcher=attachPassiveBattleTelemetry(actualEngineEventBus,{onResult:callback});` — event bus'ın `subscribe(topic,cb)` çağrısının temizleyen bir fonksiyon döndürmesi zorunludur. Örneğin gerçek oyun entegrasyonu değil, yalnızca çağrı sözleşmesidir.

## Sınırlar

- Kayıt dosyasına `production_game` yazmak tek başına üretim kanıtı değildir.
- `G8_5F` tam oyuna **bağlı değildir**, 144 gerçek maç çalıştırılmadı.
- Oyun kaynak dosyaları kullanıcı açıkça tam sürümü verene/kurtarana kadar eski dal ile üstüne yazılmamalıdır.
- Sunulan kararlar kullanıcının isteğiyle daha sonra revize edilebilir.
