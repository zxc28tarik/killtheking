# A5 — 2. Harita çimlendirme

**Hedef:** 20× büyütülmüş açık meydanın (yaklaşık 438×438) tamamı gerçek çimenlik gibi görünürken mevcut kale, FFA/TDM, botlar, doğuş noktaları ve silahlar etkilenmesin.

- Eskiden sadece zayıf yeşil zemin dokusu ve seyrek, çoğunlukla kenar dekorları vardı.
- Zemin artık 256px, yinelenebilir, çok tonlu ve ince yaprak izli prosedürel çim dokusuna sahip (56×56 tekrar, hafif anizotropik filtreleme). Dışarıdan görsel/bağımlılık indirmez.
- Meydanın tamamına, orta açık savaş bölgesi **dahil**, sabit tohumlu çim kümeleri yayıldı: masaüstünde en çok **32.000**, kaba dokunmatik cihazlarda **14.000** örnek. Üç sivri, çapraz düşük poligon yaprak ve yeşil ton varyasyonları. Tek `THREE.InstancedMesh` nesnesi / tek draw call; her küme için ayrı Mesh, shadow map yükü veya sürekli animasyon güncellemesi yok.
- Çimler kısa ve **yalnızca görsel**: katı çit/ağaç/siper üzerinde üretilmez; `colliders` ve `worldMeshes` dizilerine eklenmez, bot navigasyonu/mermi görüşü/hasar veya oyuncu hareketini değiştirmez.
- Kale ile harita değiştirildiğinde mevcut `meadowMapData.visuals` sayesinde çim görünürlüğü de doğru geçiş yapar. Birinci kale dokusu ve malzemesi değiştirilmedi.
- Yeni test: `tests/meadow-grass-detail.test.mjs` — deterministik dağılım, tüm alan/merkez kapsamı, katı engellerden ayrışma, HTML yükleme sırası, instancing ve çarpışmasız entegrasyon.

**Kalan kabul:** Gerçek Chrome/Edge WebGL'de 20× haritayı kontrol et; çim yoğunluğunun ve performansın oyuncu cihazındaki görünümünü doğrula.
