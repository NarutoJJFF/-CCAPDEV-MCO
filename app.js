const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
  extname: 'hbs',
}));

server.use(express.static('public'));

const mongoose = require('mongoose');

try{
    mongoose.connect('mongodb+srv://josh:dbjoshpassword@apdevmc.vfohc.mongodb.net/?retryWrites=true&w=majority&appName=APDEVMC');
    console.log("MongoDB connected")
} catch(e){
    console.log("Error MongoDB not connected")
}


const postSchema = new mongoose.Schema({
    tag: { type: String , required: true},
    title: {type: String , required: true},
    //accID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},  //Subject to change depends on the user database
    content:{type: String , required: true},
    upvotes: { type: Number, default: 0 }, 
    downvotes: { type: Number, default: 0 }

  },{versionKey: false, timestamps: true});

const Post = mongoose.model('Post', postSchema);

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Links to Post
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to User
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // For nested comments
    upvotes: { type: Number, default: 0 }, 
    downvotes: { type: Number, default: 0 }

}, {versionKey: false, timestamps: true});

const Comment = mongoose.model('Comment', commentSchema);


server.get('/', async function (req, resp) {
  try {
    let postResult = await Post.find({}); 
    const plainPosts = postResult.map(post => post.toObject());
    //console.log("W", postResult)
    resp.render('homepage', { 
      layout: 'homepageLayout',
      title: 'Home page',
      posts: plainPosts, 
    });
  } catch (err) {
    console.error("Database Error:", err);
    resp.status(500).send("Internal Server Error");
  }
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));


server.get('/add-post-page', async function(req,resp){
  resp.render('addPost',{
    layout: 'addPostLayout',
    title: 'Add Post page'
  });
});

server.post('/add-post', async function(req, resp) {
  try {
    const newPost = new Post({
      tag: req.body.tag,
      title: req.body.title,
      //accID: req.body.accID,
      content: req.body.content
    });

    await newPost.save();
    console.log('Post created successfully');

    resp.redirect('/');
    
  } catch (error) {
    console.error('Error creating post:', error);
    resp.status(500).render('addPost', {
      layout: 'addPostLayout',
      title: 'Add Post',
      msg: 'Error creating post. Please try again.'
    });
  }
});
