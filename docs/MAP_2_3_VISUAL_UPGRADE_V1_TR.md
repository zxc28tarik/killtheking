# Harita 2 ve 3 — Görsel İyileştirme V1
Tarih: 21 Kasım 2026. Durum: uygulama başladı; gerçek tarayıcı kabul testi bekliyor.

## Sabit kurallar
- Üç mod tek oyun; mevcut Arena / G5.4 Ordu / Kale Kuşatması oynanışı ve menüsü korunur.
- 70v70, komuta sistemi, dört sınıf, denge, kapı/merdiven/koçbaşı/mancınık ve çarpışma değişmez.
- Main, tarihî kaynaklar ve eski sürümler korunur.

## Harita 2 — Meydan Savaşı
- [ ] Mevcut çimenlikte düşük poligonlu doğal renk varyasyonları ve uzak zemin katmanları (G5.4 büyük HTML kaynağının güvenli erişimi açık).
- [ ] Asker siluetleri ve savaş alanı okunurluğu için ışık/kontrast düzenlemesi.
- [ ] Mevcut rotalar ve görüş/atış hatları dışında küçük çevre detayları.
- [x] İzole G5.4 dört bölük taktik haritasında okunaklı, yakınlaştırmayla ölçeklenen koordinat ızgarası ve yön işareti (yalnız UI).
- [ ] Chromium ve 70v70 komuta/çarpışma regresyonu.

## Harita 3 — Kale Kuşatması
- [x] Çarpışmasız alçak poligon toprak ton kırılmaları; merkezi geçiş korundu.
- [x] Sur taş sıraları ve iç kale üst kenar detayları; yeni collider yok.
- [x] Kule mazgal dişleri ve kapıya ahşap/metal yüzey detayları; mevcut kapı dekoru ile birlikte saklanır.
- [x] Batı/doğu merdivenlerine işlevsel mesh'e bağlı ahşap yan raylar ve bağlantı kelepçeleri (sadece görsel, yeni collider yok).
- [x] Gerçek G5.4 mürettebatlı koçbaşına ahşap çapraz destekler, tekerlek göbekleri ve çatı çıtaları eklendi (yalnız mesh).
- [x] Gerçek G5.4 mürettebatlı mancınığa destekler, tekerlek göbekleri ve üst travers ayrıntıları eklendi (yalnız mesh).
- [ ] 140 asker ve mevcut üç modlu oyunun gerçek Chromium/GPU testleri.

## Kabul
İlk kod değişiklikleri Harita 3 kale dekorasyonu ve Harita 2 canlı taktik haritasının görsel katmanında. Harita 2'nin 3B çevresi henüz değiştirilmedi. Testler çalıştırılmadan PASS denmez. Ana dala birleştirme ve yayımlama için ayrıca kullanıcı kabulü gerekir.
## 21 Kasım — V3 ara doğrulama
- İki değişen JavaScript dosyası sözdizimi kontrolü PASS: `siege-preview.js`, `g54-field-four-squad-runtime.js`.
- Tam üç modlu çevrim dışı HTML yeniden derlenmedi; Chromium/GPU/regresyon testleri çalıştırılmadı. Oynanış PASS iddiası yok.
- Meydan 3B motoruna erişim sağlanmadan görsel geometri yazılmadı; taktik harita V1 güncellemesi kaydedildi.

## 21 Kasım — V4
- `siege-ram.js` ve `siege-catapult.js` gerçek AK-05 makinelerinin mountVisual fonksiyonlarında kozmetik detaylar eklendi. Yeni silah, makine veya oyun modu oluşturulmadı.
- Her iki JavaScript kaynak dosyasının sözdizimi `new Function` ile PASS; tarayıcı, GPU, 140 asker ve üç modlu HTML yeniden paketleme kabulü henüz gerçekleştirilmedi.
- Meydan Savaşı'nın özgün büyük G5.4 HTML gövdesi GitHub dosya içerik uç noktasından boş geldi; mevcut 3B sahnesine güvenli müdahale henüz gerçekleştirilemedi. Harita 2 görsel işlerinin geri kalanı açık.

## 21 Kasım — V5 kuşatma çevre katmanı
- [x] Kale dış kuşatma arazisinin sağ/sol kenarlarına üç malzeme grubunda toplam 144 instanced düşük poligonlu bitki eklendi. Merkez koridor, koçbaşı ve mancınık mevzileri, avlu ve asker yollarının üstüne eklenmedi.
- [x] Görsel bitkiler dünya çarpışma listesine veya G5.4 yol/atak hesaplarına bağlanmadı.
- [ ] Büyük G5.4 arşiv HTML'si GitHub dosya arabiriminden yine boş geldi; mevcut 3B Meydan sahnesi değiştirilemedi.
- [ ] Üç modlu HTML oluşturma, gerçek Chromium ve GPU testi hâlâ yapılacak. Sözdizimi kontrolü PASS tek başına oynanış kabulü değildir.

## V6 — 2. harita yüksekliği için ilk kod teslimi
- [x] `recovered/army/modules/meadow-terrain-heightfield.js`: merkezi savaş alanını koruyan, tepe ve vadiyi yerel alan fonksiyonlarıyla hesaplayan deterministik yükseklik modeli eklendi (kuzey +12m, doğu +8m, merkez +5m, güney +10m, batı -3m).
- [x] Örneklenebilir 3B mesh, normal hesabı, sınırda sıfırlanan yükseklik ve kaynak temizleme fonksiyonu yazıldı.
- [x] `test_meadow_terrain_heightfield.mjs` içinde 6 test senaryosu eklendi.
- [ ] Test dosyası Node üzerinde henüz çalıştırılmadı; gerçek Chromium/GPU kabulü yok.
- [ ] Özgün G5.4 geniş HTML çekilemediği için bu modül **henüz oyuna bağlanmadı**. Görsel tepeler ile asker Y koordinatları, görüş hattı, ok/kurşun ve nav birlikte bağlanıp sınanmadan açılmayacak.

## V7 — Yükseklik modelinin hesaplama doğrulaması ve görsel renkler
- [x] Mevcut tepe fonksiyonu GitHub'dan güncel kaynak okunarak çalıştırıldı: 5 tepe/vadi hedef yüksekliği doğru, 14.641 örnek noktada sonlu değerler; sınır yüksekliği 0.
- [x] Örneklenen en yüksek eğim ~18,91°; 2 metre boyunca en büyük yükselti değişimi ~0,613 metre (halfSize=240 parametreli örnek). Bunlar mevcut G5.4 haritasının gerçek boyutuna bağlanmadan geçici ölçümlerdir.
- [x] Altı yükseklik regresyon kontrolünün eşdeğeri JavaScript değerlendirmesinde 6/6 PASS (resmî Node CI çalışması değil).
- [x] Görsel mesh'e vadi, çayır, sırt ve kurak tepe geçişli vertex color desteği eklendi. Mock Three.js ile 625 tepe noktası, 1.152 üçgen, sonlu renk değerleri ve geometri temizliği doğrulandı.
- [ ] Büyük tarihî G5.4 ana HTML dosyası elde edilip zemin/yol/silah/soldier Y sözleşmeleri tespit edilecek.
- [ ] Bu modül hâlen canlı 70v70 oyuna bağlı değil; gerçek tarayıcı/GPU ve 70v70 regresyonu bekleniyor.

## V8 — Zemini gerçek asker fiziğine bağlamak için köprü
- [x] `recovered/army/modules/meadow-terrain-bridge.js` bağımsız ve isteğe bağlı hesaplama katmanı: yükseklikten asker ayak/göz konumu, eğim sınırı, alt-adımlı yürüyüş ve arazinin 3B görüşü kapatması.
- [x] `test_meadow_terrain_bridge.mjs` içine 7 regresyon vakası kaydedildi. Canlı kaynaktan değerlendirilen eşdeğer 7/7 kontrol PASS (resmî Node CI değildir).
- [ ] Büyük G5.4 HTML tarihi kaynak dosyası içerik API'sinde boş döndüğünden mevcut asker renderer/hareket/atış API'siyle bağlama henüz yapılmadı. Git erişimi denemesi DNS nedeniyle başarısız. Canlı oyunda gerçek 3B yürüyüş ve ateş doğrulanmadı.
- [ ] Güncel üç modlu tek dosyalık HTML yeniden paketleme ve gerçek tarayıcı/GPU kabulü yapılacak.

## V9 — Meydan çim yüzeyinin görsel kalite geçişi
- [x] 3 ölçekli deterministik renk kırılması: geniş doğal çimen lekeleri, orta ölçekli varyasyon ve hafif ince doku. Yüksek alanlarda kuru ton; alçak alanlarda daha koyu/nemli yeşil.
- [x] Tekrarsız sabit dağılımla 2.700 kısa, düşük poligonlu 3B çim demeti; 3 InstancedMesh çizim grubu, bağımsız katı engel veya balistik nesne yok.
- [x] Görsel nesneler için kaynak temizleme ve iki kez güvenle dispose edebilme.
- [x] İşlevsel Three.js mock denemesinde 8.192 üçgenli zemin, 2.700 çim, geçerli renkler ve kaynak temizliği doğrulandı. Dört Node regresyon testi kaynak dosyası eklendi; CI çalıştırılmış değil.
- [ ] Çok önemli: bu hâlâ G5.4 gerçek Meydan oyununun içine bağlanmış değil; orijinal büyük HTML oyun kaynağı indirilemedi. Oyuna eklenmiş veya tarayıcıda ekran görüntüsü alınmış gibi sunulmayacak.

## V10 — Gerçek G5.4 Meydan çim entegrasyonu (kaynak düzeyinde)
- [x] G5.4 arşivinin 1.257.893 karakterlik özgün kaynağı GitHub Blob SHA ile okunabildi. Gerçek `buildMeadowSquare()` ve `ArenaMeadowGrass.createInstancedTufts` bulundu; tarihî sahnede bu çimlerin kasıtlı olarak kapatıldığı doğrulandı.
- [x] `build_three_mode_launcher.mjs` yalnız çalışma anında çözülen G5.4 Meydan HTML'sinde belirli ve tekil kaynak işaretinden 2700 adet native düşük poligonlu `InstancedMesh` çimi tekrar sahneye ekliyor. FFA ve Kale modlarına uygulanmıyor. Orijinal gömülü ordu HTML kaynak SHA'sı korunuyor.
- [x] 3B çimler `meadowMapData.visuals` içine alındığı için orijinal harita değişiminde görünürlüğü asıl motor tarafından yönetiliyor. Dünya collider/atış/AI sistemleri değiştirilmedi.
- [x] Kaynak işareti 1 kez eşleşiyor, derleyici JavaScript sözdizimi doğrulandı. İki regresyon testi kaynak dosyası yazıldı.
- [ ] Üç modlu HTML henüz yeniden derlenmedi ve gerçek Chromium/WebGL başlatma testi yapılmadı; bu aşama **kod entegrasyon adayıdır, oynanış PASS değildir**.
- [ ] Daha önce hazırlanan tepecikli yükseklik mesh'i G5.4'te etkin değil. Çünkü flat soldier physics devam ediyor; görünür yamaçların yere basma/mermi fiziğiyle uyumlu olması ayrı kabul gerektiriyor.

## V11 — Gerçek üç modlu tarayıcı kabul kapısı
- [x] Kaynak erişimi çözüldü: tarihî G5.4 1,26 milyon karakterlik HTML blob'undan gerçek `buildMeadowSquare` ve önceden var olan `ArenaMeadowGrass.createInstancedTufts` doğrulandı.
- [x] Orijinal G5.4 çalışma kopyasının içinde `2700` çim InstancedMesh'ini doğrudan gerçek `scene` içine ekleyen korumalı görsel yama yazıldı. Arşiv ve üçüncü mod aynı kalır.
- [x] Chromium smoke testine Meydan modunda `2700` gerçek görünür instanceli native çim mesh kontrolü eklendi. Yama beklenen tekil kaynağı bulmazsa dosya üretimi hata verecek.
- [x] Üç modlu CI workflow'u yalnız görsel feature dalı için de push ile koşacak ve yeni arazi testlerini kapsayacak şekilde güncellendi.
- [ ] Workflow'un SUCCESS sonucu ve gerçek Chromium ekran görüntüsü henüz doğrulanmadı; oyunda çalıştığına ilişkin son kabul verilmedi.
- [ ] Önceki yükseltili tepe 3B görseli canlı oyunda henüz bağlı değil; bugünkü entegrasyon düz çimenlikteki native grass içindir.
