# Kill the King — BUG21–30 takip kaydı

2026-11-26. Ana dal: `main`. Kanonik oyun: `index.html`.

| ID | Sorun | Durum | Commit |
|---|---|---|---|
| BUG21 | Görünmez kuşatma duvarı/kapısı çarpışması | Kod düzeltildi, tarayıcı kabulü bekliyor | 1f8333f |
| BUG22 | Taktik haritada istemsiz saldırı | Kod düzeltildi, tarayıcı kabulü bekliyor | dd18416 |
| BUG23 | Meydan haritası sınırının aşılması | Kod düzeltildi, tarayıcı kabulü bekliyor | cb7f7a1 |
| BUG24 | Odak/fare kilidi sonrası takılı kontroller | Kod düzeltildi, tarayıcı kabulü bekliyor | cb7f7a1 |
| BUG25 | C tuşu eğilme/kare formasyonu çakışması | Kod düzeltildi: C kayma, O kare; tarayıcı kabulü bekliyor | fbf83e8 |
| BUG26 | Üçüncü şahıs kamerası duvarlardan geçiyor | Kod düzeltildi, 5 geometrik birim kontrolü geçti; tarayıcı kabulü bekliyor | fbf83e8 |
| BUG27 | Fıçı patlamaları gerçek orduya hasar vermiyor | Kod düzeltildi, tarayıcı kabulü bekliyor | 5051726 |
| BUG28 | Patlamalar duvar arkasına hasar veriyor | Kod düzeltildi, 5 hasar hesabı kontrolü geçti; tarayıcı kabulü bekliyor | 5051726 |
| BUG29 | Havadaki okun silah kimliği sınıf değişiminde yanlışlaşıyor | Kod düzeltildi, tarayıcı kabulü bekliyor | e3fa2da |
| BUG30 | Ordu savaşlarında eski Arena skorları gösteriliyor | Kod düzeltildi, sentetik sıralama kontrolü geçti; tarayıcı kabulü bekliyor | e3fa2da |

## Kabul koşulları
- BUG21–24: kuşatma kapısı ve harita geçişleri, taktik harita fare girişleri, meydan sınırları, odak kaybı.
- BUG25–26: C/O bağımsızlığı, kapalı/açık alanda kamera, köşeler ve rampalar.
- BUG27–30: gerçek ordu hasar yolu, patlama görüş hattı, ok fırlatma anındaki silah kimliği, modlara uygun skor kaynağı.
- Bot karar mantığına ve görsellere dokunulmaz. Gerçek tarayıcı kabulü yapılmadan tam doğrulandı denmez.

## Son durum
10/10 kod düzeltmesi main dalında. 31 inline klasik JavaScript bloğu sözdizimi kontrolünden geçti (e3fa2da); gerçek WebGL/tarayıcı kabulü henüz yapılmadı. BUG29 için atış anındaki silah ve konum saklanır; BUG30 için gerçek bölük ve bireysel oyuncu verileri ayrı etiketlenir.
