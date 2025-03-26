const express = require('express');
const server = express();

const postController = require('../controllers/postController');

server.post('/homepage-page', postController.hompepage);


module.exports = server;
