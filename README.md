# social-network-api
![Views](https://hits.sh/github.com/RasimAghayev/social-network-api.svg?label=views&color=0e75b6)


A personal follow-along of Brad Traversy's **"MERN Stack Front To Back"**
course — building a social-network REST API (Node/Express/MongoDB) with a
React/Redux client. The repository's own `package.json` description names
the course directly; this README documents what the **default branch
(`master`)** actually contains, since that's what a visitor sees first.

## What's actually on `master`

`master` is **backend-only** — there is no `client/`, `fe/`, or any React
code on this branch, despite the course (and the repo description) being
about a full MERN app with a React/Redux frontend.

| Path | Purpose |
|---|---|
| `server.js` | Express app entry point; loads the environment, checks the configuration, mounts four API routers, connects to MongoDB on boot. |
| `config/db.js` | Mongoose connection. |
| `config/default.json` | Declares the configuration keys. Holds no credential. |
| `config/custom-environment-variables.json` | Maps `mongoURI` to `MONGODB_URI` and `jwtSecretKey` to `JWT_SECRET`. |
| `config/secrets.js` | Reads the two secrets, refuses to start a production run without them, and redacts connection strings before they are logged. |
| `middleware/auth.js` | Verifies a JWT passed in the `x-api-token` header. |
| `models/User.js`, `models/Profile.js` | Mongoose schemas — `User` (name/email/password/avatar) and `Profile` (company/skills/experience/education/social links). |
| `routers/api/users.js` | `POST /api/users` — register a user (bcrypt-hashed password, Gravatar avatar, returns a JWT). |
| `routers/api/auth.js` | `GET /api/auth` (current user, JWT-protected), `POST /api/auth` (login, returns a JWT). |
| `routers/api/profile.js` | Profile CRUD for the current user, plus experience/education sub-resources (`PUT`/`DELETE`) and public profile lookups. |
| `routers/api/posts.js` | **Stub only** — `GET /` returns the literal string `"Posts route."`. No create/list/delete, and there is no `models/Post.js` on this branch. |
| `test/` | The test suite, run by the built-in Node test runner. |
| `eslint.config.js` | The lint rules for the application code and the test suite. |
| `Dockerfile` | Three stages: the dependencies, the test image and the runtime image. |
| `mongodb.dockerfile` | The MongoDB image of the compose stack. |
| `docker-compose.yml` | The stack: `app`, `mongo`, and the `test` and `lint` services of the test profile. |
| `command.txt` | Scratch notes of the `npm install`/`npm audit` commands run while building the project — not a script. |

## Setup

The project runs in Docker. Node.js and a MongoDB server do not have to be
installed on the machine.

**1. Create the local environment file.** Every bind mount of the compose
stack lives under `var/` (R92), and the stack reads the environment from
`var/.env`.

```bash
mkdir -p var
cp .env.example var/.env
```

**2. Build the images.**

```bash
docker compose build
```

**3. Start the stack.** The `app` service waits until `mongo` reports itself
healthy.

```bash
docker compose up -d
```

**4. Check it.**

```bash
docker compose ps
curl http://localhost:5000/
```

The application listens on `5000` by default. `APP_PORT` in `var/.env` moves it
to another host port.

### Configuration

| Variable | Read at | Purpose |
|---|---|---|
| `MONGODB_URI` | `config/secrets.js:38` | MongoDB connection string. The `app` service sets it to the `mongo` service of the compose network. |
| `JWT_SECRET` | `config/secrets.js:64` | Secret used to sign and verify JSON Web Tokens. |
| `PORT` | `server.js:33` | Port the HTTP server listens on. Defaults to `5000`. |
| `NODE_ENV` | `config/secrets.js:30` | Set to `production` to make the server require the two values above. The `app` service sets it to `production`. |

The values are read from the environment, which the `config` package maps
onto the configuration keys through `config/custom-environment-variables.json`.
A `.env` file in the project root is loaded at start-up. The same values can
be placed in `config/local.json` or `config/production.json` instead — all
three locations are ignored by git, and the environment wins over the files.

**Never commit a credential.** `config/default.json` deliberately holds no
connection string and no signing secret, `.env` and the `config/local.json`
and `config/production.json` overrides are ignored, and `.env.example`
carries placeholders only. A test in `test/no-committed-credentials.test.js`
fails the build if a committed file carries a connection string with a user
name and a password.

When `NODE_ENV=production` the server refuses to start if `MONGODB_URI` or
`JWT_SECRET` is missing or still holds a placeholder value; it exits with a
message naming the variable. In development both fall back to safe values:
a local MongoDB without a user name, and a random secret that is regenerated
on every restart.

## Tests

Both gates run inside the project's own Docker images. Nothing has to be
installed on the machine.

```bash
docker compose --profile test run --rm test   # node --test
docker compose --profile test run --rm lint   # eslint
```

The suite runs on the Node test runner and covers the token verification
rules, the protection of the mutating profile routes, the bounded profile
listing, the configuration rules described above, and a scan of the committed
files for credentials. It needs no database and no network access.

The `test` service deliberately reads no environment file. The suite asserts
that a missing secret is refused, and the values of the local machine would
answer that assertion before the test could.

### Lint

`npm run lint` runs ESLint over the application code and the test suite. The
rule set covers the mistakes that change behaviour — undefined and unused
identifiers, `==` against `===`, `var` and `let` where `const` is meant — and
not the formatting. The configuration is `eslint.config.js` at the root.

### Dependency audit

```bash
docker compose --profile test run --rm --entrypoint npm test audit --audit-level=high
```

The audit covers the whole lock file, development dependencies included.
There is no advisory at the moment.

## CI/CD

`.github/workflows/ci.yml` runs the same gates on every push and every pull
request:

| Step | Command | Gate |
|---|---|---|
| Build the test image | `docker compose build test` | ✅ |
| Test suite | `docker compose --profile test run --rm test` | ✅ |
| Linter | `docker compose --profile test run --rm lint` | ✅ |
| Dependency audit | `npm audit --audit-level=high` | ✅ |
| Build the runtime image | `docker compose build app` | ✅ |

The runner needs a Docker daemon and nothing else — no Node.js toolchain is
installed on it. The workflow reads the repository only, never prints a
secret and never publishes anything, and `actions/checkout` is pinned to a
commit hash so the tag cannot move under the pipeline.

Two permanent branches exist: `master` (the released state) and `test` (the
integration state). A change is delivered as a pull request from a
`feature/*` branch into `test`, and from `test` into `master`.

## Branches: the React/Redux frontend exists, but not here

`master` follows the course's dependency-bump line: the course work on it
ends at `081c4b0` and only holds Renovate dependency bumps after that. The
course itself continued on branches that were never merged forward, so
`master` is not the most advanced state of the project.

- **`Section-5`** adds `models/Post.js` and real create/list/comment/like
  routes to `routers/api/posts.js` (vs. `master`'s stub).
- **`Section-6` through `Section-9`** add `fe/`, a full Create React App
  frontend with `react-redux`, `redux`, `redux-thunk`, and
  `react-router-dom` — matching the course's "React, Redux" description —
  plus a static `devconnector_html_theme/` reference theme. `Section-9` is
  the most advanced state found.

The published branches `Section-5` to `Section-9` share history with
`master` up to `059cc15` ("22. Add & Delete Profile Education"); none of
them is merged into `master` (confirmed with `git merge-base --is-ancestor`).
A visitor to the repo's default branch sees a backend-only stub of the
project the description advertises.

## Known limitations

- **The `posts` feature does not exist on `master`** — see "Branches"
  above; it is a stub pending a merge that never happened.
- **No `client`/`fe` React app on `master`** despite the repo/course
  description — see "Branches."
- **No `LICENSE` file.**
- **Credentials that were committed in the past are still in the git
  history.** An earlier version of this repository kept a MongoDB
  connection string with an embedded user name and password, a JSON Web
  Token signing secret, and a GitHub OAuth client id and secret in
  `config/default.json`. The values were removed from the working tree, but
  they remain readable in the older commits and in the published
  `Section-5` to `Section-9` branches. Treat them as compromised: rotate
  the database password, the token signing secret, and the GitHub OAuth
  client secret, and use the environment variables described above from now
  on. Removing the old values from the history needs a history rewrite and
  a force push, which is a decision for the repository owner.
- **The source is not mounted into the container.** The images carry the
  code, so a change to a file needs a rebuild. A watch mode for the local
  loop is `npm run server` (`node --watch server.js`) outside Docker.
- **The `mongo` service of the stack has no authentication.** The database
  is reachable only from the compose network, and the development connection
  string carries no user name. A deployment that exposes the database needs
  credentials and a replica set.

## Security notes

- Tokens are signed and verified with `HS256` only; a token that asks for a
  different algorithm is rejected.
- Every mutating profile route requires a valid token, including the
  deletion of the account.
- A password is never part of a response: the current-user route selects
  every field except `password`, and the populated user documents are
  limited to `name` and `avatar`.
- The profile listing is bounded to 100 entries per request and accepts
  `?page=` and `?limit=`.
- A connection string is redacted before a database error is written to the
  log.
