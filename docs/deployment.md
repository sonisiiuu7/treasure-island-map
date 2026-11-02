# Repository and deployment evidence

Date: 2026-11-03 (Asia/Calcutta).

## GitHub publication

- Repository: [sonisiiuu7/treasure-island-map](https://github.com/sonisiiuu7/treasure-island-map).
- Visibility: public, explicitly authorized by the owner after Render could not fetch the initially private repository.
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

The initial private-repository creation attempts were rejected by Render as invalid or unfetchable, including after the owner reported enabling GitHub installation access. The owner then explicitly selected public source access. After that change, Render created the static site successfully.

## Live deployment

- Live application: [treasure-island-map.onrender.com](https://treasure-island-map.onrender.com/).
- [Render dashboard](https://dashboard.render.com/static/srv-dbkdtogu01pc73bs38j0).
- Service ID: srv-dbkdtogu01pc73bs38j0.
- Initial deployment: dep-dbkdtq0u01pc73bs3ctg; terminal status **live**.
- Initial deployed source: c7a9d6893cc46838e451875341bd22f8df310614.
- Render's build logs confirm 337 passing tests, successful production build, and lint with 0 warnings and 0 errors. Node 22.17.1 was selected from NODE_VERSION.

To publish subsequent changes, push main, then check the service's Deploys page for the new source commit. The service is configured with autoDeploy=yes/on commit. Automatic deployment also depends on the Git-provider connection; a service linked only by public repository URL needs **Manual Deploy → Deploy latest commit**. See [Render's deployment reference](https://render.com/docs/deploys). A queued build is not a successful release: wait for live and verify the URL.

## Production browser verification

Chrome checks ran against the HTTPS deployment, with a fresh isolated browser profile. The desktop and 320 px mobile captures were visually inspected.

- Startup is EMPTY; Load enters READY; Step exposes exactly one event; Run to End reaches COMPLETED with all 54 history entries and eight table rows.
- Final reference result: bridges CD, EG, GH; articulation islands C, D, E, G; one component.
- Recorded event 21 returns F to E and changes low[E] from 4 to 3. Event 39 shows DE is not a bridge because 3 > 3 is false. Event 40 shows D is articulation because 3 >= 3 is true.
- Selecting D's proof leaves the cursor at index 53.
- CD closure gives two components; DE closure leaves one; D closure gives two. The original history, table, and printable report stay unchanged.
- The cycle example has no critical bridge or articulation. Reset restores the original eight-island unvisited graph; reload reproduces the same history and table.
- No page overflow at desktop 1366 px or mobile 390/320 px. Print media exposes the completed eight-row report.
- Document, script, stylesheet, and favicon requests succeeded. Recorded page and console errors: **zero**.

[Machine-readable browser results](deployment-browser-results.json), [desktop capture](screenshots/deployment/completed-desktop.png), [closure capture](screenshots/deployment/closure-desktop.png), [390 px mobile](screenshots/deployment/completed-mobile-390.png), [320 px mobile](screenshots/deployment/completed-mobile-320.png).

These are production Chrome checks with mobile emulation; no physical-device, cross-browser, screen-reader, or physical-printer audit is claimed. No application source or dependency changed during deployment.
