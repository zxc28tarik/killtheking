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
