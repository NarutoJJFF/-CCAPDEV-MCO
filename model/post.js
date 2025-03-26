const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    tag: { type: String , required: true},
    title: {type: String , required: true},
    accID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},  //Subject to change depends on the user database
    content:{type: String , required: true},
    upvotes: { type: Number, default: 0 }, 
    downvotes: { type: Number, default: 0 }

  },{versionKey: false, timestamps: true});

//const Post = mongoose.model('Post', postSchema);

module.exports = mongoose.model('Post', postSchema);
