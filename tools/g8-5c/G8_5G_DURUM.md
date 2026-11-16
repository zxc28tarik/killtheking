# Kill the King — G8.5G Kaynak Kurtarma Adımı

Tarih: 17 Kasım 2026

## Geçerli ve değiştirilebilir kullanıcı kararları

Kullanıcı aksini söyleyene kadar ordu/bireysel FFA davranışlarının ayrı tutulması, savaş dengesinin korunması, tohumlu tekrarlanabilirlik, gerçek taraf takası, pasif telemetri ve 144 gerçek ayna-maç denemesi onaylı geliştirme yönleridir. Bu kararlar yeni, kapsamlı oyun mekaniğini otomatik olarak onaylamaz.

## Gerçekleşen işler

- **Yeni çevrimdışı kaynak bulucu**: `G8_5G_Yerel_Kaynak_Bulucu.html`; Windows/Chrome'da dosya veya klasör seçmek için kullanılabilir. Kullanıcı seçmeden hiçbir yerel klasöre erişmez. Yalnızca seçili isimlerdeki HTML/ZIP dosyalarını okur; bağlantı kurmaz, oyun kodu yürütmez, kaynakları değiştirmez, ZIP içeriğini doğruladığını iddia etmez.
- **İsteğe bağlı Python CLI**: `g8_5g_recovery_finder.py`; İndirilenler/Masaüstü/Belgeler gibi klasörleri read-only tarar, adaylara SHA-256 verir, G8.5F syntax/işaret analizini çalıştırır, uygun kaynak ZIP içindeki aynı HTML'nin birebir eşleşmesini denetler. Sonuç JSON'u yerel bilgisayarda kalır.
- **Testler**: `test_g8_5g_recovery_finder.py` 30/30, `test_g8_5g_browser_finder.mjs` 20/20. Önceki 307/307 ile toplam **357/357 bağımsız QA testi** başarılı.
- **Gerçek UI smoke**: Chromium/Playwright ile gerçek dosya seçme senaryosu olumlu. Dosyanın kendisi bir *test örneğidir*, gerçek oyun kaynağı değildir.

## Yapılmamış işler / blokör

- `KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html` ve `KillTheKing_G8_4_KaynakKod.zip` 16 Kasım'da önceki konuşmada oluşturulmuş olabilir, fakat bu oturumda erişilebilen dosyalarda veya GitHub deposunda **bulunamadı**.
- **Gerçek G8.4/G8.5 oyun koduna entegrasyon yapılmadı**. Eski G5.4 ile değiştirmek sürüm düşüşü olur.
- 388 önceki gerçek oyun regresyonu tekrar çalıştırılmadı, gerçek maç **0/144**, WebGL GPU/30 dakika performans doğrulaması yok.
- `main` ve oynanabilir eski kaynak kodu değiştirilmemeli. GitHub PR #43 yalnızca taslak QA eklentileridir.

## Kullanım (Windows, Python gerektirmeyen önerilen yol)

1. `G8_5G_Yerel_Kaynak_Bulucu.html` dosyasını Chrome/Edge ile aç.
2. **Klasör seç** → bilgisayarındaki `İndirilenler` klasörünü seç. Diğer klasörleri de gerekirse dene.
3. Dosya bulunursa kaynak HTML'yi ve kaynak ZIP'ini sohbete ekle.
4. Dosya geldikten sonra G8.5F gate + manuel kaynak fark denetimi yapılır. Ancak ondan sonra oyuna entegrasyon ve gerçek testler başlar.

**Alternatif geliştirici CLI**: Python ve Node kuruluysa `python g8_5g_recovery_finder.py --scan "$HOME/Downloads" --json kurtarma_raporu.json` (Windows PowerShell'de `--scan "$env:USERPROFILE\Downloads"`). Bu araç güvenlik nedeniyle en fazla 40.000 dosya ve 30 aday inceler; kaynak bulunmadı raporu bilgisayarda hiç dosya olmadığı anlamına gelmez.
