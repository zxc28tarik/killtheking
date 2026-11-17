#!/usr/bin/env python3
"""Record *honest* provenance for an existing repository-built HTML artifact.

This tool does not claim the artifact contains the later November G8.4 game.
It writes JSON only; it never modifies or executes the game's HTML.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path


def manifest_for(html: bytes, *, source_repo: str, source_sha: str, source_ref: str,
                 workflow_run_id: str) -> dict:
    if not isinstance(html, bytes) or not html:
        raise ValueError("Nonempty HTML bytes required")
    if not source_repo or not source_sha or not source_ref:
        raise ValueError("GitHub repository, SHA, and ref required")
    if len(source_sha) != 40 or any(ch not in "0123456789abcdefABCDEF" for ch in source_sha):
        raise ValueError("Expected a full 40-character commit SHA")
    if not workflow_run_id.isdecimal():
        raise ValueError("Workflow run ID must be numeric")
    return {
        "format": "killtheking-github-artifact-provenance-v1",
        "repository": source_repo,
        "source_commit": source_sha.lower(),
        "source_ref": source_ref,
        "workflow_run_id": workflow_run_id,
        "file_name": "KillTheKing_Oyna.html",
        "file_size_bytes": len(html),
        "file_sha256": hashlib.sha256(html).hexdigest(),
        "attested_game_version": None,
        "november_g8_4_gameplay_verified": False,
        "real_battle_tests_executed": False,
        "notice": "Built from checked-out repository source. Does not certify the missing November 2026 G8.4 game engine.",
    }


def main(argv=None, environ=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    env = os.environ if environ is None else environ
    try:
        b = args.html.read_bytes()
        metadata = manifest_for(b,
            source_repo=env.get("GITHUB_REPOSITORY", ""),
            source_sha=env.get("GITHUB_SHA", ""),
            source_ref=env.get("GITHUB_REF", ""),
            workflow_run_id=env.get("GITHUB_RUN_ID", ""))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except (OSError, ValueError) as exc:
        print("Cannot publish untraceable game build:", exc)
        return 2
    print("Built artifact provenance saved (G8.4 NOT verified):", args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
