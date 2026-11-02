# Phase 1 verification evidence

These commands were executed after the Phase 1 production code and tests were implemented. Every command exited with status 0.

## Tests

Command: npm.cmd run test:run

```text
RUN v5.0.5
Test Files  2 passed (2)
     Tests  91 passed (91)
```

- src/tests/GraphValidator.test.ts: 87 cases.
- src/tests/createFestivalArchipelago.test.ts: 4 cases.

Coverage includes accepted graphs and legal boundaries; size/ID/name failures; non-finite and non-numeric coordinates; malformed inputs/sparse arrays; endpoints; self-loops; repeated/reversed connections; separator-safe pair keys; simultaneous errors; non-mutation; stateless calls; and independent factory objects.

## TypeScript and production build

Command: npm.cmd run build

```text
tsc -b && vite build
vite v8.3.5 building client environment for production...
20 modules transformed.
built successfully
```

Application sources use strict TypeScript checking. The configured Tailwind plugin was included in the production build.

## Lint

Command: npm.cmd run lint

```text
oxlint
Exit status: 0
```

## Scope

These results verify Phase 1. DFS values and input-order independence are Phase 2; event semantics are Phase 3; replay clearing/Reset are Phase 4; browser/component behavior is Phase 5.

No completed map or browser test is claimed at this checkpoint.
