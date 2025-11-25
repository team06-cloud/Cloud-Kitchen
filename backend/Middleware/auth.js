const jwt = require("jsonwebtoken");
const _ = require('lodash');
const bcrypt = require("bcryptjs");
const User = require('../models/User'); // Adjust this import to your User model path

// Use JWT_SECRET from environment variables or fallback to a development secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_for_development_only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_for_development_only';

const createTokens = async (user) => {
  const createToken = jwt.sign(
    {
      user: _.pick(user, ['id', 'email']),
    },
    JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );

  const createRefreshToken = jwt.sign(
    {
      user: _.pick(user, 'id'),
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );

  return [createToken, createRefreshToken];
};

const refreshTokens = async (token, refreshToken, User) => {
  let userId = -1;
  try {
    const { user: { id } } = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
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

  const refreshSecret = JWT_REFRESH_SECRET;

  try {
    jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    return {};
  }

  const [newToken, newRefreshToken] = await createTokens(user);
  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user,
  };
};

const tryLogin = async (email, password) => {
  const user = await User.findOne({ email }); // Adjust this to your method of fetching a user
  if (!user) {
    throw new Error('Invalid login');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid login');
  }

  const [token, refreshToken] = await createTokens(user);

  return {
    token,
    refreshToken,
  };
};

const authenticateToken = (req, res, next) => {
  // Skip authentication in development mode for testing
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user-id',
      email: 'admin@example.com',
      role: 'admin'
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token is required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
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
