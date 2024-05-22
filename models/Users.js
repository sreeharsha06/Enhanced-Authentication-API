const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters long'] },
  profilePhoto: { type: String, default: null },
  bio: { type: String, default: null },
  phone: { type: String, default: null },
  provider: { type: String, default: null }, // For OAuth
  isPublic: { type: Boolean, default: true }, // Public or Private profile
  isAdmin: { type: Boolean, default: false },
  createdAt: {type: Date, default: mongoose.now},
  updatedAt: {type: Date, default: null}
});

module.exports = mongoose.model('User', UserSchema);
