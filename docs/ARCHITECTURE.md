# ARCHITECTURE — social-network-api

## Overview
Backend-only REST API (Node.js/Express, MongoDB/Mongoose) for a social-network course app. Stateless HTTP API process persisting to MongoDB.

## Modules
- `server.js`: app bootstrap, production secret assertion, DB connect, JSON parsing, router mounting, HTTP listen.
- `config/`: `db.js` (mongoose connect), `default.json`/`custom-environment-variables.json` (config mapping), `secrets.js` (read/assert/redact).
- `middleware/auth.js`: JWT verification via `x-api-token`.
- `models/`: `User`, `Profile` schemas.
- `routers/api/`: `users` (register), `auth` (me/login), `profile` (CRUD + experience/education + public lookups), `posts` (stub).
- `utils/pagination.js`: pagination helper.
- `test/`: unit/integration-style tests (Node test runner) for auth, profile, config/secrets, credential scan.

## Data & integrations
MongoDB stores users/profiles (and related subdocuments). JWT for auth. Gravatar for avatar derivation. No external paid/third-party APIs beyond those libraries/services implied.

## Runtime/deployment
Docker: deps/prod-deps/test/runtime stages on `node:22-alpine` (digest-pinned), non-root runtime, healthcheck probing `/`, baked-in source. Compose: `app` + `mongo` (+ test/lint profiles), env from `var/.env` (R92-style layout), resource limits, health-gated dependency.

## Boundaries
Simple layered-by-concern Express app (routes → middleware/models/config/utils). No DDD/CQRS/EDA; complexity does not justify heavier patterns.
