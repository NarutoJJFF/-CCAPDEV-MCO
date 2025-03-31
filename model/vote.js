const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  value: { type: Number, enum: [1, -1], required: true }
}, { versionKey: false, timestamps: true });

// const Vote = mongoose.model('Vote', voteSchema);

module.exports = mongoose.model('Vote', voteSchema);