const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/secrets');

// Only the algorithm the tokens are signed with is accepted, so a token
// that asks for a different one is rejected instead of being trusted.
const ALLOWED_ALGORITHMS = ['HS256'];

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-api-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied.' });
  }

  // A missing secret is a configuration fault, not an invalid token, so it is
  // raised before the verification and reported as a server error.
  const secret = getJwtSecret();

  // Verify token
  try {
    const decoder = jwt.verify(token, secret, {
      algorithms: ALLOWED_ALGORITHMS,
    });

    req.user = decoder.user;

    next();
  } catch {
    return res.status(401).json({ msg: 'Token is not valid.' });
  }
};
