const express = require('express');
const server = express();

const postController = require('./controllers/postController');

server.get('/homepage-page', postController.homepage);

module.exports = server;
