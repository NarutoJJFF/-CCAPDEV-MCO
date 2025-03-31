const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
      follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      followed: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    }, { versionKey: false, timestamps: true });
    
// const Follow = mongoose.model('Follow', followSchema);

module.exports = mongoose.model('Follow', followSchema);