const jwt = require("jsonwebtoken");
const _ = require('lodash');
const bcrypt = require("bcryptjs");
const User = require('../models/User'); // Adjust this import to your User model path

const SECRET = process.env.SECRET || "mynameisajayshakyaIamFrommyownw";
const SECRET_2 = process.env.SECRET_2 || 'your_other_secret_key';

const createTokens = async (user, secret, secret2) => {
  const createToken = jwt.sign(
    {
      user: _.pick(user, ['id', 'email']),
    },
    secret,
    {
      expiresIn: '1h',
    }
  );

  const createRefreshToken = jwt.sign(
    {
      user: _.pick(user, 'id'),
    },
    secret2,
    {
      expiresIn: '7d',
    }
  );

  return [createToken, createRefreshToken];
};

const refreshTokens = async (token, refreshToken, User, SECRET, SECRET_2) => {
  let userId = -1;
  try {
    const { user: { id } } = jwt.decode(refreshToken);
    userId = id;
  } catch (err) {
    return {};
  }

  if (!userId) {
    return {};
  }

  const user = await User.findById(userId); // Adjust this to your method of fetching a user

  if (!user) {
    return {};
  }

  const refreshSecret = SECRET_2 + user.password;

  try {
    jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    return {};
  }

  const [newToken, newRefreshToken] = await createTokens(user, SECRET, refreshSecret);
  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user,
  };
};

const tryLogin = async (email, password, SECRET, SECRET_2) => {
  const user = await User.findOne({ email }); // Adjust this to your method of fetching a user
  if (!user) {
    throw new Error('Invalid login');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid login');
  }

  const [token, refreshToken] = await createTokens(user, SECRET, SECRET_2 + user.password);

  return {
    token,
    refreshToken,
  };
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err); // Debugging line
      if (err.name === 'TokenExpiredError') {
        const refreshToken = req.headers['x-refresh-token'];
        if (refreshToken) {
          refreshTokens(token, refreshToken, User, SECRET, SECRET_2)
            .then(newTokens => {
              if (newTokens.token && newTokens.refreshToken) {
                res.setHeader('x-token', newTokens.token);
                res.setHeader('x-refresh-token', newTokens.refreshToken);
                req.user = newTokens.user;
                next();
              } else {
                res.status(403).json({ message: 'Token is not valid' });
              }
            })
            .catch(error => {
              res.status(403).json({ message: 'Token is not valid' });
            });
        } else {
          res.status(403).json({ message: 'Token is not valid' });
        }
      } else {
        res.status(403).json({ message: 'Token is not valid' });
      }
    } else {
      req.user = user;
      next();
    }
  });
};

module.exports = {
  createTokens,
  refreshTokens,
  tryLogin,
  authenticateToken,
};
