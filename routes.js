const express = require('express');
const server = express();

const postController = require('./controllers/postController');
const commentController = require('./controllers/commentController');


server.get('/homepage-page', postController.homepage);

server.get('/search', postController.searchPage);

server.get('/add-post-page', postController.addPostPage);
server.post('/add-post', postController.addPost);

server.get('/commentsPage/:postID', commentController.commentPage);
server.post('/addComment', commentController.addComment);


module.exports = server;
