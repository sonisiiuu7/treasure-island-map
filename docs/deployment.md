# Repository and deployment evidence

Date: 2026-11-03 (Asia/Calcutta).

## GitHub publication

- Repository: [sonisiiuu7/treasure-island-map](https://github.com/sonisiiuu7/treasure-island-map).
- Visibility: private; the owner must grant interviewers repository access if they need to inspect the source.
- Branch: main; the existing local commit history was pushed intact and origin/main is tracked.
- Verified application commit: 6c0f1315c3c8a3e2e0b0a66c9dd642f6e053ab2c.
- [Hosted quality run](https://github.com/sonisiiuu7/treasure-island-map/actions/runs/41504434492), [job details](https://github.com/sonisiiuu7/treasure-island-map/actions/runs/41504434492/job/125479974636).

| Hosted check | Result |
| --- | --- |
| Locked installation | npm ci passed on Ubuntu |
| Tests | 337 passed in 17 files; 18.36 s |
| Production build | TypeScript and Vite passed |
| Lint | 0 warnings, 0 errors |

No application code, algorithm, replay contract, or dependency was changed for publication. Git uses the existing credential manager; credentials are not stored in the repository or this record.

## Render configuration

The owner selected **My Workspace** (tea-d2b5qqbe5dus73c90v8g). This frontend needs a static site, with no running backend, database, or application secrets.

| Setting | Value |
| --- | --- |
| Repository | https://github.com/sonisiiuu7/treasure-island-map |
| Branch | main |
| Service name | treasure-island-map |
| Build command | npm ci && npm run test:run && npm run build && npm run lint |
| Publish directory | dist |
| NODE_VERSION | 22.17.1 |
| SKIP_INSTALL_DEPS | true |
| Auto-deploy | On commit |

The build command checks the application before publishing; SKIP_INSTALL_DEPS avoids a second automatic dependency installation. Only dist is served to visitors.

The first creation attempt was rejected by Render as an invalid or unfetchable repository. The private repository exists and the authenticated Git push succeeded; Render still needs its own GitHub access to the newly created repository. No Render site or live URL has been claimed. The owner has been asked to include treasure-island-map in Render's GitHub installation, after which creation and live verification can continue.

After initial access is granted, future pushes to main are intended to trigger the quality workflow and a Render build. The Render deployment must reach live and pass browser checks before being recorded as complete here.
