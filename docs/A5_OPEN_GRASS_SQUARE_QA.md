# A5 — Büyük Açık Çimenlik Meydan (Harita 2)

**Durum:** Kodlandı; 311/311 GitHub Actions Node testi PASS, offline HTML build PASS. Gerçek Chrome/Edge GPU oynanış kabulü henüz yapılmadı.

## Onaylı harita teması
- İkinci harita **büyük açık çimenlik bir meydan**. Orijinal kale ilk harita ve varsayılan olarak saklanır.
- Orijinal çimenlik **98×98 birimden yaklaşık 438×438 birime** çıktı: toplam yürünebilir kare alan **tam 20×** (kenar uzunluğu √20 ≈ 4,47 kat). **Merkezdeki yaklaşık 259×259 alan katı engellerden temiz**. Kenarlarda uzun ahşap çit, dört köşe ağacı ve birkaç alçak siper var. Ağaç/gövde/siper boyutu 4,47 kat büyütülmedi; sadece konumları yayıldı.
- Orijinal Krunker 1600 köşeli görsel dil ve karakter modelleri değişmez; yeni kalabalık şehir veya ikinci kale yoktur.

## Gerçek oyun entegrasyonu
- Ana menüde KALE (ORİJİNAL) / 20× ÇİMENLİK MEYDAN seçimleri; maç sırasında seçim kilitli.
- Sadece görseller değil, aktif dünya objeleri, **çarpışma kutuları, yükselti/rampalar, mermi raycast yüzeyleri, A* navigasyonu ve doğuş havuzları** da haritayla değişir. Gizli kale duvarları meydanda engel olmaz.
- **16 çimenlik doğuş noktası**: iki sekizer havuz; başlangıçlar genişletilmiş orta savaş bölgesine yayılır, böylece yedi katılımcı haritanın uzak köşelerinde birbirini hiç göremeden kalmaz. Sağ/sol TDM tarafları korunur.
- Oyuncu ölümü, bot doğuşları, bot devriyesi ve tekrar oynama aktif haritayı kullanır.
- Radar ölçeği, **kamera uzak kesme mesafesi (350 → 1000)**, büyüyen gökyüzü kubbesi ve açık alana uygun sis yoğunluğu ve sonuç ekranında harita adı güncellenir. Haritadaki uzun takip/temas mesafesi için **bot hedef edinme sınırı (280 birim)** artırılır; gerçek silah menzilleri ve isabet hasarı değişmez.
- FFA, 4v3 TDM, 2/4/8dk süre, dört silah sınıfı, bot zekâsı, onaylanan yeni okçu ritmi ve silah hasarları, ses/grafik ayarları ve slide-hop korunur.

## Otomatik kanıt
- tests/a5-grassy-square-map.test.mjs: **tam 20× alan**, geniş açık merkez, gerçek kenar collider, **240 farklı A* spawn rotası**, 16 güvenli spawn, yüksek hızlı çarpışma ve FFA/TDM regresyonu. A* grid çözünürlüğü alanla birlikte ölçeklendirilerek düğüm sayısı yaklaşık eski düzeyde tutulur (<6000), 20× grid yaratılmaz.
- tests/a5-runtime-map-switch.test.mjs: gerçek map switch fonksiyonuyla kale↔meydan objeleri, raycast/çarpışma listesi, rampa ve top dönüşü, gereksiz A* yeniden oluşturmayı önleme.
- Eski kale testleri: dört rampa, üç top, 90 kale spawn rotası ve duvar collider testleri değişmeden PASS.
- **311/311 Node PASS**; tek HTML derleme/sözdizimi CI PASS.

## Kullanıcıya kalan gerçek tarayıcı kabulü
1. Chrome/Edge tek HTML açılışı; önce kale FFA, sonra ana menüden meydan.
2. Merkezi yaklaşık **259×259** düz alanda dört yöne serbest hareket; görünmeyen kale duvarları, zıplayan zeminler veya engeller yok. Haritanın dört yanına gidişte uzaktaki arazi kameradan kaybolmamalı.
3. Dış sınır çitleri, kenar ağaç/siper ve yüksek hızlı kaymada çarpışma doğruluğu.
4. **20× sahada botların 16 doğuş noktasından birbirlerini bulup savaşması**, menzilli görüş, FFA doğuş ve TDM takım doğuşları. Uzun aralıklar yüzünden 2–4 dakika maçın aşırı boş geçmediği doğrulanmalı.
5. TAB, 2/4/8 dk, maç sonu, tekrar oyna ve iki harita arasında sorunsuz dönüş.
6. Eski kaleye geri dönünce rampalar, toplar, barut fıçıları ve görünüşün eskisi gibi çalışması.
7. 30+ dakika performans / bellek / WebGL stres testi.

Bu, kodlanmış gelişmedir; gerçek GPU oyun testi tamamlanmış sayılmamalıdır.
