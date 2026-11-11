process.env.JWT_SECRET = 'a-secret-that-only-exists-in-the-test-suite';

const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

const auth = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET;
const PAYLOAD = { user: { id: '5f8d0d55b54764421b7156c9' } };

const createResponse = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };

  return res;
};

const run = (token) => {
  const req = { header: () => token };
  const res = createResponse();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
};

test('a request without a token is rejected', () => {
  const { res, nextCalled } = run(undefined);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('a token signed with another secret is rejected', () => {
  const token = jwt.sign(PAYLOAD, 'a-different-secret');
  const { res, nextCalled } = run(token);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('a token that asks for another algorithm is rejected', () => {
  const token = jwt.sign(PAYLOAD, SECRET, { algorithm: 'HS512' });
  const { res, nextCalled } = run(token);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('an unsigned token is rejected', () => {
  const token = [
    Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
      'base64url'
    ),
    Buffer.from(JSON.stringify(PAYLOAD)).toString('base64url'),
    '',
  ].join('.');

  const { res, nextCalled } = run(token);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('an expired token is rejected', () => {
  const token = jwt.sign(PAYLOAD, SECRET, { expiresIn: -60 });
  const { res, nextCalled } = run(token);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('a valid token passes the request on', () => {
  const token = jwt.sign(PAYLOAD, SECRET, { algorithm: 'HS256' });
  const { req, res, nextCalled } = run(token);

  assert.strictEqual(res.statusCode, null);
  assert.strictEqual(nextCalled, true);
  assert.deepStrictEqual(req.user, PAYLOAD.user);
});
