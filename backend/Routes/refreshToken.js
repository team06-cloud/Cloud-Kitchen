const express = require('express');
const jwt = require('jsonwebtoken');
const { refreshTokens } = require('../Middleware/auth');
const User = require('../models/User'); // Adjust this import to your User model path

const router = express.Router();

router.post('/refreshToken', async (req, res) => {
  const { token, refreshToken } = req.body;

  if (!token || !refreshToken) {
    return res.status(400).json({ message: 'Tokens are required' });
  }

  const newTokens = await refreshTokens(token, refreshToken, User, process.env.SECRET, process.env.SECRET_2);

  if (!newTokens.token || !newTokens.refreshToken) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }

  res.json(newTokens);
});

module.exports = router;
