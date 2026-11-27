# Kill the King — KISS oyuncu deneyimi ve tasarım yol haritası
27 Kasım 2026 | İncelenen main: cf46cc804eefe340f64ff8bf703563f28a24f783
## Kapsam
KISS = Keep It Super Simple. Kullanıcı özellikle görsel/arayüz tasarımı, menü, HUD, emirler ve tuş atamalarında sadelik istiyor. Ortak tasarım standardı + her harita için ayrı tespit ve tasarım. Savaş derinliği, asker sayısı, ışık/renk, görsel kalite, bot davranışı ve oyun kuralları korunur. Bu commit yalnız tespit ve öneri; kod, tuş veya görsel değişikliği yok.
Kaynak: kanonik index.html / playable UI34. Aşağıdakiler kaynak kod denetimi bulguları ve tasarım önerileridir; kullanıcı testi yapılmadı. UI34 genel, UI32 ve BUG21–30 Chromium CI başarıyla tamamlandı (46013010877, 46013010799, 46013010824).
## KISS-A — Ortak
| ID | Tespit | Öneri | Öncelik |
|---|---|---|---|
| A01 | HUD kaynakta KRUNKER sürüm ve promosyon başlıkları; V21 kısmen yeniden markalıyor | Kalıcı markalama/sürüm metinlerini kaldır | yüksek |
| A02 | FPS, hız, atmosfer sürekli HUD alanı kullanıyor | FPS ve hız isteğe bağlı; atmosfer ayarlarda | orta |
| A03 | hud-class-tip, hud-ability-badge, hud-status-badge kısmen aynı bilgiyi sunuyor | Tek bağlamsal silah/yetenek alanı | yüksek |
| A04 | Dört sınıf tuşu kalıcı görünür | Aktif sınıf ve gerektiğinde seçim listesi | orta |
| A05 | Örnek sohbet kaynakta; V25 CSS gizliyor | Gerçek kullanım bağımlılığı kontrolünden sonra sil | düşük |
| A06 | Kill feed, medal, score popup, impact ayrı sistem | Öncelikli ve süreli ortak bildirim dili | orta |
| A07 | Kontroller rehberi F6–F10 ve P bilgisi haritaya özgü değil | Aktif harita ve sınıfa göre rehber | yüksek |
| A08 | P tek kişilikte kamera, ordu savaşında taktik harita; repeat ayrımı da mevcut | Sabit kamera ve harita tuşları; çakışma testleri | kritik |
| A09 | match-qa-export-btn sonuç ekranında | Geliştirici seçeneği | düşük |
| A10 | Pause UI32 yalnız devam/ayar/kontrol, açık ana menü dönüşü yok | Güvenli maçtan çıkış ve sade pause; sonuç kuralları korunur | yüksek |
## KISS-B — Arena
| ID | Tespit | Öneri | Öncelik |
|---|---|---|---|
| B01 | Radar kaynakta kuşatma etiketi; V25 RADAR olarak düzeltir | Yazısız, küçük radar ve okunur simgeler | düşük |
| B02 | K/D/seri üst sol, TAB ayrıntıları tekrar | Kısa kişisel skor; tam tablo TAB | orta |
| B03 | Üst merkez logo ve promosyon alanı | Görüşü aç | yüksek |
| B04 | FFA ve TDM ortak HUD; takım skoru zaten koşullu | Koruyarak farklı bilgi hiyerarşisi | orta |
| B05 | Mermi metni sınıfa göre değişiyor ama ortak alan Mermİ etiketi | Tüfek mermi, yay gerilim, yakın dövüş yetenek | yüksek |
| B06 | Killfeed/medal/score popup eşzamanlı olabilir | Kısa, küçük, öncelikli göstergeler | orta |
## KISS-C — Meydan savaşı
Kaynak: meadow-army-hud, refreshMeadowArmyHud, army-tactical-overlay, drawArmyTacticalMap, keydown.
| ID | Tespit | Öneri | Öncelik |
|---|---|---|---|
| C01 | 7 doğrudan emir G J K L U Y N; P harita; 6 diziliş Z X O B M I; 7/8/9 ateş; 2 köşeli parantez aralık; F10 detay = 20 orduya özel tuş | Tek komut açma tuşu; hızlı emirler ve bağlamsal ikinci seviye; tüm mevcut işlevler korunur | kritik |
| C02 | own-status uzun bot planı/iletişim/tehdit/geçmiş/lojistik metni | HUD sadece yaşayan asker, mevcut emir, diziliş, kritik uyarı; ayrıntı TAB/taktik ekran/QA | kritik |
| C03 | P iki ayrı düğmede aynı haritayı açıyor; komut ilerleme metni de uzun | Tek taktik harita girişi, kısa emir teyidi | yüksek |
| C04 | Ateş komutları yakın dövüşte disabled, görünür | Sadece okçu/tüfekçi için göster | yüksek |
| C05 | Taktik haritada 15 işlem düğmesi + kapat (hedef, waypoint, temizle, yön, düşman, kilit, 3 zoom, 2 genişlik, 3 derinlik toplam 14 + kapat; sayı sayımına göre 15) | Hedef seçimi birincil; rota/yön/diziliş bağlamsal, zoom ortak kontrol | yüksek |
| C06 | Harita noktaları çoğunlukla renk ve çizgiyle ayrılıyor | Küçük açıklama/ikon, kendi birlik, oyuncu, seçili hedef farklı şekil | orta |
| C07 | 8 bölük detayı + TAB ordu tablosu + bot planı | Detaylar tek taktik bilgi ekranında, HUD özet | orta |
| C08 | F10 kompakt panel top:166px, mevcut temel HUD ile alan rekabeti | Tek küçük komuta şeridi; küçük ekran örtüşme testi | yüksek |
| C09 | İngilizce dahili formation/order/fireMode değerleri own-status metnine ekleniyor | Türkçe kısa eylem isimleri | yüksek |
| C10 | Harita açma/kapatma ve pointer lock odak davranışı önemli | Tek tutarlı aç/kapat, yanlışlıkla savaş girdisi üretme yok; mevcut güvenli davranış korunur | yüksek |
## KISS-D — Kale kuşatması
Kaynak: native-siege-panel, KTKNativeSiegeHud, siegeHotkeys, siege HUD update.
| ID | Tespit | Öneri | Öncelik |
|---|---|---|---|
| D01 | Meydan'ın 20 tuşuna F6–F9 ekleniyor | Tek bağlamsal kuşatma/emir menüsü; bütün emirler korunur | kritik |
| D02 | F10 iki ayrı paneli aynı anda genişletiyor | Tek komuta arayüzü ve bağımsız görev özeti | yüksek |
| D03 | Kompakt özet 4 araç/kapı HP + avlu sayısı + 15 sn hakimiyet aynı satır/metinde | Aktif hedefi öne çıkar, diğerleri araç durumuna | kritik |
| D04 | Geniş panel geliştirici sayaçları: watchdog replan, taş engel, iniş, isabetler vb | QA ekranına, oyuncuya yalnız karar için gerekenler | yüksek |
| D05 | F9 kapı açılana kadar disabled; neden bilgisi metne dağılmış | Hedef koşulu kısa, eylem kullanılabilir olunca görünür | yüksek |
| D06 | Araç görevleri crew ve HP bilgisini yoğun metinle gösteriyor | Araç ikonları, görev durumu, hasar barı; arızada uyarı | yüksek |
| D07 | Meydan genel ordu planı metni kuşatmada da kullanılıyor | Kuşatma hedeflerini ve kendi birliğini ayrı sade şeritlerde göster | yüksek |
| D08 | Taktik harita ortak 2B dünya engel görünümü | Kuşatma için kapı/sur/iç avlu/araç işaretleri ve hedef hiyerarşisi | yüksek |
| D09 | Saldırı ve savunma için farklı bilgi gereksinimleri | Mevcut oyuncu tarafı ve kuralları doğrulanarak taraf bağlamı tasarla; yeni oynanabilir savunmacı modu vaat edilmez | orta |
| D10 | 15 sn hâkimiyet, kapı açılması, kule yıkılması gibi olaylar ayrıntıda kaybolabilir | Tek hedef göstergesi ve geçici kritik bildirim | yüksek |
## Sıra ve kabul koşulları
A temel tasarım dili ve tuş sözleşmesi (tuş seçimi uygulama öncesi onaya açık); B Arena; C Meydan; D Kuşatma. Ortak davranış tek; harita özel özellikleri ayrı. Önce mevcut ekran fotoğrafları ve tuş/işlev tablosu; sonra görsel revizyon; sonra kontrollü input revizyonu. Test: harita x en az 3 ekran boyutu; HUD örtüşme, okuma, kontrast; tüm mevcut emirlerin ulaşılabilirliği ve doğru yönlendirme; tek tuş tek niyet, pointer lock/focus/pause, kamera, harita, sınıf, tekrar giriş; maç ve bot/asker mekanikleri değişmez. FPS/frametime regresyon kontrolü. Oyuncu testinde emir verme süresi ve hatalı basış, kontrol kılavuzuna ihtiyaç, görüş alanı. Tuş atamaları şu anda öneri; kod uygulanmadı. Harita 2/3 için doğrudan hızlı emir + tek açılır komuta menüsü konsepti prototiple test edilmeli; radyal menü veya başka biçim kesin karar değil.

## KISS-A ilk uygulama paketi
A01 eski HUD logosu/promosyon metni kaldırıldı; A02 FPS/atmosfer/hız varsayılan gizli, ayarlarda oturumluk teknik göstergeler anahtarı; aktif slide-hop geri bildirimi korunuyor. A03 kısa sınıf/mermi/yetenek metni (detay seçili sınıf kontrol rehberinde), A04 sürekli 4 sınıf kartı kaldırıldı (aktif sınıf HUD ve Arena rehberi kalır; geçici seçim şeridi ayrı prototip gerektiriyor), A05 eski sahte sohbet ve onu gizleyen yanlış konumsal CSS silindi, A07 harita bağlamlı rehber (mevcut P/F tuşları değişmedi), A09 QA export teknik göstergeler açıkken görünür. A06 bildirim birleştirme, A08 tuş sözleşmesi, A10 güvenli pause dönüşü henüz uygulanmadı. Asker/AI/fizik/ışık/grafik ve kontrol atamaları korunuyor. CI statik ve gerçek Chromium kabul testleri eklendi; sonuç bekleniyor.

## KISS-A ikinci paket ve tarayıcı regresyonu
İlk paket genel CI ve BUG21–30 başarılı; UI32 gerçek Chromium 1920 Arena başarılı, 1366 Meydan can HUD görünürlük testi başarısız (46017795402). Kök neden V19 ordu HUD eski konumsal CSS kuralı, silinen sohbet kutusunun yerine can panelini gizledi. Üç eski konumsal gizleme kuralı semantik medal/personal-score ID ile değiştirildi, ordu can paneli artık gizlenmez. A04 Arena klavye sınıf değişimi 1.8 sn kısa teyit, A06 tek son madalya/skor bildirimi ve 3 satır kill feed (4.5 sn), A08 P tüm haritalarda kamera; T yalnız ordu savaşında taktik harita aç/kapat, basılı tuş tekrarı toggles engellenir; diğer emir/tuşlar korunur. A10 pause Ana menü düğmesi, çıkış onayı, iptalde maç duraklatılmış kalır, sonuçtan dönüş ortak işlevi, yeni maç başlangıcında mevcut reset yolu. Yeni kod sadece arayüz ve giriş eşlemesi; savaş simülasyonu, grafik/ışık, asker/bot davranışı değişmedi. CI tekrar doğrulama bekliyor.