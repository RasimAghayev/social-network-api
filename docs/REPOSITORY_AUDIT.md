# REPOSITORY_AUDIT — social-network-api

## Structure
`server.js`, `config/`, `middleware/`, `models/`, `routers/api/`, `utils/`, `test/`, Dockerfiles, `docker-compose.yml`, `.github/workflows/ci.yml`, `README.md`, `.env.example`, `command.txt`.

## Stack & tooling
Node.js, Express 4, Mongoose 7, bcryptjs/jsonwebtoken/gravatar/express-validator/config/dotenv. ESLint 9 (flat config). Node built-in test runner. npm with `package-lock.json`.

## Config & env
Env-driven (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `NODE_ENV`) mapped via `config/custom-environment-variables.json`; `.env.example` placeholders; `.env`/local overrides ignored. Production refuses missing/placeholder secrets.

## API/contracts
REST endpoints under `/api/auth`, `/api/users`, `/api/profile` (incl. experience/education, public lookups) implemented; `/api/posts` is stub (`GET /` string response). Auth via `x-api-token` JWT.

## Database
MongoDB (Mongoose). Compose provisions `mongo` service with healthcheck and bind-mounted state under `var/mongo`.

## Tests
`test/*.test.js`: auth middleware & route, profile routes, secrets/config env handling, no-committed-credentials. CI runs in Docker test image; lint separate service.

## CI/CD & Docker
CI: build test image, run tests, run lint, `npm audit --audit-level=high` (via test profile), build runtime image. Checkout SHA-pinned (v4.2.2). Docker multi-stage, digest-pinned base, non-root runtime, healthcheck, resource limits.

## Docs
README documents backend-only `master`, setup, config, tests, CI, and notes unmerged `Section-*` branches/frontend.

## Smells / risks
- Posts feature incomplete on master (stub) — intentional branch state vs course, not accidental regression.
- `command.txt` scratch file committed.
- Dependency inventory placeholder (`projects/info/deps/social-network-api.md`) — gaps/vulns not fully enumerated here.
- Express 4/Mongoose 7 and related deps likely have upgrade path to assess.

## Secrets
No committed secrets indicated; `.env.example` placeholders; credential-scan test exists. Full-history gitleaks in Phase 4.
