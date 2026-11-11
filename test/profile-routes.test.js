process.env.JWT_SECRET = 'a-secret-that-only-exists-in-the-test-suite';

const test = require('node:test');
const assert = require('node:assert');
const express = require('express');

const auth = require('../middleware/auth');
const profileRouter = require('../routers/api/profile');
const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePagination,
} = require('../utils/pagination');

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });

const stopServer = (server) =>
  new Promise((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  });

test('every mutating profile route is protected by the auth middleware', () => {
  const mutating = profileRouter.stack.filter(
    (layer) =>
      layer.route &&
      Object.keys(layer.route.methods).some((method) => method !== 'get')
  );

  assert.ok(mutating.length > 0, 'no mutating profile route was found');

  for (const layer of mutating) {
    const guarded = layer.route.stack.some((handler) => handler.handle === auth);

    assert.ok(
      guarded,
      `${Object.keys(layer.route.methods).join(',')} ${layer.route.path} is not protected by the auth middleware`
    );
  }
});

test('deleting a profile without a token is refused', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRouter);

  const server = await startServer(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/profile`, {
      method: 'DELETE',
    });

    assert.strictEqual(response.status, 401);
    await response.text();
  } finally {
    await stopServer(server);
  }
});

test('the profile listing is bounded', () => {
  assert.deepStrictEqual(parsePagination({}), {
    limit: DEFAULT_PAGE_SIZE,
    page: 1,
    skip: 0,
  });
  assert.strictEqual(parsePagination({ limit: '5000' }).limit, MAX_PAGE_SIZE);
  assert.strictEqual(parsePagination({ limit: '0' }).limit, 1);
  assert.strictEqual(parsePagination({ limit: 'not a number' }).limit, DEFAULT_PAGE_SIZE);
  assert.strictEqual(parsePagination({ page: '3' }).skip, 2 * DEFAULT_PAGE_SIZE);
  assert.strictEqual(parsePagination({ page: '0' }).page, 1);
});
