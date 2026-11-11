# Application image for social-network-api.
#
# The image carries the source, so the container needs no bind mount of the
# repository. Every bind mount of the compose stack lives under var/ (R92).
#
# The base image is pinned by digest: the lock file is resolved against
# Node.js 22, and a floating tag would let the runtime drift away from the
# platform the lock file was built for.
FROM node:26-alpine@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216 AS deps

WORKDIR /app

# The lock file alone decides the dependency tree, so it is copied on its own
# and the layer is reused whenever only the application code changes.
COPY package.json package-lock.json ./
# BuildKit cache mount: the npm cache survives across builds so a dependency
# tree that did not change is reinstalled from cache instead of the network.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund


FROM deps AS prod-deps
RUN npm prune --omit=dev


# Test image. It adds the test suite and the source on top of the dependency
# layer. The suite runs on the Node test runner and needs no database and no
# network access.
FROM deps AS test

COPY . .
RUN chown -R node:node /app

USER node

ENTRYPOINT ["node", "--test"]


# Runtime image. The application source is baked in, the process runs as the
# unprivileged node user, and the image holds no secret. Only the production
# dependencies are installed.
FROM prod-deps AS runtime

ENV NODE_ENV=production

COPY --chown=node:node server.js ./
COPY --chown=node:node config ./config
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node models ./models
COPY --chown=node:node routers ./routers
COPY --chown=node:node utils ./utils

USER node

EXPOSE 5000

# The server answers / with a plain string. Probing the port is enough to tell
# a running process from a dead one.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "require('http').get({host:'127.0.0.1',port:5000,path:'/',timeout:4000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
