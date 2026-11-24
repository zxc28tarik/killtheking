# FIT02 — Ölü kod temizliği (ilk güvenli paket)
Temel: main 310aa2defc4b2152df6eb034eb07885071dbde41, FIT01 birleştirildi.
Aktif HTML içindeki 31 script tarandı; Three.js hariç HTML ve scriptlerde yalnız kendi tanımında geçen beş isim kaldırıldı: armorPlateTex, FRONT_RADIUS, skinMat, sleeveMat, enemyTracers.
İki kullanılmayan MeshStandardMaterial nesnesi artık oluşturulmuyor. Kullanılan armorPlateBundle, çarpışma, bot, animasyon ve savaş kodları korunuyor. Tam olarak beş satır / 333 karakter çıkarıldı. Diğer 30 script ve script dışı HTML değişmedi. Root ve standalone aynı blob.
Bu ilk paket kapsamlı ölü kod temizliğinin tamamı değildir; dinamik erişim veya eski menü uyumluluğu şüphesi olan parçalar korunmuştur. Testler: FIT02 regresyon testi, mevcut genel CI ve üç haritalı Chromium kabul testi. CI tamamlanmadan main'e birleştirme yok.
