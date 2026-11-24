# FIT05 + FIT06 — Bot / savaş çalışma zamanı temizliği

Taban: 210f962281ca5962db765e141cce42f19216b120 (FIT04 PR #84, iki CI başarılı).
- Hedef algısı: her aday için liste taramak yerine tek canlı sayım; ölü ve kendi botu hariç. Hedef kuralları, skor ve kilit süreleri değişmez.
- Konum yeniden kullanımı ve ortak görüş sorgusu.
- Yakın saldırıda menzilli atış vektörü yok; gereksiz menzilli hedef vektörü ve saldırı argümanı kaldırıldı; dost kontrolünde takım bir kere hesaplanır.
- Ordu raycast: dikey sınırlar bir kere, yalnız kazanan isabet nesnesi oluşturulur; sıra, engel ve dost kuralları korunur.
- Canonical root ve dağıtım HTML aynı blob. Test: 3610 hedef sayımı, ortak görüş çağrısı, 1500 eski/yeni ışın karşılaştırması.
- CI ve Chromium sonuçları görülmeden merge yapılmamalı. FIT07 arşiv silme ve FPS ölçümü yapılmadı.
