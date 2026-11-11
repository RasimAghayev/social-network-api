const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const auth = require('../../middleware/auth');
const { getJwtSecret } = require('../../config/secrets');
const User = require('../../models/User');

// @router  GET     api/auth
// @desc    Test    route
// @access  Public

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
});

// @router  POST     api/auth
// @desc    Authenticate user & get token
// @access  Public

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required.').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // See if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials.' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Incorrect Password' }] });
      }

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        getJwtSecret(),
        { expiresIn: 360000, algorithm: 'HS256' },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      return res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
