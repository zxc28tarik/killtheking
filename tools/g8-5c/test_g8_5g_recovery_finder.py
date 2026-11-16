import json
import os
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from g8_5g_recovery_finder import (default_roots,walk_candidates,check_files,pair_source_archives,
                                    scan,checksum,main,CANONICAL_HTML,CANONICAL_ZIP)

ACCEPTED = b'<html><body><script>const ArenaArmyBattle = {}; const demo = "supply_line";</script></body></html>'
OLD = b'<html><body><script>const ArenaArmyBattle = {};</script></body></html>'
INVALID = b'<html><body><script>function nope( {</script></body></html>'

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
    def file(self,name,content):
        p=self.root/name;p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(content);return p
    def archive(self, name, entries):
        p=self.root/name;p.parent.mkdir(exist_ok=True,parents=True)
        with zipfile.ZipFile(p,'w') as z:
            for fname,content in entries.items():z.writestr(fname,content)
        return p
    def test_01_empty_directory(self):
        self.assertEqual(scan([self.root])['status'],'source_not_found_or_not_verified')
    def test_02_expected_filename(self):
        p=self.file(CANONICAL_HTML,ACCEPTED)
        self.assertEqual(scan([self.root])['html_candidates'][0]['file_name'],p.name)
    def test_03_old_game_not_accepted(self):
        self.file('KillTheKing_G5_4.html',OLD)
        r=scan([self.root]);self.assertEqual(r['status'],'source_not_found_or_not_verified')
    def test_04_modern_name_not_sufficient(self):
        self.file(CANONICAL_HTML,OLD)
        self.assertEqual(scan([self.root])['status'],'source_not_found_or_not_verified')
    def test_05_valid_code_candidate(self):
        self.file('KillTheKing_G8_5.html',ACCEPTED)
        self.assertEqual(scan([self.root])['status'],'candidates_for_manual_review')
    def test_06_bad_js_not_accepted(self):
        self.file(CANONICAL_HTML,INVALID)
        self.assertEqual(scan([self.root])['status'],'source_not_found_or_not_verified')
    def test_07_unrelated_html_skipped(self):
        self.file('unrelated.html',ACCEPTED)
        self.assertEqual(scan([self.root])['discovery']['matching_filenames'],0)
    def test_08_case_insensitive(self):
        self.file('KILLTHEKING_G8_4.HTML',ACCEPTED)
        self.assertEqual(scan([self.root])['status'],'candidates_for_manual_review')
    def test_09_nested_path(self):
        self.file('sub/deeper/KillTheKing_G8_4.html',ACCEPTED)
        self.assertEqual(scan([self.root])['status'],'candidates_for_manual_review')
    def test_10_depth_guard(self):
        self.file('sub/deeper/KillTheKing_G8_4.html',ACCEPTED)
        self.assertEqual(scan([self.root],max_depth=0)['discovery']['matching_filenames'],0)
    def test_11_file_limit(self):
        for name in ('A.txt','B.txt','C.txt'):
            self.file(name,b'x')
        r=scan([self.root],max_files=1)
        self.assertTrue(r['discovery']['scan_truncated'])
    def test_12_bad_maxfiles(self):
        with self.assertRaisesRegex(ValueError,'max_files'):walk_candidates([self.root],max_files=0)
    def test_13_bad_depth(self):
        with self.assertRaisesRegex(ValueError,'max_depth'):walk_candidates([self.root],max_depth=8)
    def test_14_sha256_exists(self):
        p=self.file(CANONICAL_HTML,ACCEPTED)
        self.assertEqual(checksum(p),__import__('hashlib').sha256(ACCEPTED).hexdigest())
    def test_15_matching_html_in_zip(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        self.archive(CANONICAL_ZIP,{CANONICAL_HTML:ACCEPTED})
        r=scan([self.root]);self.assertTrue(any(p['integrity']=='exact_html_match' for p in r['zip_pair_checks']))
    def test_16_mismatched_html_detected(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        self.archive(CANONICAL_ZIP,{CANONICAL_HTML:b'<html>different</html>'})
        r=scan([self.root]);self.assertTrue(any(p['integrity']=='mismatch' for p in r['zip_pair_checks']))
    def test_17_source_only_archive_not_false_certified(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        self.archive(CANONICAL_ZIP,{'src/app.js':b'console.log(2);'})
        r=scan([self.root]);self.assertTrue(any(p['integrity']=='unproven_source_pair' for p in r['zip_pair_checks']))
    def test_18_corrupt_zip(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        self.file(CANONICAL_ZIP,b'Not a zip')
        r=scan([self.root]);self.assertTrue(any(p['integrity']=='invalid_archive' for p in r['zip_pair_checks']))
    def test_19_zip_only_not_sufficient(self):
        self.archive(CANONICAL_ZIP,{'src/app.js':b'const foo=2;'})
        self.assertEqual(scan([self.root])['status'],'source_not_found_or_not_verified')
    def test_20_symlink_not_followed(self):
        target=self.file('separate/KillTheKing_G8_4.html',ACCEPTED)
        link=self.root/'game.html'
        try:link.symlink_to(target)
        except (OSError,NotImplementedError):self.skipTest('symlink unsupported')
        result,_=walk_candidates([self.root],max_depth=0)
        self.assertEqual(result,[])
    def test_21_default_paths_only_existing(self):
        self.file('Downloads/x.txt',b'x')
        self.assertEqual(default_roots(self.root),[self.root/'Downloads'])
    def test_22_cli_json_report(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        out=self.root/'report.json'
        with patch('builtins.print'):
            code=main(['--scan',str(self.root),'--json',str(out)])
        self.assertEqual(code,0)
        self.assertEqual(json.loads(out.read_text(encoding='utf8'))['status'],'candidates_for_manual_review')
    def test_23_cli_no_candidate_exit3(self):
        with patch('builtins.print'):
            self.assertEqual(main(['--scan',str(self.root)]),3)
    def test_24_cli_invalid_depth_exit2(self):
        with patch('builtins.print'):
            self.assertEqual(main(['--scan',str(self.root),'--max-depth','10']),2)
    def test_25_multiple_roots_de_dupe(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        r=scan([self.root,self.root]);self.assertEqual(r['discovery']['matching_filenames'],1)
    def test_26_does_not_modify_input(self):
        p=self.file(CANONICAL_HTML,ACCEPTED)
        st=p.stat();scan([self.root]);self.assertEqual(p.read_bytes(),ACCEPTED);self.assertEqual(p.stat().st_mtime_ns,st.st_mtime_ns)
    def test_27_never_claims_production(self):
        self.file(CANONICAL_HTML,ACCEPTED)
        r=scan([self.root]);self.assertEqual(r['production_battles_run'],0)
        self.assertIn('NOT prove',r['reminder'])
    def test_28_excess_scan_capped(self):
        with self.assertRaisesRegex(ValueError,'max_files'):walk_candidates([self.root],max_files=40001)
    def test_29_filename_priority_before_mtime(self):
        a=self.file(CANONICAL_HTML,ACCEPTED)
        b=self.file('KillTheKing_misc.html',ACCEPTED)
        os.utime(a,(100,100));os.utime(b,(200,200))
        self.assertEqual(check_files([a,b])[0]['file_name'],CANONICAL_HTML)
    def test_30_distinct_subfolders(self):
        self.file('Downloads/KillTheKing_G8_4.html',ACCEPTED)
        self.file('Desktop/KillTheKing_G8_5.html',ACCEPTED)
        r=scan([self.root]);self.assertEqual(r['discovery']['matching_filenames'],2)

if __name__=='__main__': unittest.main()
