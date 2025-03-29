const express = require('express');
const server = express();

const postController = require('./controllers/postController');
const commentController = require('./controllers/commentController');


server.get('/homepage-page', postController.homepage);

module.exports = server;
