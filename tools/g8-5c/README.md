# Kill the King — G8.5C production telemetry / mirror QA

**Isolated QA tooling; NOT a new playable G8.4/G8.5 build.**

## What is here

- `g8_5c_live_telemetry.mjs`: opt-in real-match telemetry recorder with required outcome fields, bounded frame sampling, strict metadata, NDJSON export; never mutates gameplay.
- `g8_5c_mirror_runner.mjs`: 144 proposed mirrored battle calls across `classic`, `control_points`, `supply_line` × 140/200/280 soldiers × 8 paired seeds; cannot run without a real engine callback.
- `g8_5c_start_layout_gate.mjs`: confirms real starting soldier positions swapped between teams, rather than simply swapping labels.
- `analyze_g8_5_runs.mjs` and `g8_5_mirror_gate.mjs`: source/seed/coverage/score-side-bias QA from previous G8.5B work.
- `g8_5c_manifest_cli.mjs`: lists proposed run requests only, does not fabricate actual results.

## Important status

The playable **G8.4/G8.5** HTML/ZIP produced November 16 was not accessible in the current session. GitHub `main` and existing October feature branches predate it. **Do not wire this into old G5 or claim game integration.** This toolset remains isolated on its own draft branch.

The complete offline QA ZIP produced in the conversation also includes fixture tests: **147/147 independent QA tests passed**. Those are NOT the **388 previously reported production tests**, 144 actual WebGL battle replays or a performance acceptance.

## Integration contract

Connect only after source restoration. On battle start, capture real scenario, roster size, deterministic seed, mirror-seed pairing and game build; after real team placement, capture each team’s starting `[{type,x,z}]` roster. Sample real frame duration, optionally genuine stuck-unit counts. On the actual battle result event, feed winner, configured duration, elapsed seconds, scores, number of strategy target changes, and verified optional bonus/extension fields. For strict replay testing, call `executeMirrorManifest(realGameRun,buildMirrorManifest(),{requireLayoutProof:true})`.

Source defaults to `external_unverified`. Marking a record `production_game` does not, by itself, certify provenance. Do not change per-class damage, army AI, individual FFA movement, map visuals or the validated G8.4 objectives to add telemetry.

## Remaining acceptance

- Verify the missing G8.4/G8.5 source and production field mapping.
- Integrate without altering game movement/AI and re-run the previously reported 388 regressions.
- Run 144 real paired game results, not fixtures.
- Independently verify source/build and WebGL FPS/memory/long-match performance.
- Then proceed to G9.
