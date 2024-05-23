const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/Users');
const { body, validationResult } = require('express-validator');
const router = express.Router();


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3000/auth/google/callback');


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

    if (user.provider == 'Google'){
      return res.status(400).json({message: 'please login using google'})
    }

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

/** 
* @swagger
* /auth/google/callback:
*   get:
*     summary: Google OAuth callback
*     description: Handles the Google OAuth callback and generates a JWT token for the authenticated user.
*     tags:
*       - Authentication
*     parameters:
*       - in: query
*         name: code
*         schema:
*           type: string
*         required: true
*         description: Authorization code from Google
*     responses:
*       302:
*         description: Redirects to /auth/success with JWT token
*         headers:
*           Location:
*             description: URL to redirect to with the JWT token
*             schema:
*               type: string
*       500:
*         description: Server error
*/
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Retrieve the user's profile information
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    // Check if user already exists
    let user = await User.findOne({ googleId });
    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({ password: googleId, email, name, provider: 'Google'});
      await user.save();
    }

    // Generate JWT
    const jwtPayload = { user: { id: user.id } };
    jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      // redirect to frontend app
      res.redirect(`/auth/success?token=${token}`);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sign out
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out' });
});

module.exports = router;
