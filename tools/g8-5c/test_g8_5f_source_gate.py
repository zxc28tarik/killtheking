#!/usr/bin/env python3
import tempfile,zipfile,unittest,json
from pathlib import Path
from g8_5f_source_gate import analyze_html,analyze_zip,run,MAX_HTML_BYTES

G8 = '''<!DOCTYPE html><html lang="tr"><head><title>Kill The King G8.4</title></head><body>
<script>const ArenaArmyBattle = Object.freeze({}); const activeMode='supply_line';let battleReport={};</script>
</body></html>'''.encode()
OLD = '''<!DOCTYPE html><html><script>const ArenaArmyBattle={};const old='G5.4';</script></html>'''.encode()
BAD = b'<!DOCTYPE html><html><script>const ArenaArmyBattle = ; const supply_line = true;</script></html>'

class GateTests(unittest.TestCase):
  def setUp(self):
    self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  def tearDown(self):self.tmp.cleanup()
  def html(self,content=G8,name='KillTheKing_G8_4_Oyna.html'):
    p=self.root/name;p.write_bytes(content);return p
  def zip(self,files):
    p=self.root/'source.zip'
    with zipfile.ZipFile(p,'w') as z:
      for n,v in files.items():z.writestr(n,v)
    return p
  def test_01_candidate_stays_manual_review(self):
    self.assertEqual(run(self.html())['status'],'candidate_for_manual_review')
  def test_02_old_g54_is_rejected(self):
    self.assertEqual(run(self.html(OLD))['status'],'insufficient_G8_source_evidence')
  def test_03_no_game_integrated_claim(self):
    self.assertFalse(run(self.html())['game_integrated'])
  def test_04_zero_production_tests(self):
    self.assertEqual(run(self.html())['production_tests_run'],0)
  def test_05_sha256_matches(self):
    import hashlib
    self.assertEqual(analyze_html(G8)['sha256'],hashlib.sha256(G8).hexdigest())
  def test_06_detect_army_engine(self):
    self.assertTrue(analyze_html(G8)['signatures']['army_engine'])
  def test_07_detect_supply_logic(self):
    self.assertTrue(analyze_html(G8)['signatures']['supply_line_logic_candidate'])
  def test_08_node_syntax_error_blocks(self):
    self.assertEqual(run(self.html(BAD))['status'],'invalid_or_mismatched_source')
  def test_09_requires_html_script(self):
    with self.assertRaisesRegex(ValueError,'<script>'):
      analyze_html(b'<html><body>No script</body></html>')
  def test_10_reject_empty(self):
    with self.assertRaises(ValueError):analyze_html(b'')
  def test_11_reject_oversize(self):
    with self.assertRaises(ValueError):analyze_html(b'x'*(MAX_HTML_BYTES+1))
  def test_12_zip_exact_html_match(self):
    p=self.html();z=self.zip({p.name:G8,'modules/army.js':b'const x=1;'});r=run(p,z)
    self.assertEqual(r['status'],'candidate_for_manual_review');self.assertIn(p.name,r['source_zip']['exact_html_matches'])
  def test_13_zip_same_name_mismatch_blocks(self):
    p=self.html();z=self.zip({p.name:OLD});self.assertEqual(run(p,z)['status'],'invalid_or_mismatched_source')
  def test_14_zip_source_modules_only_allowed(self):
    p=self.html();z=self.zip({'src/battle.js':b'const x=1;'});self.assertEqual(run(p,z)['status'],'candidate_for_manual_review')
  def test_15_zip_path_traversal_blocked(self):
    p=self.html();z=self.zip({'../unsafe.js':b'bad'});
    with self.assertRaisesRegex(ValueError,'Unsafe ZIP path'):analyze_zip(z,G8,p.name)
  def test_16_missing_zip_blocks(self):
    with self.assertRaisesRegex(ValueError,'ZIP not found'):run(self.html(),self.root/'missing.zip')
  def test_17_missing_html_blocks(self):
    with self.assertRaisesRegex(ValueError,'HTML not found'):run(self.root/'missing.html')
  def test_18_no_js_embed_blocks(self):
    with self.assertRaisesRegex(ValueError,'No embedded JavaScript'):analyze_html(b'<html><script src="game.js"></script></html>')
  def test_19_reports_external_script_refs(self):
    r=analyze_html(b'<html><script src="https://example.com/a.js"></script><script>const ArenaArmyBattle={};const supply_line=true;</script></html>')
    self.assertEqual(r['external_script_refs'],['https://example.com/a.js'])
  def test_20_includes_code_signatures_not_just_label(self):
    b=b'<html><body>G8.4 Ikmal Hatti<script>const foo=12;</script></body></html>'
    self.assertEqual(run(self.html(b))['status'],'insufficient_G8_source_evidence')
  def test_21_reject_invalid_zip(self):
    p=self.html();z=self.root/'source.zip';z.write_text('corrupt')
    with self.assertRaisesRegex(ValueError,'ZIP is invalid'):analyze_zip(z,G8,p.name)
  def test_22_report_does_not_claim_production(self):
    self.assertIn('NOT prove',run(self.html())['warning'])

if __name__=='__main__':
  result=unittest.TextTestRunner(verbosity=0).run(unittest.defaultTestLoader.loadTestsFromTestCase(GateTests))
  print(f'{result.testsRun-result.failures.__len__()-result.errors.__len__()}/{result.testsRun} G8.5F source recovery gate tests '+('PASS' if result.wasSuccessful() else 'FAIL')+' (synthetic sources, not production)')
  raise SystemExit(0 if result.wasSuccessful() else 1)
