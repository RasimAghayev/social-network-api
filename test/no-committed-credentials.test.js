const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'coverage',
  '.nyc_output',
  'tmp',
]);
const SKIPPED_FILES = new Set(['package-lock.json']);

// A connection string that carries a user name and a password.
const URI_WITH_CREDENTIALS = /:\/\/[^/\s"']+:[^/\s"']+@/;
// A connection string of any kind inside a committed file.
const MONGO_URI = /mongodb(\+srv)?:\/\//;
// Configuration keys that hold a secret.
const SECRET_KEY = /"(jwtSecretKey|apiKey|api_key|clientSecret|client_id|clientId|password|accessToken)"\s*:\s*"([^"]*)"/i;
const PLACEHOLDER = /^(replace|change|your|example|placeholder|changeme|todo|xxx)|[<>]/i;

const collectFiles = (directory) => {
  const found = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      found.push(...collectFiles(path.join(directory, entry.name)));
      continue;
    }

    if (SKIPPED_FILES.has(entry.name)) continue;
    if (!/\.(js|json|env|example)$/.test(entry.name) && entry.name !== '.env.example') {
      continue;
    }

    found.push(path.join(directory, entry.name));
  }

  return found;
};

test('no committed file carries a connection string with credentials', () => {
  const files = collectFiles(ROOT);

  assert.ok(files.length > 0, 'no files were inspected');

  for (const file of files) {
    const relative = path.relative(ROOT, file).split(path.sep).join('/');

    const content = fs.readFileSync(file, 'utf8');

    assert.ok(
      !URI_WITH_CREDENTIALS.test(content),
      `${relative} carries a connection string with credentials`
    );
  }
});

test('the default configuration holds no mongo connection string', () => {
  const content = fs.readFileSync(path.join(ROOT, 'config/default.json'), 'utf8');

  assert.ok(
    !MONGO_URI.test(content),
    'config/default.json carries a mongo connection string'
  );
});

test('the default configuration holds no secret value', () => {
  const content = fs.readFileSync(path.join(ROOT, 'config/default.json'), 'utf8');
  const parsed = JSON.parse(content);

  for (const [key, value] of Object.entries(parsed)) {
    if (!SECRET_KEY.test(`"${key}": "${value}"`)) continue;

    assert.ok(
      value === '' || PLACEHOLDER.test(value),
      `config/default.json holds a value for ${key}`
    );
  }
});

test('the environment template holds placeholders only', () => {
  const file = path.join(ROOT, '.env.example');

  assert.ok(fs.existsSync(file), '.env.example is missing');

  const content = fs.readFileSync(file, 'utf8');

  assert.ok(!URI_WITH_CREDENTIALS.test(content));
  assert.ok(
    !/^JWT_SECRET=.+$/m.test(content) ||
      PLACEHOLDER.test(
        content.match(/^JWT_SECRET=(.*)$/m)[1]
      ),
    '.env.example holds a token secret'
  );
});

test('local environment files are ignored', () => {
  const ignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');

  assert.match(ignore, /^\.env$/m);
  assert.match(ignore, /^\.env\.\*$/m);
  assert.match(ignore, /^!\.env\.example$/m);
  assert.match(ignore, /^config\/local\.json$/m);
  assert.match(ignore, /^config\/production\.json$/m);
});
