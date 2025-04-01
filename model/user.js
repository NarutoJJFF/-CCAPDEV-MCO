const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  profileImg: { type: String, default: "/header-elements/default.png" },
  bio: { type: String, default: "" }
}, { versionKey: false, timestamps: true });

//const User = mongoose.model('User', userSchema)

module.exports = mongoose.model('User', userSchema);
