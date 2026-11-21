# AK-NATIVE-02 — Kale Kuşatması aynı oyun motorunda, harita olarak

**Karar / kabul sınırı (21 Kasım 2026):** Kullanıcı ayrı bir üçüncü oyun/ayrı kamera/ayrı FPS motoru istemiyor. Kale, asıl Kill the King **Krunker 1600 / G5.4** oyununda bir harita seçeneği olmalı. Özgün FPS/TPS kamera, WASD, zıplama-kayma, silahlar, botlar, 140 gerçek asker ve 8 bölük değişmeden kullanılacak. Eski S3D1 iframe kuşatması **kabul edilmiş nihai oyun değildir**; `main` merge yapılmayacak.

## Çalışan sohbet artefaktı (henüz git source commit değil)

- Tam oynanabilir ana oyun HTML'si bu sohbette: `KillTheKing_ANA_OYUN_KaleKusatmasi_Gecit_IcKale_Guncel.html`
- Boyut: **1,292,522 bytes**; SHA-256 `61448448d2c31e148b601884c936a8cea5ad9021d05f8be12438bd1ebf13e6af`
- Başlangıç: `KillTheKing_Ayni_Oyun_Kale_Haritasi_G54_Guncel.html` adlı önceki sohbet HTML'si.
- Yalnız son inline ana oyun betiği ve harita UI düzenlenir. **İlk 28 özgün script içerikleri 28/28 byte-identical**; son özgün oyun motoru kopyalanıp değiştirilmez.
- Script/integrity test: `node --check` PASS, 8/8 gerçek G5.4 kaynaklı mantık testi PASS.
- Chromium UI testi (yalnız testte WebGLRenderer mock): orijinal oyun menüsü, harita seçimi, tek oyun, 140 asker, F7/F8 ekipman emirleri, 2 gerçek konum hedefi, test amaçlı kapı açma, sağ komuta HUD'sı ve F9 hücum yeniden emri PASS; `pageErrors=[]`.
- **Ekran/GPU gerçek 3D görseli ve tam 4 dakikalık manuel uzun maç kabulü henüz yapılmadı.** Mock görsel kaliteyi onaylamaz.

## AK-NATIVE-02 değişiklikleri

- G5.4 `setDestination` kaynaklı iki kademeli taarruz: kapı açılınca kırmızı savunmacıların gerçek kapı collider'ı kalkar. Yaşayan mavi mızrakçı ve kılıçlılara kale içindeki gerçek merkezi keep duvarını **dolaşacak** sol/sağ ilk hedefler `(-19,-16)` ve `(19,-16)` gönderilir.
- Aynı bölüğün **en az iki canlı askeri** kapıyı geçip geçişe ulaşırsa, gerçek G5.4 yol bulma motoruyla `(-23,12)` / `(23,12)` iç avlu hedefi verilir.
- Oyuncu taktik haritada başka bir komut verirse `routeGoal` farklılığından algılanır, otomatik emir **zorla üstüne yazılmaz**. Sadece oyuncunun F9 yeniden hücum emri manuel override'ı değiştirir.
- İç avlu sonucu gerçek yaşayan askerlerin `|x|<28,z>4` hâkimiyetinin **15 kesintisiz saniyesine** bağlıdır. Düşman bulunursa süre sıfırlanır. Sahte bot/teleport/HP/zafer yoktur.
- Bağımsız `nativeSiegeUpdate` yalnız eklenen harita/equipment kurallarını işler; orijinal G5.4 combat remains authoritative. İki oyun motorunu ayrı iframe'de çalıştırma kesinlikle yapılmaz.
- Offline Tailwind snapshot'ında `top-24/right-3/left-3/bottom-12` utility'leri eksik olduğundan yeni sağ kuşatma paneli ve G5.4 sol komuta paneli görünür alana **inline sabit CSS** ile yerleştirildi.
- FPS mouse pointer lock altında panel düğmelerine tıklanamayabilir: **F7 mızrakçı→koçbaşı, F8 okçu→mancınık, F9 kapı açıldıktan sonra hücum** aynen var olan düğme handler'larını çağırır. Fareyle tıklamak için önce Esc.
- Önceki sahte oyuncu-zafer gösterimine karşı savaş sonucu ekranı gerçek `G5.4 winner` ile kuşatma hedefinin ayrı sonuçlarını gösterir.

## Açık işler (henüz kabul değil)

- [ ] Ana motor kaynak koduyla güncel **tam HTML'yi GitHub'da yeniden inşa edilebilir** şekilde kaynak + builder/fixture olarak taşı. GitHub'da şu an **yalnızca bu kabul notu** bulunmaktadır; indirilebilir sohbet HTML'sini commit sanma.
- [ ] Gerçek ekipman ateşi/kapı yıkımı → iki rotalı asker geçişi → 15s iç kale ele geçirme, tam 4/8 dakika senaryolarında tarayıcı ve Windows WebGL gerçek GPU QA.
- [ ] Kuşatma araçlarını 3D çatışmalar, ekipman hasarı, yıkılma/çarpışma ve kule gerçek mürettebatıyla oynanışa bağla; yalnız model görünümünü özellik olarak etiketleme.
- [ ] Orijinal Arena, Meydan Savaşı ve Kale haritası regresyonu; hiçbiri ayrı oyun haline getirilmesin.
- [ ] Pitch deck: kullanıcı **başlayalım** diyene kadar başlanmaz.
- [ ] `main` dalına hiçbir değişiklik açık onay olmadan merge edilmez.
