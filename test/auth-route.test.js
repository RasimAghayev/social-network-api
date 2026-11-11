process.env.JWT_SECRET = 'a-secret-that-only-exists-in-the-test-suite';

const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const TOKEN = jwt.sign({ user: { id: '5f8d0d55b54764421b7156c9' } }, SECRET, {
  algorithm: 'HS256',
});

// The models are replaced before the routers load them, so the routes can be
// exercised without a database.
const userModelPath = require.resolve('../models/User');
require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: {
    findOne: () => ({ select: async () => null }),
  },
};

const profileModelPath = require.resolve('../models/Profile');
require.cache[profileModelPath] = {
  id: profileModelPath,
  filename: profileModelPath,
  loaded: true,
  exports: {
    findOne: async () => ({
      experience: [{ id: 'kept' }],
      education: [{ id: 'kept' }],
      save: async () => {},
    }),
  },
};

const authRouter = require('../routers/api/auth');
const profileRouter = require('../routers/api/profile');

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });

const stopServer = (server) =>
  new Promise((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  });

const request = async (server, method, path, token) => {
  const { port } = server.address();
  const headers = { 'content-type': 'application/json' };
  if (token) headers['x-api-token'] = token;

  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
  });
  const text = await response.text();

  return { status: response.status, text };
};

test('the current user route reports a deleted account', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  const server = await startServer(app);

  try {
    const response = await request(server, 'GET', '/api/auth', TOKEN);

    assert.strictEqual(response.status, 404);
  } finally {
    await stopServer(server);
  }
});

test('deleting an experience that does not exist is refused', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRouter);

  const server = await startServer(app);

  try {
    const response = await request(
      server,
      'DELETE',
      '/api/profile/experience/does-not-exist',
      TOKEN
    );

    assert.strictEqual(response.status, 404);
  } finally {
    await stopServer(server);
  }
});

test('deleting an education that does not exist is refused', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRouter);

  const server = await startServer(app);

  try {
    const response = await request(
      server,
      'DELETE',
      '/api/profile/education/does-not-exist',
      TOKEN
    );

    assert.strictEqual(response.status, 404);
  } finally {
    await stopServer(server);
  }
});
