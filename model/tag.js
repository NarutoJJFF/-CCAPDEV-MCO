const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
}, { versionKey: false });

module.exports = mongoose.model('Tag', tagSchema);