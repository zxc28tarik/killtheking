# P0 — Darbe ve kalkan çarpmasında botların sur içine itilmesini önleme

## Tespit edilen açık
Botların A* ile normal yürüyüşü çarpışma kontrollüydü, ancak **üç savaş etkisi** bunu atlıyordu:
- Oyuncunun botu vurması (normal isabet / kafa vuruşu) → doğrudan bot.mesh.position.addScaledVector.
- Botların birbirini vurması → doğrudan victim.mesh.position.addScaledVector.
- Şövalyenin kalkan çarpması → hedefi doğrudan **4,5 birim** ileri taşıyordu.

Bu hareketler duvar, sur, kale ve rampa collider'larını kontrol etmeden botları katı objelerin içine taşıyabiliyordu. Özellikle hızlı saldırılarda veya dar koridorlarda görülebilen bir harita kararlılığı sorunudur.

## Uygulama
- Tüm bot geri itmeleri `applyBotWorldKnockback` üzerinden geçirildi.
- Bu yardımcı fonksiyon, mevcut `ArenaNavigation.safeAdvance` üzerinden **aynı engel / yüksekliğe duyarlı hareket denetimini** kullanıyor. Yeni bot fizik motoru oluşturulmuyor.
- Geri itme yalnızca mümkün olan mesafe kadar uygulanıyor. Duvarın içine geçmek yerine engelde durma veya sınırlı yan kayma var.
- Gerçekte konum değiştiğinde botun eski A* rotası ve taktik hedef yenileme süreleri sıfırlanıyor; böylece eski hedefe takılıp kalması azaltılıyor.
- Mevcut silah hasarları, kalkan çarpması mesafesi üst sınırı, düşman animasyonu, bot-vs-bot serbest savaş, harita çizimleri, kullanıcı hareket ve kamera hissi **değiştirilmedi**.

## Otomatik doğrulama
- Engel dibinde 4,5 birim kalkan itmesi; çapraz geri tepme; botlara uygulanan bütün üç noktanın denetimli yol üzerinden gitmesi; yol yeniden hesaplaması; geçersiz/sıfır hareketler; altı botun birden çok yakın-duvar çarpışması.
- PR derleme testi bütün önceki 143 testi de çalıştırır ve `killtheking-playable-html` çıktısını oluşturur.

## Henüz doğrulanmayanlar
Gerçek WebGL oyunda kalkan çarpması–duvar köşesi, şiddetli darbe sonrası botların sur kenarında ayakta kalması, görünür yüksekliğin rampa ile uyumu ve uzun maç FPS ölçümü hâlâ P0 kabulünün parçasıdır. Bu bir **bot çarpışması düzeltmesi**, P1 mod/maç özellikleri başlatılmadı.
