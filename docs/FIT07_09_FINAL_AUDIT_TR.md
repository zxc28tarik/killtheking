# FIT07–09 — Kaynak denetimi, çalışma zamanı ve kabul kapıları

## FIT07: aktif ve tarihsel kaynaklar
- Aktif: UI32 standalone ve byte-identical index.html; normal dağıtım sadece Browser game checks artefaktı.
- Tarihsel: 218 recovered dosyası (~11.88 MB), diğer iki standalone menü adayları, eski modüler src. Eski motorlar güncel oyuna ikinci motor olarak yüklenmez.
- Tarihsel builder hâlâ özgün motor kimliği doğrulamasında kullanılıyor; silinmemeli. Eski üç iframe ve S3D1 dağıtımları güncel değildir. README'deki çelişkili kaynak tanımı düzeltildi.
- PR85 ilk CI: 185/185 test geçti, Chromium geçti, eski 28-script eşitlik koşulu nedeniyle offline build başarısız. Bu kontrol tek onaylı ordu modülüne dar istisna verir; diğer 27 bölüm pozisyon ve içerik olarak korunur. Tam 31 güncel script beklenir. Onaylı modülün git blob hash'i: cfcab6b92eb788edcdfecec3325e3b22d3f40a4b. Yeni ordu modülü değişikliklerinde hash ancak inceleme ve regresyon testiyle güncellenir.
- Arşivler ve eski dallar silinmedi; mevcut doküman ve test bağlantıları korunur. Depo küçülmesi doğrulanmadı.

## FIT08
- Her ordu fizik adımındaki iki formasyon dizisi maç bazlı WeakMap ile tekrar kullanılır; ölü askerlerin sıraları temizlenir.
- Moral destek/baskı ve baskılanma hesabındaki geçici filter dizileri kaldırıldı.
- Birlik kohezyonunda geçici üye dizisi kaldırıldı. Formül, sıralama, hasar ve grafikler değişmez.
- Eski/yeni eşdeğerlik: 140 formasyon durumu, 140 moral/kohezyon durumu. Önceki 3610 hedef ve 1500 ışın karşılaştırması korunur.

## FIT09
- Güncel gerçek HTML'nin üç harita başlangıç kabulü, her haritada 12 canlı animasyon karesi, oyun saatinin ilerlemesi ve iki ordu haritasında simülasyon tick ilerlemesi.
- Yazılım WebGL kare süreleri tanısaldır; gerçek Windows GPU FPS veya uzun maç onayı değildir.
- Testler tamamlanmadan ana dala alınmamalı. Manuel 4–8 dakikalık maçlar, gerçek Windows donanımı, uzun oturum ve yayıncı hazırlığı açık.
