# Kill the King — İlk birleşik oyun adayı: izole FFA / Ordu başlatıcısı

**Durum:** DENEYSEL, yayın kabulü yok. Yeni G8.4 oyunu değil; eski Ekim 2026 FFA kaynak sürümü ile kurtarılmış G5.4 ordu oyununun **tek HTML içinde, birbirlerinden tamamen ayrı** çalışmasını sağlayan ilk entegrasyon adımı.

## Oyuncu açısından

HTML dosyasını Chrome/Edge'de aç; üst menüden **SERBEST ARENA / TDM** veya **140 ASKERLİ ORDU SAVAŞI** seç.

- FFA: **18 Ekim 2026 tarihli mevcut A5 HTML** birebir, hiçbir kaynak satırı değiştirilmeden içeri alınır. Kale/20× çimenlik meydan, FFA/TDM, FPS/TPS, silah ve sınıf kuralları aynen kendi çerçevesindedir.
- Ordu: G5.4'ün kendi mevcut oyun HTML'si ve görselleri, 8 bölük/140 asker, komut menüsü ve taktik harita ile açılır. Sadece orijinal ordu motorunun yerini, daha önce gerçek CPU savaşlarıyla test edilen **2D temas düzeltmeli + gerçek mavi/kırmızı sahiplikli** ayrı motor alır. Ordu modunda oyuncu hâlâ **mavi tarafta** başlatılır; kırmızı taraf için tarayıcı UI bağlanmadı. G5.4'ün 300× meydan menüsü Ekim FFA'nın 20× meydanıyla aynı harita sürümü değildir.
- İki modun render sahneleri ve global JavaScript değişkenleri **ayrı iframe belgelerinde** çalışır; mod değişimi eski iframe'i kaldırıp yenisini açar. Bu bilinçli izolasyon, FFA AI/fizik ve ordu AI/fizik çatışmalarını engeller. Oyun içi maç bu geçişte sıfırlanır.
- Yalnızca geçiş menüsü ortak. **Tek motor/tek sahne entegrasyonu veya paylaşılan kayıt sistemi henüz yapılmadı.** Bu bir güvenli köprü adımıdır.

## Yeniden üretilebilir derleme

1. A5 dalında 'python3 tools/build_offline.py --out dist/KillTheKing_Oyna.html' ile FFA HTML'yi üret.
2. Bu dalda 'node recovered/army/integration/build_isolated_launcher.mjs ffa-source/dist/KillTheKing_Oyna.html recovered/army/integration/dist/KillTheKing_Birlesik_FFA_Ordu_G5_4_Aday.html' çalıştır.
3. 'KTK_FFA_HTML=ffa-source/dist/KillTheKing_Oyna.html node --test recovered/army/integration/test_isolated_launcher.mjs' testini çalıştır.

GitHub Actions bu adımları otomatik uygular ve SHA-256 bilgilerini manifestine yazar.

Güvenlik kapısı: FFA SHA-256 **18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a**, G5.4 kurtarma SHA-256 **1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2**, motor SHA-256 **307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841**; uyuşmazlık varsa oyun üretilmez.

## Gerçek oynanış kabulü (eksik)

- [ ] Chrome/Edge WebGL destekli bilgisayarda dosyayı yerel dosya olarak aç.
- [ ] FFA aç: kale, dört sınıf, bağımsız altı botun birbirleriyle de savaşması, özgün görüntüler, sürenin bitişi, yeniden oyna ve ESC/TAB.
- [ ] FFA modundan çıkıp Ordu'ya geç: FFA kapansın; seçim menüsünden G5.4 ordu savaşı otomatik seçilsin; oyuncu sınıfını seçip 140 askeri başlatabilsin.
- [ ] Orduda emir, formasyon, nişan/ateş, taktik harita, dost ateşi ve galibiyet sonucunu dene.
- [ ] Ordu'dan FFA'ya döndüğünde FFA yeniden temiz başlayabilsin. Siyah ekran, konsol hata veya pointer lock sorunu olmasın.
- [ ] Gerçek GPU FPS/1% low, bellek, 30 dk stres ve 200/280 asker ayrı kabul.
- [ ] G8.4 kaynağı (#44) geri kazanıldığında veya yeniden kurulunca onun senaryoları ayrı entegrasyona alınacak.

**Yayın kararı: NOT APPROVED.** Bu aday FFA kodu riskini azaltan çalışma modlarını kapsüller; gerçek grafikli kullanıcı kabulü ve yeni ordu senaryoları henüz yok. 'main' değişmez. PR #45 kaynak kurtarma arşividir; bu aday ayrı entegrasyon dalındadır.
