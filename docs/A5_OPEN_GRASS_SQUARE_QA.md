# A5 — Büyük Açık Çimenlik Meydan (Harita 2)

**Durum:** Kodlandı; 311/311 GitHub Actions Node testi PASS, offline HTML build PASS. Gerçek Chrome/Edge GPU oynanış kabulü henüz yapılmadı.

## Onaylı harita teması
- İkinci harita **büyük açık çimenlik bir meydan**. Orijinal kale ilk harita ve varsayılan olarak saklanır.
- Yaklaşık **98×98 oyun birimi** düz, yeşil arazi. **Ortadaki 58×58 alanda hiçbir katı engel yok.** Kenarlarda alçak ahşap çit, dört köşe ağaç, birkaç alçak siper ve dekoratif çimen/yol detayları.
- Orijinal Krunker 1600 köşeli görsel dil ve karakter modelleri değişmez; yeni kalabalık şehir veya ikinci kale yoktur.

## Gerçek oyun entegrasyonu
- Ana menüde KALE (ORİJİNAL) / BÜYÜK ÇİMENLİK MEYDAN seçimleri; maç sırasında seçim kilitli.
- Sadece görseller değil, aktif dünya objeleri, **çarpışma kutuları, yükselti/rampalar, mermi raycast yüzeyleri, A* navigasyonu ve doğuş havuzları** da haritayla değişir. Gizli kale duvarları meydanda engel olmaz.
- **16 çimenlik doğuş noktası**: yakın/uzak botlar için iki sekizer havuz; sağ/sol takım FFA/TDM güvenli doğuşları.
- Oyuncu ölümü, bot doğuşları, bot devriyesi ve tekrar oynama aktif haritayı kullanır.
- Radar ölçeği ve sonuç ekranında harita adı güncellenir.
- FFA, 4v3 TDM, 2/4/8dk süre, dört silah sınıfı, bot zekâsı, onaylanan yeni okçu ritmi ve silah hasarları, ses/grafik ayarları ve slide-hop korunur.

## Otomatik kanıt
- tests/a5-grassy-square-map.test.mjs: açık merkez, gerçek kapalı kenar collider, **240 farklı A* spawn rotası**, 16 güvenli spawn, yüksek hızlı çarpışma ve FFA/TDM regresyonu.
- tests/a5-runtime-map-switch.test.mjs: gerçek map switch fonksiyonuyla kale↔meydan objeleri, raycast/çarpışma listesi, rampa ve top dönüşü, gereksiz A* yeniden oluşturmayı önleme.
- Eski kale testleri: dört rampa, üç top, 90 kale spawn rotası ve duvar collider testleri değişmeden PASS.
- **311/311 Node PASS**; tek HTML derleme/sözdizimi CI PASS.

## Kullanıcıya kalan gerçek tarayıcı kabulü
1. Chrome/Edge tek HTML açılışı; önce kale FFA, sonra ana menüden meydan.
2. Merkezden dört yönde serbest hareket; görünmeyen kale duvarları, zıplayan zeminler veya engeller yok.
3. Dış sınır çitleri, kenar ağaç/siper ve yüksek hızlı kaymada çarpışma doğruluğu.
4. Botların açık alanda birbirlerine saldırması, menzilli görüş, FFA doğuş ve TDM takım doğuşları.
5. TAB, 2/4/8 dk, maç sonu, tekrar oyna ve iki harita arasında sorunsuz dönüş.
6. Eski kaleye geri dönünce rampalar, toplar, barut fıçıları ve görünüşün eskisi gibi çalışması.
7. 30+ dakika performans / bellek / WebGL stres testi.

Bu, kodlanmış gelişmedir; gerçek GPU oyun testi tamamlanmış sayılmamalıdır.
