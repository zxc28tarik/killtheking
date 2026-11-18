# Kill the King — Windows gerçek GPU / Escape / dört dakikalık FFA kabul aracı

**Tarih:** 18 Kasım 2026  
**Durum:** **KULLANICI BİLGİSAYARINDA DONANIM KABULÜ HENÜZ YAPILMADI.**  
**GitHub:** Taslak PR #48, ana dal \`main\` korunuyor. Herhangi bir birleşim veya yayın kararı otomatik verilmez.

Bu araç, daha önce yazılımsal Chromium/SwiftShader ile doğruladığımız kale çarpışması ve FFA mantığına ek olarak, **normal Windows Edge veya Chrome penceresinde fiziksel ekran kartı ile gerçek zamanlı WebGL davranışını** ölçmek üzere hazırlandı. Kullanıcının cihazında çalıştırılmadıkça sonuç **OPEN** kalır.

## Windows'ta başlatma

**Gerekenler:** Windows 10/11, Microsoft Edge (veya Google Chrome), **Node.js 22 veya üzeri**, Python 3.9+, Git for Windows ve ilk kurulumda internet bağlantısı. Kullanıcı parolası, yönetici izni veya GitHub API token'ı istenmez (özel depo erişimi varsa normal Git kimlik doğrulaması gerekebilir).

PowerShell'de:

\`\`\`powershell
git clone --branch codex/g54-ffa-army-isolated-launcher https://github.com/zxc28tarik/killtheking.git KillTheKing-QA
cd KillTheKing-QA
powershell -NoProfile -ExecutionPolicy Bypass -File .\recovered\army\integration\run_windows_gpu_acceptance.ps1
\`\`\`

Chrome kullanmak için komutun sonuna \`-Browser chrome\` eklenebilir.

**Mevcut aday HTML dosyası varsa:** Script \`-CandidateHtml "C:\...\KillTheKing_Birlesik_FFA_Ordu_G5_4_Aday.html"\` parametresiyle aynı SHA kontrolünden sonra kullanabilir. Önceden oluşturulan tarihî A5 kaynağı \`-FfaSourceDir "C:\...\kaynak"\` ile verilebilir; aksi halde kaynak kontrollü geçici Git kopyası hazırlanır.

### Kullanıcı hangi işlemi yapacak?

1. Script tarihî A5 oyununun derlemesini **SHA-256** ile karşılaştırır, özgün FFA + izole G5.4 adayını üretir ve ikinci **SHA-256** doğrulamasını yapar. Beklenmeyen HTML varsa durur.
2. **Gerçek Edge/Chrome penceresi** açılır; kale haritasında FFA başlar. Test kendiliğinden nişan almaz, botları ışınlamaz, \`updateGame\` fonksiyonunu hızlandırmaz.
3. **Fareyi hareket ettirip klavyede fiziksel \`Escape\` tuşuna bas.** Script Escape göndermeden, fare kilidinin bırakıldığını ve oyunun gerçekten durakladığını gözler. Gerekirse normal devam düğmesine tıklar. Fiziksel Escape görülmezse sonuç **OPEN** olur; fallback ile kilidi kaldırmak başarı sayılmaz.
4. Devam eden maçta normal şekilde oynayabilirsin. **240 oyun saniyesi** boyunca normal \`requestAnimationFrame\` ve gerçek 3D çizimden elde edilen GPU/FPS/1%-low/kare süresi verileri ölçülür. Maç bitişinde \`00:00\` ve **7 oyunculu sonuç sıralaması** aranır.
5. Raporlar cihazda, \`recovered\army\integration\windows-acceptance-evidence\<tarih>\` klasörüne kaydedilir: \`windows-gpu-acceptance.md\`, \`windows-gpu-acceptance.json\`, \`windows-final.png\`.

Özellikle dikkat: Tarayıcı penceresini arka plana almak, oyun ekranını kapatmak veya oyun devam ederken Escape ile duraklatmak **kesintisiz 240 saniye kabulünü bozabilir**. Normal oyun süresi, FPS düşükse gerçek saatten farklı ilerleyebilir; test **oyun saniyesini hızlandırmaz**. Varsayılan güvenlik kesme sınırı \`-MaxWallMinutes 15\` parametresidir; bu süre kesin bir çalışma tahmini değildir.

\`-SkipManualEscape\` kullanılabilir fakat bu durumda **fiziksel Escape kabulü açık kalır**, yayın onayı üretilemez.

## Gerçekten neler ölçülür?

- **CDP GPU aygıt bilgileri ve WebGL etkin renderer**: Nvidia/AMD/Intel fiziksel GPU işareti, SwiftShader, WARP, Basic Render veya belirsiz GPU sınıfları ayrı raporlanır. Yalnız CDP listesinde RTX görünmesi, WebGL'nin gerçekten RTX ile çizildiğini kanıtlamaz. WebGL yazılımsal renderer ise kabul **reddedilir**. İsim tespiti yine son kullanıcı doğrulaması gerektirir.
- Gerçek fare kilidi ve **insanın bastığı Escape** sonucunda \`paused\` durumuna geçiş, kamerayı elle hareket ettirme kaydı.
- Maç boyunca yaklaşık beşer saniyelik **FPS ve %1 düşük FPS / p95 kare gecikmesi** örnekleri, WebGL context-loss, oyuncu ölüm sayacı, bot öldürme telemetrisi.
- Varsayılan **240 oyun saniyesi**, doğal altı botlu FFA, bitiş ekranı ve **7 sıralama satırı**. Birkaç saniyelik veriyle uzun maç kabul edilmez.
- **Yayın sınırı önceden onaylanmış değil:** Araç otomatik olarak “60 FPS geçti” veya “yayınla” kararı vermez. Rapor gözden geçirilecek, gerekli eşik ve sonuç kullanıcı tarafından onaylanacaktır.

## Arşivlenmiş CI denetimleri

GitHub Actions'ın Windows runner'ı bir **kişisel fiziksel GPU kabul cihazı değildir**. Bu yüzden [Windows hardware acceptance tools iş akışı](https://github.com/zxc28tarik/killtheking/actions/workflows/g54_windows_hardware_acceptance_tools.yml), **yalnız** Windows PowerShell dosyasının sözdizimini, Node.js modüllerinin sözdizimini, yazılımsal renderer ayrımını, gerçek süre kapsamını ve Escape olmadan başarı iddiasının önlenmesini test eder. CI sonuçları donanım ölçümü sayılmaz.

**Korunan oyun kararları:** FFA arena **bot okçusu** 0,5 saniye gerer; **oyuncunun normal yayı** ilk 2 saniye bırakılamaz, 3 saniyede tam güç olur; 4 saniyelik ok aralığı ve 1 saniyelik toparlanma, tüfek 15 saniyelik atış aralığı korunur. G5.4 ordu ayrı kalır.

## Açık kalan iş

Bu aracı çalıştıracak fiziksel Windows cihazına buradan erişimim yok. Dolayısıyla **gerçek GPU performansı, gerçek ESC ve kesintisiz 240 saniyelik gerçek render testini tamamlandı saymıyorum**. Kullanıcı raporu inceleyip onay vermedikçe **PR #48 taslak**, \`main\` değişmemiş ve oyun yayınlanmamış durumda kalacaktır.
