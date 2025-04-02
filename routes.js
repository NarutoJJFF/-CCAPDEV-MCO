const express = require('express');
const server = express();

const postController = require('./controllers/postController');
const commentController = require('./controllers/commentController');
const userController = require('./controllers/userController');
const loginController = require('./controllers/loginController');

server.get('/homepage-page', postController.homepage);

server.get('/search', postController.searchPage);

server.get('/add-post-page', postController.addPostPage);
server.post('/add-post', postController.addPost);
server.get('/profile/:username/edit/:postId', postController.editPostPage);
server.post('/profile/:username/edit/:postId', postController.updatePost);
server.post('/profile/:username/delete/:postId', postController.deletePost);
//server.post('/like-count', postController.likeCounter);

server.post('/like/:postID', postController.upvote);
server.post('/dislike/:postID', postController.downvote); 
server.post('/likeChecker/:postID', postController.likeChecker);
server.post('/dislikeChecker/:postID', postController.dislikeChecker);

server.get('/commentsPage/:postID', commentController.commentPage);
server.post('/addComment', commentController.addComment);
server.get('/comments/edit/:commentId', commentController.editCommentPage);
server.post('/comments/edit/:commentId', commentController.updateComment);
server.post('/comments/delete/:commentId', commentController.deleteComment);
server.post('/commentLike/:commentID', commentController.upvoteComment);
server.post('/commentDislike/:commentID', commentController.downvoteComment);



server.get('/editprofile/:username', userController.getEditProfile);
server.post('/user/editProfile', userController.editProfile);
//server.get('/guest', userController.browseAsGuest);
server.get('/profile/view/:username', userController.viewUserProfile);
server.get('/follow/:username', userController.followUser);
server.get('/unfollow/:username', userController.unfollowUser);
server.get('/profile', userController.viewOwnProfile);

server.get('/', loginController.loginPage);
server.post('/login', loginController.login);
server.get('/guest', loginController.guest);
server.get('/logout', loginController.logout);
server.get('/register-page', loginController.registerPage);
server.post('/register', loginController.register);

// Redirect to homepage if in guest mode
// server.get('/profile', (req, res) => {
//     if (req.session.guest) {
//         return res.redirect('/homepage-page');
//     }
//     userController.viewOwnProfile(req, res);
// });

module.exports = server;
