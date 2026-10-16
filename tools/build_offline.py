#!/usr/bin/env python3
"""Build standalone offline playable HTML from the EXACT committed source files.

Usage: python3 tools/build_offline.py --out dist/KillTheKing_Oyna.html
"""
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = re.compile(r'<script src="([^"]+\.js)"></script>')
CSS = re.compile(r'<link rel="stylesheet" href="([^"]+\.css)">')

ERROR_DIAGNOSTIC = """<script>
window.addEventListener('error', function(event) {
  const message = String((event.error && event.error.message) || event.message || '');
  if (!/WebGL context|THREE.WebGLRenderer|ReferenceError|is not defined/i.test(message)) return;
  if (document.getElementById('ktk-startup-error')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ktk-startup-error';
  overlay.setAttribute('role', 'alert');
  overlay.style.cssText = 'position:fixed;z-index:999999;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,calc(100% - 32px));background:#141a2c;color:white;border:2px solid #f59e0b;padding:24px;border-radius:12px;font:16px/1.6 system-ui';
  const title = document.createElement('strong');
  title.textContent = 'Kill the King — Oyun başlatılamadı';
  const info = document.createElement('p');
  info.textContent = /WebGL/i.test(message) ?
    '3B grafik başlatılamadı. HTML dosyasını indirip güncel Chrome veya Edge ile açın ve donanım hızlandırmasını etkinleştirin.' :
    'Bir oyun kodu hatası oluştu. GitHub’daki en güncel oynanabilir HTML sürümünü deneyin.';
  const details = document.createElement('code');
  details.textContent = message.slice(0, 400);
  overlay.append(title, info, details);
  document.body.appendChild(overlay);
});
</script>"""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="dist/KillTheKing_Oyna.html")
    args = parser.parse_args()
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    count_js, count_css = 0, 0

    def embed_js(match):
        nonlocal count_js
        name = match.group(1)
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise RuntimeError("Missing/outside repository source: " + name)
        code = path.read_text(encoding="utf-8")
        if re.search(r"</script", code, flags=re.I):
            raise RuntimeError("Unexpected HTML close marker in script: " + name)
        count_js += 1
        return "<script>\n" + code + "\n</script>"

    def embed_css(match):
        nonlocal count_css
        name = match.group(1)
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise RuntimeError("Missing/outside repository stylesheet: " + name)
        count_css += 1
        return "<style>\n" + path.read_text(encoding="utf-8") + "\n</style>"

    source = JS.sub(embed_js, source)
    source = CSS.sub(embed_css, source)
    if count_js < 11 or count_css < 1:
        raise RuntimeError(f"Unexpected dependency count (JS {count_js}, CSS {count_css})")
    if re.search(r'<script\s+src=|<link\s+rel="stylesheet"\s+href="styles/', source):
        raise RuntimeError("Unbundled local source dependency remains")
    match = re.search(r"<body\b[^>]*>", source)
    if not match:
        raise RuntimeError("Missing HTML body")
    source = source[:match.end()] + "\n" + ERROR_DIAGNOSTIC + source[match.end():]

    out = (ROOT / args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(source, encoding="utf-8")
    print(f"Built {out} from {count_js} committed scripts, {count_css} CSS file(s); bytes={out.stat().st_size}")

if __name__ == "__main__":
    main()
