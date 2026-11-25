# GR01 — Meshy'den alınan çim modelinin entegrasyonu

## Kaynak
Kullanıcının yüklediği \`stylized_medieval_gra.glb\` dosyası:
- glTF 2.0; 178 vertices, **156 triangles**, tek mesh/material.
- Orijinal atlas 2048×2048 RGB PNG; toplam GLB 1.729.220 bayt.
- Normalleştirilmiş GLB dünya yüksekliği yaklaşık 0.96 birim (tabanı orta-yden sıfıra taşındı).

## Kalite ve FPS kararı
- Kullanıcının modelinin gerçek topolojisi korunmuştur; geometri yeniden çizilmemiştir.
- Orijinal atlasın renkleri vertex color olarak örneklenmiştir; siyah UV ada kenarlarında en yakın yeşil atlas pikselleri kullanılarak karartma azaltılmıştır.
- Pozisyonlar 8 bit hassasiyete sıkıştırılmıştır (1/250 birim), renkler 8 bit linear RGB olarak kaydedilmiştir.
- **1.536 bayt** paket model HTML içine gömülür; GLBLoader, harici atlas veya ağ bağlantısı gerekmez.
- 12.000 yakın çim korunur. 3.000 örnek gerçek 3D Meshy topolojisi; 9.000 örnek orijinal hafif düşük poligon biçimindedir.
- İki sınıf aynı tile matrislerini kullanır; gerçek 3D örneklerinin eski düşük poligon eşleri sıfır ölçekle gizlenir. Yinelenen çim yoğunluğu oluşmaz.
- 2.700 uzak alan çimi özgün sistemde kalır; ana yüzey, ışıklar, gölgeler ve renk/atmosfer ayarları değiştirilmedi.
- Gerçek 3D model tek \`InstancedMesh\` ile çizilir; gölge üretmez; malzeme \`MeshLambertMaterial\`, tek vertexColors.
- Sadece Meydan haritasında görünür; Arena ve Kale Kuşatması oynanışı ve UI32 menü kodları değişmedi.

## Kod doğrulama
- İlk 28 korumalı inline script ve UI32 menünün son iki scripti birebir korundu. Yalnızca ana oyun scripti (#28) değiştirildi.
- \`tests/gr01_meshy_grass.test.mjs\` modelin indeks/pozisyon/renk uzunluklarını, yer pivotunu, toplam sayıyı ve menü işaretlerini kontrol eder.
- Canlı tarayıcıda GPU benchmark henüz yapılmadığından FPS kazanımı iddia edilmez.
- Oyunda \`ktkMeshyGrassStatus()\` ile 3D/ucuz örnek sayıları ve son yenilenen hücre sayısı okunabilir.

## Sonraki adım
Yüksek kalite kapsamı artırılmadan önce Meydan Savaşı FPS, 1% low, p99 frame time ve draw call sonuçlarını karşılaştır.
