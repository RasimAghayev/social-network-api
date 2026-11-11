const crypto = require('crypto');
const config = require('config');

// Development fallback database. It carries no user information, so it is
// not a credential and cannot be mistaken for one.
const DEV_MONGO_URI = 'mongodb://127.0.0.1:27017/social-network-api';

// Configuration keys that hold a secret and the environment variable that
// supplies them. The mapping itself lives in custom-environment-variables.json
// so the `config` package stays the single loader.
const SECRET_ENV_NAMES = {
  mongoURI: 'MONGODB_URI',
  jwtSecretKey: 'JWT_SECRET',
};

// A value that still reads as a template rather than a real secret. Deploying
// one of these is refused in production.
const PLACEHOLDER_PATTERN =
  /^(replace|change|your|example|placeholder|changeme|todo|xxx)|[<>]/i;

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

let developmentJwtSecret = null;

const isProduction = () => process.env.NODE_ENV === 'production';

const readConfigValue = (name) => {
  if (!config.has(name)) return '';
  const value = config.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const getMongoUri = () => {
  const uri = readConfigValue('mongoURI');

  if (uri) {
    if (isProduction() && PLACEHOLDER_PATTERN.test(uri)) {
      throw new ConfigurationError(
        `${SECRET_ENV_NAMES.mongoURI} still holds a placeholder value. Export a real connection string before starting the server with NODE_ENV=production.`
      );
    }

    return uri;
  }

  if (isProduction()) {
    throw new ConfigurationError(
      `${SECRET_ENV_NAMES.mongoURI} is not set. Export ${SECRET_ENV_NAMES.mongoURI} before starting the server with NODE_ENV=production.`
    );
  }

  console.warn(
    `[config] ${SECRET_ENV_NAMES.mongoURI} is not set, using the local development database ${DEV_MONGO_URI}.`
  );

  return DEV_MONGO_URI;
};

const getJwtSecret = () => {
  const secret = readConfigValue('jwtSecretKey');

  if (secret) {
    if (isProduction() && PLACEHOLDER_PATTERN.test(secret)) {
      throw new ConfigurationError(
        `${SECRET_ENV_NAMES.jwtSecretKey} still holds a placeholder value. Export a real secret before starting the server with NODE_ENV=production.`
      );
    }

    return secret;
  }

  if (isProduction()) {
    throw new ConfigurationError(
      `${SECRET_ENV_NAMES.jwtSecretKey} is not set. Export ${SECRET_ENV_NAMES.jwtSecretKey} before starting the server with NODE_ENV=production.`
    );
  }

  if (!developmentJwtSecret) {
    developmentJwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      `[config] ${SECRET_ENV_NAMES.jwtSecretKey} is not set, using a random development secret. It is regenerated on every restart, so tokens issued by an earlier run stop working.`
    );
  }

  return developmentJwtSecret;
};

// Called on startup so a production run without secrets stops before it
// accepts a request instead of failing later with a confusing error.
const assertSecretsConfigured = () => {
  getMongoUri();
  getJwtSecret();
};

// Removes the user information from a connection string so a URI can be
// written to the log without leaking a password.
const redact = (value) =>
  String(value).replace(
    /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)[^@\s/]+:[^@\s/]+@/g,
    '$1****@'
  );

module.exports = {
  ConfigurationError,
  assertSecretsConfigured,
  getJwtSecret,
  getMongoUri,
  redact,
};
