# Kill the King — Kuşatma Kalesi S1

**Durum: S1 oyun mantığı ve 3B harita önizlemesi kodlandı; gerçek 140 asker savaş motoru entegre DEĞİL.** Bu klasör yeni **tek bir kuşatma senaryosu** için ayrılmıştır. FFA/TDM, özgün kale, çimenlik meydan ve G5.4 ordu modları bu aşamada değiştirilmedi.

## Tasarım ve plan

- [Aşamalı uygulama planı](../../docs/SIEGE_CASTLE_DEVELOPMENT_PLAN_TR.md)
- [Kale, kuşatma, bölge ve zafer sözleşmesi](../../docs/SIEGE_CASTLE_DESIGN_CONTRACT_TR.md)

## S1'de uygulananlar

1. `siege-map.js` — Tek kuşatma kalesinin gerçek veri temsili; ana kapı, surlar, iki yan çıkış, dış saldırı hattı, iç avlu ve komuta noktası. Her taraf için 10 tüfekçi + 25 mızrakçı + 15 okçu + 20 kılıçlı **yerleşim planı**.
2. `siege-objectives.js` — Bağımsız, deterministik `APPROACH → BREACH → COURTYARD → KEEP → RESULT` motoru. Saldıran kırmızı, savunan mavi. Kapı HP, iki merdiven, gerçek varlık olaylarından ileride alınacak bölge kontrol verileri, zaman sınırı ve kazanma koşulları.
3. `siege-preview-template.html` + `siege-preview.js` — Yerel Three.js ile ayrı **3B kale ve 140 statik yerleşim işareti**. İşaretler asker AI'sı değil. Butonlar yalnız **elle verilen test olayları** gönderir; gerçek asker kapı kırıyormuş gibi sunulmaz.
4. `build_siege_preview.mjs` — Dışa bağımlılığı olmayan, Three.js r128 dahil gömülü **tek çevrim dışı HTML** üretir; SHA-256 kaynak manifesti oluşturur.
5. `test_siege_phase1.mjs` ve `browser_siege_preview_smoke.mjs` — Faz geçişleri, güvenlik, gerçek WebGL sahnesi ve UI testleri.

## Doğrulanmış ilk S1 kanıtı

- [GitHub Actions #44311605691 — **SUCCESS**](https://github.com/zxc28tarik/killtheking/actions/runs/44311605691)
- **21/21 Node.js kuşatma testleri PASS.**
- **Gerçek Chromium yazılımsal WebGL PASS:** 3B kale açıldı, 140 **statik asker yerleşim işareti** oluştu, batı merdiveni kapı sağlamken açıldı, avlu fazına geçildi, yeniden başlatma sıfırladı, kapı düğmelerle kırılınca 3B kapı görünümden kalktı; `pageErrors=[]`, `consoleErrors=[]`.
- **Üretilen HTML SHA-256:** `fdc3d05b156c1d653a2163aef6da77f9493e99d33e0b8494994e178eb535b434` (ilk S1 sürümü).
- [Oynanabilir **harita/hedef önizlemesi** HTML artifact #14430702069](https://github.com/zxc28tarik/killtheking/actions/runs/44311605691/artifacts/14430702069).
- [WebGL ekran görüntüleri ve olay JSON'ları #14429709128](https://github.com/zxc28tarik/killtheking/actions/runs/44311605691/artifacts/14429709128).

**UYARI:** HTML **kale/hedef önizlemesidir**, henüz gerçek FPS/TPS savaşı değildir. 140 asker simüle edilmedi. Gerçek GPU Windows kabulü, G5.4 gerçek 140 asker entegrasyonu, kale kapısının gerçek asker hasarı, A* merdiven, animasyon ve kazanma dengesi S2–S6 kapsamındadır.

## Geliştirici komutları

```bash
node --test recovered/siege/test_siege_phase1.mjs
node recovered/siege/build_siege_preview.mjs recovered/siege/dist/KillTheKing_Kusatma_Kalesi_S1_Onizleme.html
```

Üretilen tek HTML'yi Chrome/Edge'de yerel aç; kaleyi sürükleyerek çevir, fare tekeriyle yakınlaştır. Sağdaki "test olayları" düğmeleri mevcut tek kuşatma senaryosunun fazlarını sınar. Gerçek savaş AI'sını gözlemlemek için kullanılmaz.

## Sıradaki adım S2

Bu doğrulanmış harita sözleşmesini mevcut 3B oyun stilindeki gerçek duvar/collider/merdiven/kapı geometrisine taşı; kapı yıkılınca yol ve collision güncellemesi, oyuncunun dış alan→sur→avlu→iç kale erişimi, kale içi spawn güvenliği, taktik harita. Ardından **S3'te** gerçek G5.4 `ArenaArmyBattle` olay/asker ve komuta bağlantısını yap. Oyuncu onayı olmadan yeni denge veya `main` değişimi yok.
