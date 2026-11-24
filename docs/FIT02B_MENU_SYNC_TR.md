# FIT02b — Eski menü kalıntıları ve gereksiz DOM işlemleri
FIT02a üzerine ikinci paket. UI32 görünümü ve orijinal ayar kontrol köprüsü korunur.
- Kullanılmayan fm-kicker ve fm-context mobil CSS kuralları çıkarıldı.
- Harita, mod, süre, atmosfer, hassasiyet, ses, kalite, düşük hareket ve buton durumları yalnız değiştiğinde yazılır.
- Mevcut dinleyiciler ve özgün motor kontrol akışı korunur. Diğer 30 script ve script dışı HTML değişmedi.
- Chromium kabul testine ayar köprüsü ve arka arkaya beş sync çağrısında sıfır DOM mutasyonu şartı eklendi.
- Ölçülen FPS kazanımı yok; amaç gereksiz DOM yazımlarının önlenmesidir. Testler tamamlanmadan main'e birleştirilmez.
