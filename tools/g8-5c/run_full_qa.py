#!/usr/bin/env python3
"""Run the complete isolated G8.5 QA suite with no third-party packages.

These tests cover standalone tooling only, not the missing G8.4/G8.5 game.
Every suite has a known count so silent skipping cannot yield a green result.
"""
from __future__ import annotations

import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
NODE_SUITES = {
    "test_g8_5_reference.mjs": 37,
    "test_g8_5_audit.mjs": 14,
    "test_g8_5_panel.mjs": 6,
    "test_g8_5_report_adapter.mjs": 9,
    "test_g8_5_mirror_gate.mjs": 23,
    "test_g8_5c_live_telemetry.mjs": 30,
    "test_g8_5c_mirror_runner.mjs": 16,
    "test_g8_5c_start_layout_gate.mjs": 12,
    "test_g8_5d_seeded_mirror_start.mjs": 39,
    "test_g8_5e_decision_trace.mjs": 59,
    "test_g8_5e_panel_smoke.mjs": 10,
    "test_g8_5f_event_bridge.mjs": 30,
    "test_g8_5g_browser_finder.mjs": 20,
}
PYTHON_SUITES = {
    "test_g8_5f_source_gate.py": 22,
    "test_g8_5g_recovery_finder.py": 30,
}
EXPECTED = sum(NODE_SUITES.values()) + sum(PYTHON_SUITES.values())
PASS_RE = re.compile(r"(?<!\d)(\d+)/(\d+)(?=\s|$)")
UNITTEST_RE = re.compile(r"Ran (\d+) tests? in ")

def run_suite(runtime: str, file: str, expected: int) -> bool:
    path = ROOT / file
    if not path.is_file():
        print(f"FAIL {file}: expected test file is missing", flush=True)
        return False
    try:
        result = subprocess.run(
            [runtime, str(path)], cwd=ROOT, text=True, capture_output=True,
            timeout=70, check=False,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        print(f"FAIL {file}: could not execute tests: {exc}", flush=True)
        return False
    output = result.stdout + "\n" + result.stderr
    matches = PASS_RE.findall(output)
    if matches:
        actual, total = map(int, matches[-1])
    else:
        m = UNITTEST_RE.search(output)
        actual = total = int(m.group(1)) if m else -1
    passed = result.returncode == 0 and actual == expected and total == expected
    print(
        f"{'PASS' if passed else 'FAIL'} {file}: "
        f"{actual}/{total} (required {expected}; exit {result.returncode})",
        flush=True,
    )
    if not passed:
        print(output[-3500:], flush=True)
    return passed

def main() -> int:
    if EXPECTED != 357:
        print(f"FAIL expected baseline changed ({EXPECTED} tests; previously 357)")
        return 2
    node = shutil.which("node")
    if not node:
        print("FAIL: Node.js must be installed; use Node 22 or newer")
        return 2
    status = []
    for path, num in NODE_SUITES.items():
        status.append(run_suite(node, path, num))
    for path, num in PYTHON_SUITES.items():
        status.append(run_suite(sys.executable, path, num))
    if all(status):
        print(f"{EXPECTED}/{EXPECTED} isolated QA checks PASS across {len(status)} suites")
        print("LIMITATION: 0/144 real battles; no production G8.4/G8.5 gameplay integration tested")
        return 0
    print("FAIL: at least one independent QA suite failed or did not execute")
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
