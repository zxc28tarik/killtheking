# AK29 — Üçüncü Harita: Tarihî Kuşatmaya Dayanıklı Kale Profili

Tarih: 23 Kasım 2026

## Tasarım hedefi
Kale savaşında mevcut AK25 4.23× kale / 8.04× harita büyümesi ve AK26 19 fiziksel savunma kütlesi korunarak XVII. yüzyıl sınır-topçu kalesi profili oluşturmak. Bu çalışma **ayrı oyun modu veya ayrı motor değildir**.

## Mevcut fiziksel sistem (korunacak)
- İçte 70 kırmızı savunmacı; dışta 70 mavi saldırgan.
- Orijinal 600 HP kırılabilir kapı; koçbaşı, kuşatma kulesi, mancınık ve F6–F10.
- Dış tabyalar, kapı arkası dogleg, iç avlu traversleri, açık 24 m geri çekilme geçidi.
- 19 gerçek fiziksel blok; AK28 özgün G5.4 rota çözümü.
- Arena ve Meydan haritalarına değişiklik YOK.

## Bu değişiklikte uygulanan AK29 görsel katman
- Fiziksel güney tabyaları üzerine top mazgalları ve taş lento çerçeveleri.
- Tabyaların üstünde kalın taş parapet ve aralıklı dişler.
- Savunma duvarında yatay taş örgü çizgileri ve dış şev (scarp) kütleleri.
- Mevcut muhafız odaları üzerinde savunma açıklığı görünümü.
- İç ikinci hat üzerine, 24 metrelik merkez geçidini kapatmayan alçak taş dişler.
- Kapsam yalnız **native-siege-defense-v26.js** üzerindeki özgün sahne grubunda; gerçek engel sayısı, can, silah hasarı, asker sayısı ve 28 özgün script değiştirilmedi.

## İşlev ve dürüstlük
Yeni görsel taş örgüler, portlar ve şev kaplamaları **yeni raycast hedefi veya bot çarpışması değildir**; altlarındaki AK26 tabyaları zaten gerçek fiziksel duvarlardır. Bu versiyonda topların ateş etmesi, askerlerin sur üstünde yürümesi, yeni yapay zekâ veya yeni yıkılabilir mevzi eklenmiş değildir. Bunlar sonraki ayrı işlevsel aşamanın kapsamıdır.

## Test kapıları
- [ ] Node kaynak/sözdizimi ve kanonik üretim CI
- [ ] Chromium üç harita/140 asker kabulü
- [ ] Kuşatma ana kapısı, koçbaşı yolu, kule rampası, mancınık ve AK28 altı gerçek asker yolu
- [ ] Fiziksel Windows GPU oyun içi estetik kabulü

## Sonraki öncelikler
1. Mevcut fiziki tabyaları bağımsız siper noktalarıyla yaşayan savunma pozisyonlarına bağlamak.
2. Surlar için gerçekten yürünebilir güvenli bağlantılı merdiven/rampa ve AI yürüme grafiği.
3. Top mazgallarına yalnız uygun yerde konumlanan gerçek atış noktası; yıkılabilir bölüm kararını dengeden sonra vermek.
4. Kapı arkası katmanlı savunma için insan oyuncu ve bot kuşatma kabulü.

**Not:** Testler tamamlanmadan PASS/ana dala birleştirildi iddiası kurulmaz.
