const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    tag: { type: String , required: true},
    title: {type: String , required: true},
    accID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},  //Subject to change depends on the user database
    content:{type: String , required: true},
    upvoteCount: {type: Number, default: 0},
    downvoteCount: {type: Number, default: 0},
    upvotes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],    //i'll just use .length to find the amount
    downvotes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    comments : [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]

  },{versionKey: false, timestamps: true});

//const Post = mongoose.model('Post', postSchema);

module.exports = mongoose.model('Post', postSchema);
