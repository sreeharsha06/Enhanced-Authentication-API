const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const isAdmin = (req, res, next) => {
  User.findById(req.user.id).then(user => {
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    next();
  }).catch(err => res.status(500).json({ message: 'Server error' }));
};

module.exports = { authenticateToken, isAdmin };
