const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post'}, // Links to Post
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to User
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // For nested comments
    upvoteCount: {type: Number, default: 0},
    downvoteCount: {type: Number, default: 0},
    upvotes: [{type: mongoose.Schema.Types.String, ref: 'User'}],    //i'll just use .length to find the amount
    downvotes: [{type: mongoose.Schema.Types.String, ref: 'User'}],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
    isEdited: {type: Boolean, default:false}

}, {versionKey: false, timestamps: true});

//const Comment = mongoose.model('Comment', commentSchema);

module.exports = mongoose.model('Comment', commentSchema);
