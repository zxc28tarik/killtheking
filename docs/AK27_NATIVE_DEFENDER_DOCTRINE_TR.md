# Kill the King — AK27 / Gerçek Savunma Yapay Zekâsı

23 Kasım 2026. Üçüncü harita **Kale Kuşatması**. AK26'nın gerçek fiziksel savunma yapısını, sadece kapı çevresinde bekleyen değil, gerçek tehdide göre mevzi alan savunucuların kullanmasını sağlar.

## Temel kararlar
- Özgün AK09/G5.4 tek FPS, 3 harita, **140 asker**, 70 içeri / 70 dışarı, 4,23× kale ve 8,04× harita alanı aynen kalır.
- **19 gerçek fiziksel savunma bloğu** ve tüm AK25–AK26 kapı/koçbaşı/mancınık/kule yolları değiştirilmez.
- V27 **sadece 3. haritada** orijinal G5.4 kızıl birlik kaptanlarının taktik emirlerini koordine eder; asker savaşı, yol bulma, isabet, hasar, mermi, sağlık, doğma ve teçhizat orijinal kalır.
- Yeni FPS/ordu motoru, yeni asker, görünmez zırh, ilave hasar, hileli ölüm, waypoint'e anlık ışınlama yok. Orijinal ilk 28 script bayt-eşit.
- Mavi oyuncunun birlik emirleri ve F6–F10 **değiştirilmez**; Arena/Meydan etkilenmez.
- FPS optimizasyonu ve yayıncı pitch deck sonra.

## G5.4 gerçek savunma safhaları

| Safha | Gerçek tetikleyici | Oynanış |
|---|---|---|
| 0. Garnizon | Kale kuşatması açılır, kapı sağlam | Mevcut 15 kızıl okçu gerçek ikinci savunma hattında **bekleme emrini** orijinal G5.4 `issueOrder` ile alır. Diğer kızıl kaptanların özgün yapay zekâsı korunur. |
| 1. Kapı müdafaası | 600 HP gerçek kapının hasar görmesi veya saldırganların fiziksel kapı önüne gelmesi | Mevcut kızıl mızraklı ve kılıçlı kaptanlar `ArenaArmyBattle.setDestination` ile kapı gerisinde x≈±18, z≈10 savunma mevzilerine yönelir. |
| 2. İç geçide geri çekilme | **En az iki canlı mavi asker** gerçekten z≥28 iç avlusuna girer (veya canlı saldırgan arka hatta ulaşır) | Kızıl piyadeler gerçek G5.4 yol bulma sistemine kuzey geçidinde x≈±5, z≈50 hedefi gönderir. Kapı HP'si veya sayaç tek başına geri çekilme tetiklemez. |
| 3. Arka siper | Savunucunun en az bir gerçek bölük merkezi kuzey geçidine yürüyerek yaklaşır | Bu birlik ikinci taş savunma hattındaki x≈±7, z≈76 postuna orijinal G5.4 rotayla geçer. Diğer bölük mevcut geçidine ilerlemeyi sürdürür. |

### Gerçek yol ve taktik yetkisi
- [x] Kızıl kaptan için G5.4'ün asıl `setDestination` planlayıcısı çalışır. **Yol reddedilirse** kaptan eski AI kontrolünde kalır; mevcut asker pozisyonu değişmez.
- [x] Orijinal `G5.4.step` piyade hareketini, siperi, bireysel çatışmayı ve ateşi yönetir. V27 birimlerin koordinatlarını ve HP'sini **hiçbir aşamada yazmaz**.
- [x] Her 1,45 **oyun saniyesinden** sık karar alınmaz; kapıdan artçıya safha ilerlemesi **tek yönlü**, sahte ileri/geri zıplama yok.
- [x] Kızıl okçu ikinci hatta sabit, gerçek G5.4 serbest atış kullanır. İlave ok/mermi/makineli tüfek yok.
- [x] Kızıl musketçiler otomatik hedef/counterfire kararı vermeye devam eder, insan oyuncunun taktik kontrolü ele geçirilmez.
- [x] Savunucuların gerçek kaptanına yalnız geçerli G5.4 komut gönderilir; teslimat ölçümleri `window.ktkSiegeDefenderDoctrineStatus()` üzerinden okunabilir.
- [x] Kale dışındaki iki haritada V27 devre dışıdır; kuşatma tekrar başladığında gerçek garnizon kurulumu sıfırlanır.

## Yapısal kabul
- [x] `recovered/native-siege/native-siege-defender-ai-v27.js` — bağımsız karar/koordinasyon katmanı (yeni battle engine değil).
- [x] `recovered/native-siege/siege-defender-patch-v27.mjs` — yalnız 29. özgün JS içine kancalar, mevcut AK25/26 eklerini korur.
- [x] `recovered/native-siege/build_canonical_three_maps.mjs` — orijinal `index.html` kanonik üretimi.
- [x] `recovered/native-siege/test_native_siege_defender_ai_v27.mjs` — korunan 28 script, 140 aktör, kapı savunması, gerçek geri çekilme, rota reddi, ışınlama/HP dokunulmazlığı.
- [x] Üç harita Chromium ve 140 asker uzun kuşatma/replay iş akışlarında gerçek kızıl okçu rezervi, 3 harita ayrımı ve tekrar oynama reseti ölçümleri eklendi.
- [x] Kanonik kök HTML senkronizasyonunda ve native uzun savaş CI'da V27 izleniyor.

## Canlı test ve merge kabul kapıları
- [x] PR #63 son commit `46612c5ad` için genel oyun/kaynak testleri **PASS** — `45086212442`.
- [x] PR #63 son commit `46612c5ad` için gerçek üç harita Chromium/WebGL ve 70+70 asker **PASS** — `45086212669`.
- [x] PR #63 son commit `46612c5ad` için 140 asker, hızlandırılmış 120 oyun saniyesi kuşatma ve replay **PASS** — `45086212377`.
- [x] PR #63 `25b44fe8` merge commit'iyle `main`'e birleştirildi. Aynı commit için genel oyun `45086472946`, üç harita Chromium/WebGL `45086472923`, 140 asker uzun kuşatma/replay `45086472924` — **üçü de PASS**.
- [ ] Kullanıcının Windows ekran kartında, kale kapısının kırılması ve ikinci hattın gerçek maçta dengesi / siper kullanımının insan oynanışıyla kabulü **açık**.

### Sınırlar ve gelecek kapsam
- Geçerli rota çıkmazsa kaptan sıfırdan pozisyon yaratmaz; rota reddedilir. Manuel oynanış sırasında veya gerçek kuvvetler kapıya giremezse savunucu hareket etmeyebilir.
- Otomatik Chromium kabulü orijinal askerlerin pozisyonlarının ve sistemlerin doğru başlatıldığını kanıtlar; **her savaşta** ikinci hattın başarıyla ele geçirileceğini veya kale dengesinin mükemmel olduğunu garanti etmez. Gerçek kapı kırılmasının ardındaki zamanlamayı oyuncu/görsel kabulüyle değerlendirmek gerekir.

## AK27 Sonuç / Ana dal kabul — 23 Kasım 2026

- **Tek özgün AK09/G5.4 HTML**; önceki Arena, Meydan, Kale Kuşatması ve V21–V26 onaylı parçalar aynen korunmuştur.
- Kırmızı ikinci-hat okçuları orijinal `issueOrder` ile mevzide tutulur. Kapı baskısı ve gerçek iç avlu sızmasında mevcut kızıl mızraklı/kılıçlı kaptanlar G5.4 `setDestination` üzerinden geçit ve arka mevzi rotası alır. G5.4 yolu reddederse emir reddedilir, beden ışınlama/hasar yaratma yoktur.
- Testlerde oyuncunun mavi G5.4 komuta yetkisi ve mevcut 140 asker korunur, diğer iki harita etkilenmez, kuşatma replay ilk garnizon safhasını yeniden kurar.
- **Yorum sınırı:** Gerçek Chromium regresyonu ilk konuşlandırmayı ve uzun gerçek kuşatma oyun döngüsünü doğrular. Her olası kapı kırılması ve ikinci hat gerileme vakasında optimal savaş dengesi için kullanıcıyla Windows GPU gerçek oyun kabulü hâlâ açık. Bir başka deyişle geçerli G5.4 rota denemelerinin tüm savaşlarda başarıyla tamamlandığı garanti edilmez.
- Yeni harita veya FPS/perf optimizasyonu yapılmadı, yayıncı pitch deck çalışması kullanıcı isteğine kadar ertelendi.
