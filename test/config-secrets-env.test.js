// The environment has to be in place before the `config` package is loaded,
// because that is when it reads custom-environment-variables.json.
process.env.MONGODB_URI = 'mongodb://<cluster-host>/example';
process.env.JWT_SECRET = 'replace-with-a-generated-random-value';

const test = require('node:test');
const assert = require('node:assert');
const config = require('config');

const { getJwtSecret, getMongoUri } = require('../config/secrets');

const withNodeEnv = (value, run) => {
  const previous = process.env.NODE_ENV;

  if (value === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = value;
  }

  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous;
    }
  }
};

test('the database url is taken from the environment', () => {
  assert.strictEqual(config.get('mongoURI'), process.env.MONGODB_URI);
  assert.strictEqual(getMongoUri(), process.env.MONGODB_URI);
});

test('the token secret is taken from the environment', () => {
  assert.strictEqual(config.get('jwtSecretKey'), process.env.JWT_SECRET);
  assert.strictEqual(getJwtSecret(), process.env.JWT_SECRET);
});

test('a production run refuses a placeholder value', () => {
  withNodeEnv('production', () => {
    assert.throws(() => getMongoUri(), /placeholder value/);
    assert.throws(() => getJwtSecret(), /placeholder value/);
  });
});
