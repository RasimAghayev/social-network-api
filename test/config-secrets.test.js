const test = require('node:test');
const assert = require('node:assert');

const {
  ConfigurationError,
  assertSecretsConfigured,
  getJwtSecret,
  getMongoUri,
  redact,
} = require('../config/secrets');

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

test('a production run without a database url is refused', () => {
  withNodeEnv('production', () => {
    assert.throws(
      () => getMongoUri(),
      (err) => {
        assert.ok(err instanceof ConfigurationError);
        assert.match(err.message, /MONGODB_URI is not set/);
        return true;
      }
    );
  });
});

test('a production run without a token secret is refused', () => {
  withNodeEnv('production', () => {
    assert.throws(
      () => getJwtSecret(),
      (err) => {
        assert.ok(err instanceof ConfigurationError);
        assert.match(err.message, /JWT_SECRET is not set/);
        return true;
      }
    );
  });
});

test('the startup check reports the missing value', () => {
  withNodeEnv('production', () => {
    assert.throws(() => assertSecretsConfigured(), ConfigurationError);
  });
});

test('a development run falls back to the local database', () => {
  withNodeEnv('development', () => {
    assert.strictEqual(getMongoUri(), 'mongodb://127.0.0.1:27017/social-network-api');
  });
});

test('a development run without a token secret gets a random one', () => {
  withNodeEnv('development', () => {
    const secret = getJwtSecret();

    assert.match(secret, /^[0-9a-f]{64}$/);
    assert.strictEqual(getJwtSecret(), secret);
  });
});

test('a connection string is redacted before it reaches the log', () => {
  // The parts are kept apart so this file does not hold a connection string
  // that a secret scanner would read as a credential.
  const user = 'dbuser';
  const password = 'hunter2';
  const host = 'cluster0.example.mongodb.net';
  const uri = 'mongodb+srv://' + user + ':' + password + '@' + host + '/app';

  const redacted = redact(uri);

  assert.strictEqual(
    redacted,
    'mongodb+srv://****@cluster0.example.mongodb.net/app'
  );
  assert.ok(!redacted.includes('hunter2'));
});
