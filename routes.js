const express = require('express');
const server = express();

const postController = require('./controllers/postController');
const commentController = require('./controllers/commentController');
const userController = require('./controllers/userController');

server.get('/homepage-page', postController.homepage);

server.get('/search', postController.searchPage);

server.get('/add-post-page', postController.addPostPage);
server.post('/add-post', postController.addPost);
//server.post('/like-count', postController.likeCounter);

server.post('/like/:postID', postController.upvote);
server.post('/dislike/:postID', postController.downvote);
server.post('/likeChecker/:postID', postController.likeChecker);
server.post('/dislikeChecker/:postID', postController.dislikeChecker);

server.get('/commentsPage/:postID', commentController.commentPage);
server.post('/addComment', commentController.addComment);

// Redirect to homepage if in guest mode
// server.get('/profile', (req, res) => {
//     if (req.session.guest) {
//         return res.redirect('/homepage-page');
//     }
//     userController.viewOwnProfile(req, res);
// });

module.exports = server;
