const express = require('express');
const server = express();
const fs = require('fs');
const path = require('path')

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

const userSchema = new mongoose.Schema({
  username: { type: String , required: true},
  password: { type: String , required: true},
  profileImg: { type: String , default: "https://openclipart.org/image/800px/122107"},
  bio: { type: String, default: ""}
},{versionKey: false, timestamps: true});

const User = mongoose.model('User', userSchema);

const postSchema = new mongoose.Schema({
    tag: { type: String , required: true},
    title: {type: String , required: true},
    accID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},  //Subject to change depends on the user database
    content:{type: String , required: true},
    upvotes: { type: Number, default: 0 }, 
    downvotes: { type: Number, default: 0 }

  },{versionKey: false, timestamps: true});

const Post = mongoose.model('Post', postSchema);

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Links to Post
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }, // Links to User
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // For nested comments
    upvotes: { type: Number, default: 0 }, 
    downvotes: { type: Number, default: 0 }

}, {versionKey: false, timestamps: true});

const Comment = mongoose.model('Comment', commentSchema);

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followed: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { versionKey: false, timestamps: true });

const Follow = mongoose.model('Follow', followSchema);

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  value: { type: Number, enum: [1, -1], required: true }
}, { versionKey: false, timestamps: true });

const Vote = mongoose.model('Vote', voteSchema);

// server.get('/profile/:username', (req, res) => {
//   const username = req.params.username;
//   const dataPath = path.join(__dirname, 'data/profileData.json');
  
//   fs.readFile(dataPath, 'utf8', (err, data) => {
//       if (err) {
//           return res.status(500).send('Server error');
//       }
      
//       const profileData = JSON.parse(data);
      
//       if (profileData.username !== username) {
//           return res.status(404).send('User not found');
//       }
      
//       res.render('profile', { 
//           layout: 'profileLayout',
//           profileImg: profileData.profileImg,
//           username: profileData.username,
//           bio: profileData.bio,
//           followers: profileData.followers,
//           following: profileData.following,
//           posts: profileData.posts,
//           friends: profileData.friends
//       });
//   });
// });

// PROFILE PAGE
server.get('/profile/:username', async (req, res) => {
  try {
    const username = req.params.username;

    const userDoc = await User.findOne({ username: username });
    if (!userDoc) {
      return res.status(404).send('User not found');
    }

    const followerCount = await Follow.countDocuments({ followed: userDoc._id });
    const followingCount = await Follow.countDocuments({ follower: userDoc._id });
    
    const userPosts = await Post.find({ accID: userDoc._id });

    for (let post of userPosts) {
      const upvoteCount = await Vote.countDocuments({ post: post._id, value: 1 });
      const downvoteCount = await Vote.countDocuments({ post: post._id, value: -1 });
      post.upvotes = upvoteCount;
      post.downvotes = downvoteCount;
    }

    res.render('profile', {
      layout: 'profileLayout',
      profileImg: userDoc.profileImg,
      username: userDoc.username,
      bio: userDoc.bio,
      followers: followerCount,
      following: followingCount,
      posts: userPosts
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

server.get('/search', async (req, resp) => {
  const { search, tag } = req.query;

  let searchCriteria = {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ],
  };

  if (tag) {
    searchCriteria = { 
      $and: [
        searchCriteria, 
        { tag: { $regex: tag, $options: 'i' } } 
      ]
    };
  }
  
  try {
    const posts = await Post.find(searchCriteria);
    const plainPosts = posts.map(post => post.toObject());

    resp.render('searchedPosts', { 
      layout: 'searchPostLayout',
      title: 'Searched page',
      posts: plainPosts, 
    });
  } catch (error) {
    resp.status(500).send("Error fetching results.");
  }
});

server.get('/homepage-page', async function (req, resp) {
  try {
    let postResult = await Post.find({}).populate("accID", "username"); 
    const plainPosts = postResult.map(post => post.toObject());
    //console.log("W", postResult);
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

server.get('/', async function(req,resp){
  resp.render('login',{
    layout: 'loginRegisterLayout',
    title: 'Login Page',
    failed: false
  });
});

server.post('/login', async function(req, resp) {
  const searchQuery = { username: req.body.username, password: req.body.password };
  let login = await User.findOne(searchQuery);
  console.log('Finding user');

  if(login != undefined && login._id != null){
    let postResult = await Post.find({}); 
    const plainPosts = postResult.map(post => post.toObject());
    resp.redirect('/homepage-page');
  }else{
    resp.render('login',{
      layout: 'loginRegisterLayout',
      title:  'Login Page',
      failed: true });
  }
});

server.get('/register-page', async function(req,resp){
  resp.render('register',{
    layout: 'loginRegisterLayout',
    title: 'Registration Page',
    passw_error: false,
    uname_taken: false,
    db_error: false
  });
});

server.post('/register', async function(req, resp) {
  if(req.body.password != req.body.conf_password){

    resp.render('register',{
      layout: 'loginRegisterLayout',
      title:  'Registration Page',
      passw_error: true,
      uname_taken: false,
      db_error: false
    });

  }else{

    const searchQuery = { username: req.body.username };
    let login = await User.findOne(searchQuery);
    console.log('Finding user/s');

    if(login != undefined && login._id != null){
      resp.render('register',{
        layout: 'loginRegisterLayout',
        title:  'Registration Page',
        passw_error: false,
        uname_taken: true,
        db_error: false
      });

    }else{

      try {
        const newUser = new User({
          username: req.body.username,
          password: req.body.password,
          profileImg: null,
          bio: "New user"
        });
    
        await newUser.save();
        console.log('User created successfully');
    
        resp.redirect('/');
        
      } catch (error) {

        console.error('Error creating post:', error);

        resp.status(500).render('register', {
          layout: 'loginRegisterLayout',
          title: 'Registration Page',
          passw_error: false,
          uname_taken: false,
          db_error: true
        });

      }
    }
  }

  const searchQuery = { username: req.body.username, password: req.body.password };
  let login = await User.findOne(searchQuery);
  console.log('Finding user');

  if(login != undefined && login._id != null){
    let postResult = await Post.find({}); 
    const plainPosts = postResult.map(post => post.toObject());
    resp.render('homepage', { 
      layout: 'homepageLayout',
      title: 'Home page',
      posts: plainPosts, 
    });
  }else{
    resp.render('login',{
      layout: 'loginRegisterLayout',
      title:  'Login Page',
      failed: true });
  }
});

function finalClose(){
  console.log('Close connection at the end!');
  mongoose.connection.close();
  process.exit();
}

process.on('SIGTERM',finalClose);  //general termination signal
process.on('SIGINT',finalClose);   //catches when ctrl + c is used
process.on('SIGQUIT', finalClose); //catches other termination commands

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
