#!/usr/bin/env python3
"""Focused regression tests for GitHub artifact provenance."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from g8_5i_ci_build_manifest import manifest_for, main

SHA="291b9b8575160666a8d2da9c2abbe43814083a2c"
ENV={"GITHUB_REPOSITORY":"zxc28tarik/killtheking","GITHUB_SHA":SHA,
     "GITHUB_REF":"refs/heads/codex/a5-meadow-twentyfold-area","GITHUB_RUN_ID":"39158281628"}
class ArtifactManifestTest(unittest.TestCase):
    def test_hash_and_commit_exact(self):
        m=manifest_for(b"<html/>",source_repo=ENV["GITHUB_REPOSITORY"],source_sha=SHA,
                       source_ref=ENV["GITHUB_REF"],workflow_run_id=ENV["GITHUB_RUN_ID"])
        self.assertEqual(m["file_sha256"],hashlib.sha256(b"<html/>").hexdigest())
        self.assertEqual(m["source_commit"],SHA)
        self.assertEqual(m["file_size_bytes"],7)
        self.assertFalse(m["november_g8_4_gameplay_verified"])
        self.assertFalse(m["real_battle_tests_executed"])
        self.assertIsNone(m["attested_game_version"])
    def test_uppercase_sha_normalized(self):
        m=manifest_for(b"a",source_repo="x/y",source_sha=SHA.upper(),
                       source_ref="refs/heads/main",workflow_run_id="42")
        self.assertEqual(m["source_commit"],SHA)
    def test_empty_html_rejected(self):
        with self.assertRaisesRegex(ValueError,"Nonempty"):
            manifest_for(b"",source_repo="x/y",source_sha=SHA,source_ref="refs/heads/main",workflow_run_id="4")
    def test_missing_repository_rejected(self):
        with self.assertRaises(ValueError):
            manifest_for(b"a",source_repo="",source_sha=SHA,source_ref="refs/heads/main",workflow_run_id="4")
    def test_bad_sha_rejected(self):
        with self.assertRaises(ValueError):
            manifest_for(b"a",source_repo="x/y",source_sha="123",source_ref="refs/heads/main",workflow_run_id="4")
    def test_bad_run_id_rejected(self):
        with self.assertRaises(ValueError):
            manifest_for(b"a",source_repo="x/y",source_sha=SHA,source_ref="refs/heads/main",workflow_run_id="x")
    def test_deterministic_serialization(self):
        args=dict(source_repo="x/y",source_sha=SHA,source_ref="refs/heads/main",workflow_run_id="4")
        self.assertEqual(manifest_for(b"a",**args),manifest_for(b"a",**args))
    def test_cli_output_and_filename(self):
        with tempfile.TemporaryDirectory() as d:
            src=Path(d)/"KillTheKing_Oyna.html"
            output=Path(d)/"nested"/"build-provenance.json"
            src.write_bytes(b"<!doctype html>\n<script>const a=1;</script>")
            self.assertEqual(main(["--html",str(src),"--output",str(output)],ENV),0)
            row=json.loads(output.read_text(encoding="utf8"))
            self.assertEqual(row["source_commit"],SHA)
            self.assertEqual(row["file_sha256"],hashlib.sha256(src.read_bytes()).hexdigest())
    def test_cli_refuses_missing_source_commit(self):
        with tempfile.TemporaryDirectory() as d:
            src=Path(d)/"test.html";src.write_bytes(b"ok")
            out=Path(d)/"trace.json"
            bad={**ENV,"GITHUB_SHA":""}
            self.assertEqual(main(["--html",str(src),"--output",str(out)],bad),2)
            self.assertFalse(out.exists())

if __name__=="__main__":
    unittest.main(verbosity=2)
