# BASELINE — social-network-api (Phase 5 container baseline)

The behavior contract captured by Phase 5. Everything below was verified inside
Docker (the project's own images); nothing was executed on the host. This is
the contract Phases 6–11 must not regress.

## Environment

| Item | Value |
|------|-------|
| Docker | 29.9.3, BuildKit enabled |
| Docker Compose | v5.7.0 (`docker compose` plugin) |
| Base image (app) | `node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402` (digest-pinned) |
| Base image (mongo) | `mongo:7@sha256:c53852c00c23ca9f23fc39690350ffa9a80e3642fe8f96879726d8da0abe80a7` (digest-pinned) |
| Runtime user | `node` (non-root) in `runtime` stage |
| Compose project | `social-network-api-p5` (`COMPOSE_PROJECT_NAME`) |
| App port (default) | 20170 (first port of reserved block 20170-20179, `projects/info/state/ports.md`) |
| Worktree | `projects/worktrees/social-network-api` (branch `phase-5/container-baseline`) |

## Image stages (Dockerfile)

`deps` (package install, BuildKit npm cache mount) → `prod-deps` (`npm prune --omit=dev`) → `test` (adds source + dev deps, `ENTRYPOINT ["node","--test"]`) → `runtime` (prod deps only, `HEALTHCHECK` on `/`, exec-form `CMD ["node","server.js"]`, non-root).

`runtime` is built from `prod-deps` only; it never copies `node_modules` from the `test` stage, so no dev tooling ships.

## Build (`docker compose build` / `make build`)

| Target | Result | Exit code |
|--------|--------|-----------|
| `app` (runtime) | built | 0 |
| `mongo` | built | 0 |
| `test` | built (cached deps layer) | 0 |
| `lint` | built (cached deps layer) | 0 |

`make build` → exit 0.

Image sizes (after build):

| Image | Size |
|-------|------|
| `social-network-api-p5-app` | 297 MB |
| `social-network-api-p5-test` | 347 MB |
| `social-network-api-p5-mongo` | 1.18 GB |

## Test suite (`docker compose --profile test run --rm test` / `make test`)

The suite runs on the Node built-in test runner inside the `test` stage. It needs neither a database nor network access, and reads no environment file (so a local machine's values cannot satisfy the "missing secret is refused" assertions).

```
# tests 26
# suites 0
# pass 26
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms ~2000
```

`make test` → exit 0.
`make verify` (= build + test) → exit 0.

Per-file results (26 subtests across 6 test files):

| Test file | Subtests | Pass | Fail |
|-----------|----------|------|------|
| `test/auth-middleware.test.js` | 6 | 6 | 0 |
| `test/auth-route.test.js` | 3 | 3 | 0 |
| `test/config-secrets-env.test.js` | 3 | 3 | 0 |
| `test/config-secrets.test.js` | 6 | 6 | 0 |
| `test/no-committed-credentials.test.js` | 5 | 5 | 0 |
| `test/profile-routes.test.js` | 3 | 3 | 0 |

## Coverage (`node --test --experimental-test-coverage` inside the test stage)

```
file                               | line % | branch % | funcs % | uncovered lines
config/secrets.js                  | 100.00 | 90.00    | 100.00  |
middleware/auth.js                 | 100.00 | 100.00   | 100.00  |
models/Profile.js                  | 100.00 | 100.00   | 100.00  |
models/User.js                     | 100.00 | 100.00   | 100.00  |
routers/api/auth.js                | 40.23  | 66.67    | 50.00   | 20-25 39-84
routers/api/profile.js             | 37.07  | 55.56    | 36.36   | 22-34 49-120 128-140 148-162 170-181 197-228 240-241 251-263 280-311 323-324 334-346
test/*                             | >=93.62| >=80.00  | >=92.86 | -
utils/pagination.js                | 100.00 | 100.00   | 100.00  |
all files                          | 78.56  | 91.24    | 90.00   |
```

Route coverage is intentionally partial: the auth/profile routers touch Mongoose models, and the suite exercises them without a live database, so several request-flow branches are not reached. These gaps pre-date Phase 5 and are not regression candidates; Phase 11 may add DB-backed integration coverage.

## Lint (`docker compose --profile test run --rm lint` / `make lint`)

ESLint 9 (flat config, `eslint.config.js`) over application code and test suite.

`make lint` → exit 0 (no errors).

## Security scan (`make security`)

`docker scout cves social-network-api-p5-app` → exit 0 (scanner ran; findings are informational):

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 13 |
| MEDIUM | 12 |
| LOW | 1 |

27 vulnerabilities in 13 packages, concentrated in the base image / transitive tooling packages, not app code. Pre-existing; Phase 6 (upgrader) addresses base image / dependency currency.

`npm audit --audit-level=high` (inside test container) → exit 1:

| Severity | Count | Package |
|----------|-------|---------|
| high | 2 | `mongoose` (prototype pollution via inherited-property hydration; `Schema.prototype.virtual()`) |

2 high-severity vulnerabilities in `mongoose` (Mongoose 7.x). Pre-existing, documented in `docs/TECHNICAL_DEBT.md` (TD-2 / TD-6); addressed by dependency upgrades in Phase 6, not by Phase 5.

## `make up` (stack start)

`make up` depends on `make verify` and runs `docker compose up -d`. The `app` service starts only after `mongo` reports healthy (`depends_on: condition: service_healthy`). The app reads `MONGODB_URI`/`JWT_SECRET`/`NODE_ENV` from `var/.env` (created from `.env.example`) plus compose overrides.

**Important:** with `NODE_ENV=production` the server refuses to start if `JWT_SECRET` (or `MONGODB_URI`) is missing or still a placeholder (`config/secrets.js`). `.env.example` carries placeholders only, so `make up` with an unmodified `var/.env` will exit the app container with a configuration error — this is the intended security behaviour, not a Docker/Make defect. A real `JWT_SECRET` must be placed in `var/.env` (never committed) before the stack can serve traffic.

## Characterization notes (contract items with no dedicated test)

- `routers/api/posts.js` is a stub (`GET /` returns `"Posts route."`) with no model and no test; acknowledged incomplete on `master` (`docs/TECHNICAL_DEBT.md` TD-4, README "Known limitations"). No characterization test added: the stub is slated to be replaced by the unmerged `Section-5` branch, and testing throwaway behaviour would not preserve a real contract. Phase 11 may add coverage once the posts feature is implemented.
- No frontend build exists in-repo (`master` is backend-only); no `make migrate`/`make seed` targets (Mongoose schemas are declarative; no seed script). `make format` reports that no formatter is configured (ESLint covers behaviour rules).

## Assumptions

- Digest-pinned base images are current at build time; currency is re-verified per upgrade in Phase 6 (standing decision 1).
- No secrets were manufactured or placed in `var/.env`; `.env.example` holds placeholders only (verified by `test/no-committed-credentials.test.js`).
- No AI-attribution trailers were added to any commit (CLAUDE.md decision 12).
