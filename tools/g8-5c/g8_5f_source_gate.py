#!/usr/bin/env python3
"""Read-only recovery gate for a possible Kill the King G8.4/G8.5 HTML.

This tool NEVER edits input files or treats string heuristics as game-version proof.
Syntax checks parse scripts; they do not execute the game. ZIP comparison is optional.

Usage: python g8_5f_source_gate.py /path/to/playable.html [--zip /path/to/sources.zip] [--json path]
Return codes: 0 = candidate_for_manual_review, 3 = insufficient_version_evidence, 2 = invalid/broken file.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, subprocess, sys, tempfile, zipfile
from pathlib import Path
from html.parser import HTMLParser

MAX_HTML_BYTES = 30 * 1024 * 1024
MAX_ZIP_MEMBER = 60 * 1024 * 1024
MAX_ZIP_TOTAL = 120 * 1024 * 1024

class ScriptParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.scripts=[];self.current=None
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'script':
            d=dict(attrs);self.current={'attrs':d,'text':''}
    def handle_data(self, data):
        if self.current is not None:self.current['text'] += data
    def handle_endtag(self, tag):
        if tag.lower() == 'script' and self.current is not None:
            self.scripts.append(self.current);self.current=None

def sha256(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def analyze_html(src:bytes, *,node='node')->dict:
    if not src or len(src)>MAX_HTML_BYTES:raise ValueError('HTML missing or exceeds 30 MB safety cap')
    text=src.decode('utf-8-sig', errors='replace')
    if '<html' not in text.lower() or '<script' not in text.lower():raise ValueError('HTML requires <html> and <script>')
    parser=ScriptParser();parser.feed(text);parser.close()
    scripts=parser.scripts
    if not scripts:raise ValueError('No JavaScript tags in HTML')
    inline=[s for s in scripts if not s['attrs'].get('src') and s['attrs'].get('type','').lower() in ('','text/javascript','module','application/javascript')]
    if not inline:raise ValueError('No embedded JavaScript; cannot verify offline game code')
    failures=[]
    for i,s in enumerate(inline):
        if not s['text'].strip():continue
        with tempfile.NamedTemporaryFile('w',suffix='.mjs' if s['attrs'].get('type')=='module' else '.js',encoding='utf-8',delete=False) as f:
            f.write(s['text']);tmp=f.name
        try:
            p=subprocess.run([node,'--check',tmp],capture_output=True,text=True,timeout=15)
            if p.returncode:failures.append({'script_index':i,'error':(p.stderr or p.stdout)[-800:]})
        except (OSError,subprocess.TimeoutExpired) as exc:
            failures.append({'script_index':i,'error':'JS syntax check unavailable: '+str(exc)})
        finally:
            os.unlink(tmp)
    code='\n'.join(s['text'] for s in inline)
    signatures={
      'army_engine':bool(re.search(r'\bArenaArmyBattle\b|\b(?:createArmyBattle|updateArmyBattle|meadowBattleState)\b',code)),
      'g8_version_tag':bool(re.search(r'\bG8[._ -]?[45](?:[A-Z])?\b',text,flags=re.I)),
      'supply_line_logic_candidate':bool(re.search(r'\bsupply_line\b|\bsupplyLine\b|\bikmalHatt[iı]\b',code,flags=re.I)),
      'supply_label':bool(re.search(r'İkmal Hattı|Ikmal Hatti|Supply Line',text,flags=re.I)),
      'battle_report_candidate':bool(re.search(r'\bbattleReport\b|\b(?:savasRaporu|savaşRaporu|reportBattle)\b',code,flags=re.I)),
    }
    # A source can have different internal symbol names: no regex gate proves a runtime feature.
    # Require evidence of both an army engine and a supply-line game feature to avoid G5.x downgrade.
    candidate=signatures['army_engine'] and (signatures['supply_line_logic_candidate'] or (signatures['g8_version_tag'] and signatures['supply_label']))
    return {'sha256':sha256(src),'size_bytes':len(src),'embedded_script_count':len(inline),
      'external_script_refs':[s['attrs']['src'] for s in scripts if s['attrs'].get('src')],
      'js_syntax_check': 'pass' if not failures else 'fail', 'script_failures':failures,
      'signatures':signatures, 'candidate_for_review':candidate}

def analyze_zip(path:Path,html_bytes:bytes,html_name:str)->dict:
    if not zipfile.is_zipfile(path):raise ValueError('ZIP is invalid')
    members=[]; html_matches=[];exact_matches=[];total=0
    with zipfile.ZipFile(path) as z:
        for x in z.infolist():
            name=x.filename.replace('\\','/')
            if name.startswith('/') or '..' in name.split('/') or ':' in name.split('/')[0]:
                raise ValueError('Unsafe ZIP path: '+name)
            if x.file_size>MAX_ZIP_MEMBER:raise ValueError('Unsafe ZIP member size: '+name)
            total+=x.file_size
            if total>MAX_ZIP_TOTAL:raise ValueError('ZIP uncompressed content exceeds cap')
            if x.is_dir():continue
            members.append({'name':name,'bytes':x.file_size})
            if name.lower().endswith(('.htm','.html')):
                entry=z.read(x)
                html_matches.append(name)
                if entry == html_bytes:exact_matches.append(name)
    matching_named=[x for x in html_matches if Path(x).name.lower()==html_name.lower()]
    # Only enforce integrity mismatch when a same-named file was found in the ZIP;
    # other ZIPs might simply hold source modules without a built HTML.
    mismatch=bool(matching_named and not any(x in exact_matches for x in matching_named))
    return {'zip_sha256':sha256(path.read_bytes()),'member_count':len(members),
      'html_members':html_matches,'exact_html_matches':exact_matches,
      'same_named_html_mismatch':mismatch,
      'note':'No HTML copy in ZIP is not proof of missing source; may contain modules only.'}

def run(path:Path, zip_path:Path|None=None, *, node='node')->dict:
    if not path.is_file(): raise ValueError('HTML not found: '+str(path))
    result=analyze_html(path.read_bytes(),node=node)
    result['input_html']=path.name
    if zip_path:
        if not zip_path.is_file():raise ValueError('ZIP not found: '+str(zip_path))
        result['source_zip']=analyze_zip(zip_path,path.read_bytes(),path.name)
    if result['js_syntax_check']=='fail' or result.get('source_zip',{}).get('same_named_html_mismatch'):
        status='invalid_or_mismatched_source'
    elif not result['candidate_for_review']:
        status='insufficient_G8_source_evidence'
    else:
        status='candidate_for_manual_review'
    result['status']=status
    result['game_integrated']=False
    result['production_tests_run']=0
    result['warning']='Feature string matches and parse checks do NOT prove this is the accepted playable G8.4/G8.5 game.'
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('html',type=Path);parser.add_argument('--zip',type=Path,dest='zip_path');parser.add_argument('--json',type=Path,dest='json_path');parser.add_argument('--node',default='node')
    args=parser.parse_args()
    try: result=run(args.html,args.zip_path,node=args.node)
    except Exception as exc:
        result={'status':'invalid_or_mismatched_source','error':str(exc),'game_integrated':False,'production_tests_run':0}
    output=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    if args.json_path:args.json_path.write_text(output,encoding='utf-8')
    print(output)
    return 0 if result['status']=='candidate_for_manual_review' else 3 if result['status']=='insufficient_G8_source_evidence' else 2
if __name__=='__main__':raise SystemExit(main())
