# Ana dal ve yan dal denetimi — 24 Kasım 2026

Denetim tabanı: main 497fa653b250522b3d13f5d9a3453a5e7fc55e3d (PR #73).
66 yan dal karşılaştırıldı: 26 dalın tüm commitleri main geçmişinde, 40 dalda farklı geçmiş var. Farklı geçmiş, özelliğin eksik olduğunu tek başına kanıtlamaz.

## Güncel tek oyun
- main/index.html ve playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html aynı blob: 1d97870b7cf0734cbafc4201f70909d7d61beccb.
- tools/build_offline.py güncel adaydan birebir çıktı alır.
- Browser game checks, UI32 full-screen acceptance, native siege long acceptance ve historical native baseline testleri main üzerinde PASS.
- Eski native builder çıktısı yalnız regresyon referansı. Güncel indirilebilir artifact: KillTheKing-CURRENT-PLAYABLE, başarılı main CI run.

## Dal sınıflandırması
- AK26–AK30, canonical-native-three-maps, UI25, UI27, UI29–UI32, V20–V24, visual-v19, native siege/army recovery ve ilgili diğer atalar zaten main geçmişinde. Yeniden merge edilmez.
- UI28: tek ek dosya kompakt vektör menüsü. Onaylı bitmap/tam ekran akışının alternatifi; arşivde kalır.
- visual-meadow-siege-pass1: 30 commit, 297 geride. Eski üç iframe launcher/ayrı kuşatma önizlemesi; doğrudan merge edilmez. Görsel özellikler gerekirse native oyuna ayrı ayrı port edilir.
- g8-5c-telemetry-mirror-qa: 54 commit, 879 geride. Eski QA/telemetri araçları; 49 dosya. CI değişiklikleri otomatik alınmaz. Yararlı testler güncel native motor uyumluluğu doğrulanınca ayrı PR ile alınabilir.
- A1–A8 ve eski combat/AI/P0 dalları: eski modular source geçmişi; güncel native bundle ile içerik karşılaştırması gerekir. A8 dalından 14 modül denetlendi, 12 modül birebir güncel HTML içinde; ArenaMeadowGrass ve ArenaCombatTactics güncel HTML içinde mevcut fakat farklı, semantik karşılaştırma açık. Kalan eski dalların her bir değişikliğinin içerik eşitliği doğrulanmadı. Eski dalların korunması, doğrudan merge edilmemesi gerekir.

## Yeni geliştirme akışı
1. Yalnız en güncel main'den yeni kısa ömürlü dal oluştur.
2. Bir PR doğrudan main'i hedefler. Eski dal üzerine yeni özellik zinciri kurma.
3. CI, PR head'in güncel base commit'i içerdiğini kontrol eder; değilse main ile güncelle ve tekrar test et.
4. Güncel aday, root index ve offline çıktı birebir aynı olmalı; gerçek Chromium testi güncel root dosyayı açmalı.
5. PASS sonrası merge; yalnız main başarılı CI artifact'ini kullanıcıya ver. Tarihsel dal ve PR kayıtları silinmez.
6. Yeni menü sürüm işareti değişirse CI sözleşmesini aynı PR'da güncelle.

Not: CI ancestry kontrolü ekleniyor, repository branch protection/ruleset zorunluluğu bu çalışma kapsamında ayarlanmadı; eski dallara zorla push yapılmaz. Bu belge eski kaynaklara ait tüm özelliklerin semantik olarak taşındığı iddiası değildir.

## İkinci içerik denetimi — güncel gerçek HTML
- A8 ile farklı iki modül çözümlendi: ArenaMeadowGrass 256 → 512 piksel, daha sık blade/ton/benek, mipmap filtreleme ve 96 tekrar ile yükseltilmiş; eski sürüme dönülmez. ArenaCombatTactics mevcut erişilebilir rota, geri çekilme ve ateş konumu davranışını koruyup cover, flank, evade/feint, düşük can ve cooldown davranışları ekliyor.
- Eski AI/animasyon/çarpışma dallarından 11 modül karşılaştırıldı: en son erişilebilir atış rotası, ok çarpışması, kalkan parry, yakın saldırı teması ve güvenli doğuş birebir. Daha eski navigasyon sürümleri yerini güncel 13 KB modüle bırakmış. Karakter hareketinde eğim, menzilli hazırlık ve yumuşak dönüş; model teması ve silah sweep'te ordu hedefleri; oyuncu çarpışmasında rampa yan yüzü koruması ilave edilmiş.
- Eski src/ testlerinin güncel native HTML'yi çalıştırmadığı biliniyor. tests/current-native-inline-modules.test.mjs doğrudan main/index.html içindeki 26 modülü yükleyerek silah, maç, ayarlar, taktik, animasyon, çarpışma ve meydan/ordu sözleşmelerini kontrol eder. Eski testler arşiv regresyonu olarak korunur.
- Visual-meadow-siege-pass1 içindeki KTKMeadowNatureV19 (460 ağaç, 1550 çalı vb.) kodu güncel HTML'ye birebir alınmamış. Güncel native doğa dekorasyonuyla görsel ve maliyet karşılaştırması yapılmadan taşınmaz.
- G8.5 eski QA araçlarının aktarımı ve geri kalan dallardaki tüm runtime değişikliklerinin semantik incelemesi hâlâ açık. Bu turda oyunun oynanış kodu değiştirilmedi.
