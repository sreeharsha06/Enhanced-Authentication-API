const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Register
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user with the provided name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       '200':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       '400':
 *         description: Bad request. User already exists or missing required fields
 *       '500':
 *         description: Server error
 */
router.post('/register',
  [
    // Validate name, email, and password fields in the request body
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });

      user = new User({ name, email, password });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = { user: { id: user.id } };
      console.log(payload)
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// Login
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user with email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       '200':
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       '400':
 *         description: Bad request. User not found or invalid credentials
 *       '500':
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth
router.get('/auth/google', (req, res) => {
  // Handle Google OAuth logic here
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    // Handle Google OAuth callback here
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.redirect(`/auth/success?token=${token}`);
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Sign out
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out' });
});

module.exports = router;
