# Interview demonstration

## Start and verify

```powershell
Set-Location "C:\Users\UDAY\Documents\Codex\2026-11-02\x20\outputs\treasure-island-map"
npm.cmd ci
npm.cmd run test:run
npm.cmd run build
npm.cmd run lint
npm.cmd run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

For Windows Command Prompt, replace Set-Location with:

```cmd
cd /d "C:\Users\UDAY\Documents\Codex\2026-11-02\x20\outputs\treasure-island-map"
```

Run verification commands sequentially. The normal test command now passes 303 cases in 13 files; no diagnostic flags are needed. Two exhaustive full-replay tests have a bounded 20-second budget, while all others keep the default five seconds.

Open [http://127.0.0.1:5175/](http://127.0.0.1:5175/). The dev server runs until Ctrl+C. Dependencies are already installed in this checkout; npm.cmd ci is for a clean installation.

## Five-minute walkthrough

1. Show startup: all eight islands and nine connections are present, table values are unset, findings are Provisional, and Step/Run are disabled.
2. Click Load My Archipelago. Explain that validation, sorted adjacency, and DFS run once to prepare a deterministic 54-event history. READY still shows the initial snapshot.
3. Step once: the component starts; its count becomes 1 while A's discovery remains unset. Step again: A gets discovery = low = 0. Point out that map, table, explanation, summary, and history advance together.
4. Continue to displayed event **21** (20 further steps after the first event). The return F → E displays **4 → 3** and low[E] = min(4, low[F] = 3) = 3. The table changes at that event.
5. Continue to event **39**: DE displays **3 > 3 = false**. It remains a DFS-tree edge and receives no critical-bridge marker.
6. Step to event **40**: D displays **3 ≥ 3 = true**. Its AP badge appears while the current-focus ring remains visible. Explain that the strict bridge rule and non-root articulation rule have different equality behavior. A root instead needs at least two DFS-tree children.
7. Click Run to End. Show **CD, EG, GH**, articulation islands **C, D, E, G**, one component, and all eight finished table rows. The summary directly explains CD with **low[D] = 3 > discovery[C] = 2**.
8. Scroll the history and expand entries 21, 39, and 40. All 54 events remain inspectable. Expanding history never changes the selected final snapshot.
9. Click Print summary. Show the one-page report with all critical-item proofs and the final table, or choose Save as PDF in the print dialog. Canceling print leaves the selected event/history unchanged.
10. Reset. The original map and unset values return, history disappears, and another Load produces the same run. Printing before completion shows an incomplete notice.

Use Tab to move between native controls; Enter activates a focused button and Space can advance Step. The event panel announces changes politely. At mobile width the page becomes a vertical layout; use the legend's symbols and line patterns to identify states without relying on color.

## Explain the engineering

- Domain: validation, deterministic DFS, typed event payloads, and independent deeply frozen snapshots.
- Application: AnalysisService receives the GraphAnalyzer Strategy; reducer/selectors manage replay without running DFS.
- Presentation: the hook connects callbacks to React; all components consume one selected ReplayView.
- Correctness: the 303 cases include an independent removal-based oracle over 1,099 small graphs and per-event transition checks over 75 small graphs. Explain the scoped query/worker/budget repair using reliability-and-optionals.md.
- Testing boundaries: invalid-coordinate and duplicate-ID failures are injected in integration tests, verifying stale content clears and valid loads recover. Testing controls are not part of the volunteer interface.
- Complexity: the DFS core is O(V+E); sorting and copying full event snapshots add documented overhead, appropriate for at most 12 nodes and 20 edges.

## If asked about AI assistance

Use [the engineering prompts](prompts/engineering-prompts.md) to explain the constraints around each phase: responsibility boundaries, algorithm rules, data ownership, failure handling, and verification. Follow with [the development notes](ai-prompts.md) for actual issues, decisions, and results.

Use [the interview discussion guide](interview-discussion.md) for LLD, algorithm, complexity, and AI-contribution questions. Explain why the analyzer is injected, why a state union helps, why snapshots require copied nested values, and why > versus >= changes the result. Show actual observed corrections and the independent verification method.

One possible live change is the event-type history filter described in the prompt collection. Keep filtering outside the domain, preserve the selected snapshot/cursor, and explicitly handle Reset. This remains a proposed extension.

See [Phase 5 evidence](phase-5-evidence.md) for the executed checks and screenshots. The browser evidence uses Chrome with mobile viewport emulation; no physical-phone or cross-browser verification is claimed.

Optional replay motion is a brief visual transition after a manual action. It never advances the cursor automatically. The operating system's reduced-motion setting disables it. Print summary becomes available at completion and uses recorded snapshot/proof data.
