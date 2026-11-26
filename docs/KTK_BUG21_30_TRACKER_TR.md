# KTK BUG21–30 — üçüncü hata taraması
Kaynak: main 3053822f38e32e8b1ea2c53dd82dc17277ae65d5, index.html blob bbeee201346dfcec3cc2c26e3c5d22007f6b2a96. Kullanıcı onayı: on maddenin tamamını kaydet, sonra düzeltmeye başla. İkili paketler; ana dal tabanlı, CI + Chromium + canonical HTML eşliği. Bot taktikleri/zekâsı, menü, ışık ve renk korunur. Gerçek donanım FPS kazancı ölçülmeden iddia edilmez.

| ID | Sorun | Öncelik | Durum / kabul |
|---|---|---|---|
| BUG21 | Kuşatma kapısında görünmez eski güney suru mermi engeli | Kritik | Açık; kapalı kapı engeller, açık kapı geçilebilir, Arena eski suru geri gelir |
| BUG22 | Taktik harita tıklaması ateş/yay/saldırı tetikliyor | Kritik | Açık; harita etkileşimi savaş girişlerine ulaşmaz |
| BUG23 | Oyuncu dünya sınırını zıplayarak aşabiliyor | Kritik | Açık; gerçek konum ve ordu köprüsü geçerli sınırda |
| BUG24 | Pause/focus kaybı sonrası takılı kalan kontroller | Yüksek | Açık; hareket, RMB, kalkan, ADS temiz |
| BUG25 | C eğilme ve kare formasyonu çakışması | Yüksek | Açık; deterministik bağımsız girişler, kontrol değişikliği açıkça belgelenir |
| BUG26 | TPS kamera duvar içinden/geçerek bakıyor | Yüksek | Açık; kamera yaklaşması fiziksel engel ile sınırlı |
| BUG27 | Fıçı patlaması gerçek G5.4 askerlerine hasar vermiyor | Yüksek | Açık; ordu hasar yolu, dost ateşi kuralı korunur |
| BUG28 | Fıçı patlaması duvar arkasını etkiliyor | Yüksek | Açık; gerçek patlama görüş/kapak kontrolü |
| BUG29 | Uçan okun savunma silah kimliği aktif sınıftan geliyor | Orta-yüksek | Açık; fırlatma silahı/kimliği değişmez |
| BUG30 | Ordu modunda TAB eski Arena bot skorunu gösteriyor | Orta-yüksek | Açık; gerçek G5.4 birlik ve oyuncu istatistikleri |

Tespitler kaynak denetimi; paket bazında gerçek fonksiyon testleri eklenecek. Sıra: 21–22, 23–24, 25–26, 27–28, 29–30. Manuel canlı kabul ayrı raporlanır.
