#!/usr/bin/env python3
"""Local/read-only finder for the missing November 2026 Kill the King G8.4 game.

Scans user-supplied folders (or common Windows Downloads/Desktop/Documents paths)
for plausible game HTML and source ZIP archives. It never modifies, opens in a
browser, uploads or executes a candidate; all reports stay on the user's PC.

Usage:
 python g8_5g_recovery_finder.py --scan "$HOME/Downloads" --json recovery.json
 python g8_5g_recovery_finder.py --scan /some/folder --max-files 10000

Exit: 0 candidate found, 3 no acceptable candidate, 2 scan failed / bad args.
Finding a file is NOT provenance or game-feature proof. User still reviews it.
"""
from __future__ import annotations
import argparse
from collections import deque
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
from typing import Any

from g8_5f_source_gate import analyze_html, analyze_zip, MAX_HTML_BYTES

MAX_SCAN_FILES = 40000
MAX_CANDIDATES = 30
MAX_DEPTH = 7
GAME_PATTERN = re.compile(r'(kill[ _.-]*the[ _.-]*king|killtheking|ikmal[ _.-]*hatt|g8[ _.-]?[45])',re.I)
SOURCE_PATTERN = re.compile(r'(kaynak[ _.-]*kod|source|sources|src|g8[ _.-]?[45])',re.I)
CANONICAL_HTML = 'KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html'
CANONICAL_ZIP = 'KillTheKing_G8_4_KaynakKod.zip'


def default_roots(home: Path | None = None) -> list[Path]:
    h = home or Path.home()
    roots = [h/'Downloads', h/'Desktop', h/'Documents', h/'OneDrive'/'Downloads', h/'OneDrive'/'Desktop', h/'OneDrive'/'Documents']
    return [p for p in roots if p.is_dir() and not p.is_symlink()]


def checksum(path:Path,chunk=1024*1024)->str:
    sha=hashlib.sha256()
    with path.open('rb') as f:
        while True:
            data=f.read(chunk)
            if not data:break
            sha.update(data)
    return sha.hexdigest()


def walk_candidates(roots:list[Path],*,max_files:int=MAX_SCAN_FILES,max_depth:int=MAX_DEPTH)->tuple[list[Path],dict[str, Any]]:
    if not isinstance(max_files,int) or not 1<=max_files<=MAX_SCAN_FILES:raise ValueError('max_files must be 1..40000')
    if not isinstance(max_depth,int) or not 0<=max_depth<=MAX_DEPTH:raise ValueError('max_depth must be 0..7')
    todo=deque((p,0) for p in roots)
    visited_dirs=set(); candidates=[];count=0;missing=[];unreadable=[]
    while todo and count<max_files:
        folder,depth=todo.popleft()
        if folder.is_symlink():continue
        if not folder.is_dir():missing.append(str(folder));continue
        try:
            inode=folder.stat()
            key=(inode.st_dev,inode.st_ino)
            if key in visited_dirs:continue
            visited_dirs.add(key)
            children=list(folder.iterdir())
        except OSError:
            unreadable.append(str(folder));continue
        # Sort by name, keeping discovery deterministic across filesystems.
        children.sort(key=lambda p:p.name.casefold())
        for path in children:
            if count>=max_files:break
            if path.is_symlink():continue
            count+=1
            try:
                if path.is_dir():
                    if depth<max_depth:todo.append((path,depth+1))
                    continue
                if path.is_file() and path.suffix.lower() in ('.html','.htm','.zip') and GAME_PATTERN.search(path.name):
                    candidates.append(path)
            except OSError:continue
    return candidates,{'files_seen':count,'folders_seen':len(visited_dirs),'scan_truncated':bool(todo or count>=max_files),
        'missing_roots':missing,'unreadable_folders_count':len(unreadable)}


def check_files(paths:list[Path], *, node:str='node', limit:int=MAX_CANDIDATES)->list[dict[str, Any]]:
    if not 1<=limit<=MAX_CANDIDATES:raise ValueError('candidate limit must be 1..30')
    # Newest first; identical timestamps sort by normalized absolute path.
    ranked=[]
    for path in paths:
        try:
            st=path.stat()
            if not path.is_file():continue
            if st.st_size>MAX_HTML_BYTES and path.suffix.lower() in ('.html','.htm'):continue
            priority=(15 if path.name.lower()==CANONICAL_HTML.lower() else 10 if path.name.lower()==CANONICAL_ZIP.lower() else
                6 if re.search(r'g8[ _.-]?[45]',path.name,re.I) else 3)
            ranked.append((priority,st.st_mtime,path))
        except OSError:continue
    ranked.sort(key=lambda tup:(-tup[0],-tup[1],str(tup[2]).casefold()))
    rows=[]
    for priority,ts,path in ranked[:limit]:
        row={'path':str(path),'file_name':path.name,'kind':path.suffix.lower().lstrip('.'),
            'size_bytes':path.stat().st_size,'mtime_utc':datetime.fromtimestamp(ts,timezone.utc).isoformat(),
            'name_priority':priority,'status':'unreviewed'}
        try:
            row['sha256']=checksum(path)
            if row['kind'] in ('html','htm'):
                details=analyze_html(path.read_bytes(),node=node)
                row['signatures']=details['signatures']
                row['script_syntax']=details['js_syntax_check']
                row['status']='candidate_for_manual_review' if details['candidate_for_review'] and details['js_syntax_check']=='pass' else 'insufficient_or_invalid'
                if details['script_failures']:
                    row['script_check_errors']=[d['error'][-250:] for d in details['script_failures'][:3]]
            elif row['kind']=='zip':
                row['status']='possible_source_archive'
        except (OSError,ValueError,UnicodeError) as exc:
            row['status']='unreadable_or_invalid';row['error']=str(exc)[:400]
        rows.append(row)
    return rows


def pair_source_archives(rows:list[dict[str,Any]])->list[dict[str,Any]]:
    html_rows=[r for r in rows if r['kind'] in ('html','htm') and r.get('status')=='candidate_for_manual_review']
    archives=[r for r in rows if r['kind']=='zip' and r.get('status')=='possible_source_archive']
    out=[]
    for html in html_rows:
        archive_rows=sorted(archives,key=lambda r:(0 if Path(r['path']).parent==Path(html['path']).parent else 1,
                                                      0 if SOURCE_PATTERN.search(r['file_name']) else 1,
                                                      r['file_name']))
        for arch in archive_rows[:3]:
            try:
                report=analyze_zip(Path(arch['path']),Path(html['path']).read_bytes(),html['file_name'])
                integrity='mismatch' if report['same_named_html_mismatch'] else 'exact_html_match' if report['exact_html_matches'] else 'unproven_source_pair'
                out.append({'html_path':html['path'],'zip_path':arch['path'],'integrity':integrity,
                    'matches':report['exact_html_matches'],'same_named_mismatch':report['same_named_html_mismatch']})
            except Exception as exc:
                out.append({'html_path':html['path'],'zip_path':arch['path'],'integrity':'invalid_archive','error':str(exc)[:400]})
    return out


def scan(roots:list[Path],*,max_files=MAX_SCAN_FILES,max_depth=MAX_DEPTH,node='node')->dict[str, Any]:
    candidates,discovery=walk_candidates(roots,max_files=max_files,max_depth=max_depth)
    rows=check_files(candidates,node=node)
    pairs=pair_source_archives(rows)
    valid=[r for r in rows if r['status']=='candidate_for_manual_review']
    return {'tool':'G8.5G read-only local source finder v1','scanned_roots':[str(p) for p in roots],
        'discovery':{**discovery,'matching_filenames':len(candidates),'evaluated_candidates':len(rows)},
        'status':'candidates_for_manual_review' if valid else 'source_not_found_or_not_verified',
        'html_candidates':rows,'zip_pair_checks':pairs,
        'reminder':'A matching filename or script signature does NOT prove this is the latest accepted playable G8.4/G8.5. No files are uploaded or modified. Never replace the current game without reviewing source and regressions.',
        'production_battles_run':0}


def main(argv:list[str]|None=None)->int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scan',type=Path,action='append',default=[])
    parser.add_argument('--json',type=Path,default=None)
    parser.add_argument('--node',default='node')
    parser.add_argument('--max-files',type=int,default=MAX_SCAN_FILES)
    parser.add_argument('--max-depth',type=int,default=MAX_DEPTH)
    args=parser.parse_args(argv)
    try:
        roots=args.scan or default_roots()
        if not roots:raise ValueError('No existing default folders; pass --scan /folder')
        report=scan(roots,max_files=args.max_files,max_depth=args.max_depth,node=args.node)
        value=json.dumps(report,indent=2,ensure_ascii=False)+'\n'
        if args.json:
            args.json.parent.mkdir(parents=True,exist_ok=True)
            args.json.write_text(value,encoding='utf-8')
        print(value)
        return 0 if report['status']=='candidates_for_manual_review' else 3
    except Exception as exc:
        print('Scan error: '+str(exc),file=sys.stderr)
        return 2

if __name__=='__main__':raise SystemExit(main())
