# IMPROVEMENT_ROADMAP — social-network-api

## Phase applicability (4–11)
| Phase | Applies? | Plan |
|-------|----------|------|
| 4 Git hygiene | Yes | Full-history gitleaks, branch/PR hygiene, validate .gitignore/.gitattributes & pre-commit secret scan, Dependabot config, remove `command.txt` if treated as noise. Produce real dependency inventory to replace placeholder. |
| 5 Container baseline | Yes (improve/verify) | Verify Docker builds (app/test/lint), compose up, healthchecks, `make verify`/Makefile targets, `docs/BASELINE.md`, image/dependency scans in container. |
| 6 Upgrade to latest | Yes | Order (once deps inventoried): Node base image → runtime deps (express, mongoose, auth/validation libs) → dev deps (eslint etc.) → CI actions. Test each step in Docker (`node --test`, lint). Handle Express/Mongoose major migrations carefully. |
| 7 Dead code & restructure | Maybe (scoped) | Remove proven dead/scratch artifacts (e.g. `command.txt`) with evidence; do not invent posts feature or merge Section branches without scope. |
| 8 Architecture | No/Maybe (light) | Current structure adequate; refactor only for a real present problem (ADR). |
| 9 Hardening | Yes | Secret handling validated, input/validation/error handling review, dependency/image vuln scans, rate/abuse considerations for auth endpoints as appropriate, Mongo connection/config hygiene. |
| 10 CI/CD | Yes (tune) | Keep gates (build/test/lint/audit/build app), pin/refresh actions, cache/timeouts/concurrency, ensure audit covers intended scope. |
| 11 Tests | Yes | Run and extend Node tests in Docker, regression vs baseline, document strategy/report; tester does not change production code. |

## Risks
- Mongoose 7→8+ and Express 4→5 (if pursued) are breaking; plan migrations and characterize behavior with existing tests.
- MongoDB service/image compatibility with upgraded driver/app.
- Posts stub and missing frontend are known scope limits on master — avoid accidental behavior expansion.

## n/a
No frontend build in-repo (master). No K8s manifests.

## Standing decisions
SD1–SD8 apply; Docker-first verification; Gate 10 approval required before Phase 4+ execution beyond planning artifacts.
