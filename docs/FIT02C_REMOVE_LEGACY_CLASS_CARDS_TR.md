# FIT02c — Eski sınıf kartlarını kaldır
Temel: main 23907a92731bb5320d6adb768868f498efb90203; FIT02a ve FIT02b kabul edildi.
Aktif HTML'deki dört gizli eski Krunker 1600 sınıf kartı ve artık geçerli olmayan açıklama alanı kaldırıldı. Sınıf motoru artık bu kartları güncellemez. selectClass sonunda mevcut görünür menü senkronizasyonu çağrılır; amblem tıklamasındaki tekrar ve eski kart gözlemleri çıkarılır. V25 eski kart başlığı düzenlemesi kaldırılır.
Toplam 7122 karakter çıkarıldı. 31 scriptin 29'u değişmedi. Orijinal oyun motoru, sınıf istatistikleri, HUD, üç harita ve onaylı amblem görselleri korunur. Root ve standalone aynı blob.
Eski görsel katmanların sınıf kartlarına özgü CSS kuralları ve tarihsel QA statü alanları bu pakette değiştirilmedi. Harita ve ayar motorunun kullandığı gizli kontroller de tutulur.
Yeni Chromium şartları: eski kart sayısı sıfır, dört sınıfın doğrudan selectClass çağrısıyla tekil görünür seçim durumu. Genel regresyon ve üç harita kabul testleri tamamlanmadan main'e birleştirilmez.
