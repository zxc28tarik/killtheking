# Kill the King — İlk birleşik oyun adayı: izole FFA / Ordu başlatıcısı

**Durum:** BOTLARIN OYUNCUYU HEDEFLEMESİ DÜZELTİLDİ; manuel WebGL kabulü hâlâ gerekli, yayın kabulü yok. Yeni G8.4 oyunu değil; eski Ekim 2026 FFA kaynak sürümü ile kurtarılmış G5.4 ordu oyununun **tek HTML içinde, birbirlerinden tamamen ayrı** çalışmasını sağlayan ilk entegrasyon adımı.

## Oyuncu açısından

HTML dosyasını Chrome/Edge'de aç; üst menüden **SERBEST ARENA / TDM** veya **140 ASKERLİ ORDU SAVAŞI** seç.

- FFA: **18 Ekim 2026 tarihli A5 HTML** orijinali ayrı SHA ile arşivlenir. Oyun içinde yalnızca oyuncunun hedef seçimiyle ilgili küçük kod bölümü kaynak kontrollü değiştirilir; bütün grafik ve silah değerleri korunur. Kale/20× çimenlik meydan, FFA/TDM, FPS/TPS, silah ve sınıf kuralları aynen kendi çerçevesindedir.
- Ordu: G5.4'ün kendi mevcut oyun HTML'si ve görselleri, 8 bölük/140 asker, komut menüsü ve taktik harita ile açılır. Sadece orijinal ordu motorunun yerini, daha önce gerçek CPU savaşlarıyla test edilen **2D temas düzeltmeli + gerçek mavi/kırmızı sahiplikli + oyuncuyu aktif hedefleyen** ayrı motor alır. Ordu modunda oyuncu hâlâ **mavi tarafta** başlatılır; kırmızı taraf için tarayıcı UI bağlanmadı. G5.4'ün 300× meydan menüsü Ekim FFA'nın 20× meydanıyla aynı harita sürümü değildir.
- İki modun render sahneleri ve global JavaScript değişkenleri **ayrı iframe belgelerinde** çalışır; mod değişimi eski iframe'i kaldırıp yenisini açar. Bu bilinçli izolasyon, FFA AI/fizik ve ordu AI/fizik çatışmalarını engeller. Oyun içi maç bu geçişte sıfırlanır.
- Yalnızca geçiş menüsü ortak. **Tek motor/tek sahne entegrasyonu veya paylaşılan kayıt sistemi henüz yapılmadı.** Bu bir güvenli köprü adımıdır.

## Yeniden üretilebilir derleme

1. A5 dalında 'python3 tools/build_offline.py --out dist/KillTheKing_Oyna.html' ile FFA HTML'yi üret.
2. Bu dalda 'node recovered/army/integration/build_isolated_launcher.mjs ffa-source/dist/KillTheKing_Oyna.html recovered/army/integration/dist/KillTheKing_Birlesik_FFA_Ordu_G5_4_Aday.html' çalıştır.
3. 'KTK_FFA_HTML=ffa-source/dist/KillTheKing_Oyna.html node --test recovered/army/integration/test_isolated_launcher.mjs' testini çalıştır.

GitHub Actions bu adımları otomatik uygular ve SHA-256 bilgilerini manifestine yazar.

Güvenlik kapısı: Orijinal kaynaklar saklanır; bu sürümde FFA hedeflemesi, FFA okçusunun 0,5 saniyelik atış hazırlığı ve G5.4 ordu hedeflemesi seçici olarak güncellenir. Bu nedenle üretilen FFA orijinalle byte-byte aynı DEĞİLDİR. Yeni FFA SHA-256 (0,5 saniye germe): **3d00d872e9df3fa7cec14238f036e3cafdadb9d998e1457870c940ce9e9d0301**. Yeni ordu motoru SHA-256: **5a078a89efde450a34c2d406d916bc326aabd8b2b6945993c70697c0759132a8**.

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

## 18 Kasım — oyuncu hedefleme hotfix'i

- **Sorun yeniden üretildi:** özgün A5 FFA hedef seçiminde yakındaki oyuncu, başka bot varken sürekli geride kalıyordu (bir normal hedef sınırı, +14 puan kaçınma ve dar oyuncu algılama yarıçapı).
- **Düzeltme:** FFA'da yalnız en fazla iki normal bot oyuncuyu hedef seçebilir; oyuncu yakında olduğunda rakip botlarla aynı rekabetçi puanlamaya alınır. TDM dost ateşi ve oyuncu hedefleme yasağı korunur; diğer botlar birbirleriyle savaşmayı bırakmaz.
- **G5.4 ordu:** oyuncunun başka askere göre 0,72 kat yakın olmasını gerektiren eski öncelik eşiği rahatlatıldı; düşmanların yalnız 1/5'i aynı anda oyuncuya öncelik verebilir. Diğer asker hedefleri ve silahlar korunur.
- **GitHub Actions 20/20 test başarılı:** https://github.com/zxc28tarik/killtheking/actions/runs/44216398861; özgün kaynağın birebir SHA doğrulaması, değişen iki kodun keskin sınırları, oyuncu hedef seçimi ve birleşik HTML derlemesi kontrol edildi.
- **Uyarı:** Bunlar kaynak/VM/DOM testleridir, gerçek GPU sahnesinde görülmüş isabet kanıtı değildir. Ordu önceki doğal galibiyet örneklemi yeni hedeflemeyle yeniden denetlenmeden genel denge kesin kabul edilmez.

## 18 Kasım — gerçek FFA bot hareket/saldırı döngüsü ve görüş hattı düzeltmesi

- **Kök neden:** Eski FFA güncelleme kodu menzil içindeki botun saldırı hazırlığını görüş kapalıyken de başlatıyordu. Hazırlık iptal edilse bile aynı döngü sonraki karede yeniden başlayabiliyordu. Bu, okçu/tüfekçinin duvar arkasında sürekli hazırlık animasyonuna dönmesine yol açabiliyordu.
- **Tek satırlık oyun düzeltmesi:** `isGameActive && arenaTarget && arenaDist <= bot.range` koşuluna yalnız `&& hasClearShot` eklendi. Yalnız saldırıya hazırlığın başlama kapısı değişti; görüş kontrolü gerçek `arenaLineOfSight` fonksiyonundandır. Taktik planlama, A* hareket, fizik, silah/atış süresi, takım dostluğu veya ordu motoru değiştirilmedi.
- **Gerçek kod VM denetimi:** dört sınıfın gerçek `bots.forEach` güncellemesi, `chooseArenaTarget`, `arenaBotAttack`, gerçek Three.js r128, gerçek taktik/hareket/toparlanma/hasar modülleriyle çalıştırıldı. 11/11 yeni test; tüm entegrasyon CI **41/41 PASS**: https://github.com/zxc28tarik/killtheking/actions/runs/44223905908.
- **Hedefler:** dört sınıfta hedef seçimi→yaklaşma→windup→HP azalması; hareketli oyuncuyu kovalama; duvar arkasından vuramama; görüş kaybında rüzgâr/germe döngüsünün tekrar başlamaması; bloke rotada toparlanma; TDM dost oyuncunun zarar görmemesi; hızın üstünde ilerleme/ışınlanma olmaması.
- **Kaynak:** FFA hotfix SHA-256 `4066a2c7e10d6f21b54df17cf2ee4c73250ecd6ce556fbf06b043d9aef1db5ec`; birleşik HTML SHA-256 `8107f370af490617db619d9ffa3a8fba1b1293afe58262db02f0babd1921f033` (3.069.613 bayt).
- **Kabul sınırı:** VM gerçek oyun fonksiyonlarını kullansa da yürütme düz bir navigasyon sahnesi üzerinde ve görüntülemesizdir. **Gerçek Chrome/Edge WebGL, kamera/pointer-lock, GPU performans ve tam oynanış kabulü yapılmadı.** PR #48 taslak, `main` aynı, G8.4 (#44) hâlâ eksik. Bu düzeltme tek başına herkesin oyuncuya saldıracağı anlamına gelmez; FFA herkesin birbiriyle savaştığı moddur.

## 18 Kasım — Kullanıcı kararı: FFA okçusunun atış hazırlığı 0,5 saniye

- **Oyuncu yayı:** Minimum germe/serbest bırakma sınırı **2 → 0,5 saniye**, tam güç germe süresi **3 → 0,5 saniye**. Nişan sapması ve hasar değerleri aynı. Oyuncu artık tam güç yayı 0,5 saniyede hazırlayabilir.
- **FFA bot okçusu:** Germe/telegraph **3 → 0,5 saniye**. Okçu botunun nişan, hedef seçimi, görüş hattı, isabet hesapları ve diğer sınıfların hazırlık süreleri aynı.
- **Korunan sınırlar:** İki ok arası **en az 4 saniye = azami 15 ok/dakika**; atış sonrası **1 saniye toparlanma**. Bu, eskiden belirlenen **ilk 2 saniye ok atılamaz** kuralının kullanıcı kararıyla değiştiği anlamına gelir; 0,5 saniye germe ilk atışta da geçerlidir.
- **Kapsam:** Yalnız **FFA/TDM** oyuncu ve bot okçusu; izole G5.4 ordu savaşındaki okçular değişmedi. Kaynak A5 tarihî arşivi hâlâ byte-byte korunuyor.
- **Kaynak bütünlüğü:** yeni FFA SHA-256 `3d00d872e9df3fa7cec14238f036e3cafdadb9d998e1457870c940ce9e9d0301`; değişiklik yalnız kaynak SHA-kilitli derleyicide uygulanıyor. PR #48 taslak, `main` değişmedi.
