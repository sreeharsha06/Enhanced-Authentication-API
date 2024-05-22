const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const User = require('../models/Users');
const downloadImage = require('../utils/download')
const router = express.Router();

const upload = multer({ dest: 'uploads/' });
/**
 * @swagger
 *  components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: Bearer
 *       bearerFormat: JWT

 * /profile/me:
 *   get:
 *     summary: Get current user's profile
 *     description: Retrieve the profile details of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the user's profile details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 name:
 *                   type: string
 *                   description: User's name
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User's email address
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Date of user creation
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Date of last profile update
 *       '401':
 *         description: Unauthorized. User token is invalid or expired.
 *       '500':
 *         description: Server error
 */
// Get profile details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @swagger
 *  components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: Bearer
 *       bearerFormat: JWT
 * /profile/update:
 *   put:
 *     summary: Update current user's profile
 *     description: Update the profile details of the currently authenticated user. This includes updating the user's profile photo (file upload or URL), name, bio, phone, and visibility status.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               bio:
 *                 type: string
 *                 description: User's bio
 *               email:
 *                 type: string
 *                 description: User's email
 *                 required: true
 *               password:
 *                 type: string
 *                 description: User's password
 *                 required: true
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the updated user profile details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 name:
 *                   type: string
 *                   description: User's name
 *                 password:
 *                   type: string
 *                   description: User's password
 *                 bio:
 *                   type: string
 *                   description: User's bio
 *                 phone:
 *                   type: string
 *                   description: User's phone number
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User's email address
 *                 isPublic:
 *                   type: boolean
 *                   description: Whether the user's profile is public
 *                 profilePhoto:
 *                   type: string
 *                   description: Path to the user's profile photo or URL
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Date of user creation
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Date of last profile update
 *       '400':
 *         description: Bad Request. Both file and URL provided or neither provided.
 *       '401':
 *         description: Unauthorized. User token is invalid or expired.
 *       '500':
 *         description: Server error
 */
//update profile details
router.put('/update', authenticateToken, async (req, res) => {
  const { name, bio, phone, email, password } = req.body;
  try {
    const updatedData = { name, bio, phone, email, updatedAt: Date() }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }
    const user = await User.findByIdAndUpdate(
      req.user.id, updatedData, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @swagger
 *  components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: Bearer
 *       bearerFormat: JWT
 * /profile/photo:
 *   put:
 *     summary: Update current user's profile photo
 *     description: Update the profile photo of the currently authenticated user. This can be done by either uploading a new photo file or providing a URL to the photo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhotoFile:
 *                 type: string
 *                 format: binary
 *                 description: User's profile photo file
 *                 nullable: true
 *               profilePhotoUrl:
 *                 type: string
 *                 description: User's profile photo URL
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the updated user profile details.
 *       '400':
 *         description: Bad Request. Both file and URL provided or neither provided.
 *       '401':
 *         description: Unauthorized. User token is invalid or expired.
 *       '500':
 *         description: Server error
 */
// updates profile photo
router.put('/photo', authenticateToken, upload.single('profilePhotoFile'), async (req, res) => {
  const { profilePhotoUrl } = req.body;
  let profilePhotoPath = null;

  if (req.file && profilePhotoUrl) {
    return res.status(400).json({ message: 'Provide either profile photo file or URL, not both.' });
  } else if (req.file) {
    profilePhotoPath = req.file.path;
  } else if (profilePhotoUrl) {
    const filename = getFilenameFromUrl(profilePhotoUrl);
    const filepath = path.join(__dirname, '../uploads', filename);
    try {
      profilePhotoPath = await downloadImage(profilePhotoUrl, filepath);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to download image from URL' });
    }
  } else {
    return res.status(400).json({ message: 'Provide either profile photo file or URL.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: profilePhotoPath },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @swagger
 * /profile/visibility:
 *   put:
 *     summary: Update current user's profile visibility
 *     description: Update the profile visibility of the currently authenticated user to be either public or private.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublic:
 *                 type: boolean
 *                 description: Set profile visibility to public (true) or private (false)
 *     responses:
 *       '200':
 *         description: Successful operation. Returns a success message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad Request. Invalid input data.
 *       '401':
 *         description: Unauthorized. User token is invalid or expired.
 *       '404':
 *         description: Not Found. User not found.
 *       '500':
 *         description: Server error
 */
// Get profile details
router.put('/visibility', authenticateToken, async (req, res) => {
  const { isPublic } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isPublic = isPublic;
    await user.save();

    res.json({ message: 'Profile visibility updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /profile/all:
 *   get:
 *     summary: Get public & Private profiles
 *     description: Retrieve public profiles. Admin users can view all profiles, while normal users can only view public profiles.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful operation. Returns an array of public profiles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       '401':
 *         description: Unauthorized. User token is invalid or expired.
 *       '404':
 *         description: Not Found. User not found.
 *       '500':
 *         description: Server error
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profiles;
    if (user.isAdmin) {
      profiles = await User.find().select('-password');
    } else {
      profiles = await User.find({ isPublic: true }).select('-password');
    }

    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
