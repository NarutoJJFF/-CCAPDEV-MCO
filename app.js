const express = require('express');
const server = express();
const fs = require('fs');
const path = require('path')

const routes  = require('./routes.js');
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
const { emitWarning } = require('process');

const mongo_uri = 'mongodb+srv://josh:dbjoshpassword@apdevmc.vfohc.mongodb.net/?retryWrites=true&w=majority&appName=APDEVMC';

try{
    mongoose.connect(mongo_uri);
    console.log("MongoDB connected");
} catch(e){
    console.log("Error MongoDB not connected");
}

const session = require('express-session');
const mongoStore = require('connect-mongodb-session')(session);

let store = new mongoStore({
  uri: mongo_uri,
  collection: 'mySession',
  expires: 21*24*60*60*1000 //3weeks
});

server.use(session({
  secret: 'a secret fruit',
  saveUninitialized: true,
  resave: false,
  store: store
}));


server.use("/", routes);

const userSchema = new mongoose.Schema({
  username: { type: String , required: true},
  password: { type: String , required: true},
  profileImg: { type: String , default: "https://openclipart.org/image/800px/122107"},
  bio: { type: String, default: ""}
},{versionKey: false, timestamps: true});

const User = mongoose.model('User', userSchema);

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Links to Post
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to User
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

// PROFILE PAGE

// Default Profile Page
server.get('/profile', async function (req, res) {
  try {
    const userDoc = await User.findOne({ username: "Anonymouse" });
    if (!userDoc) {
      return res.status(404).send('No default user found');
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
      posts: userPosts.map(post => post.toObject())
      // friends: userDoc.friends
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Profile Page
server.get('/profile/:username', async function (req, res) {
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
      posts: userPosts.map(post => post.toObject()),
      // friends: userDoc.friends 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

server.get('/editprofile/:username', async (req, resp) => {
  try {
    const username = req.params.username;
    const user= await User.findOne({ username: username });

    if (!user) {
      return resp.status(404).send("User not found");
    }

    resp.render('editProfile', {
      layout: 'profileLayout',
      username: user.username,
      profileImg: user.profileImg,
      bio: user.bio,
    });
  } catch (err) {
    console.error(err);
    resp.status(500).send("Internal Server Error");
  }
});

// Edit a post
server.get('/profile/:username/edit/:postId', async (req, res) => {
  try {
    console.log(`Editing post with ID: ${req.params.postId}`);
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    res.render('editPost', {
      layout: 'editPostLayout',
      post: post.toObject(),
      username: req.params.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

server.post('/profile/:username/edit/:postId', async (req, res) => {
  try {
    console.log(`Updating post with ID: ${req.params.postId}`);
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    post.title = req.body.title;
    post.tag = req.body.tag;
    post.content = req.body.content;
    await post.save();

    res.redirect(`/profile/${req.params.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Delete a post
server.post('/profile/:username/delete/:postId', async (req, res) => {
  try {
    console.log(`Deleting post with ID: ${req.params.postId}`);
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    res.redirect(`/profile/${req.params.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Like a post
server.post('/profile/:username/upvote/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    post.upvotes += 1;
    await post.save();

    res.redirect(`/profile/${req.params.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Dislike a post
server.post('/profile/:username/downvote/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    post.downvotes += 1;
    await post.save();

    res.redirect(`/profile/${req.params.username}`);
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
    const posts = await Post.find(searchCriteria).populate("accID", "username profileImg");
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

/*
server.get('/homepage-page', async function (req, resp) {
  try {
    let postResult = await Post.find({}).populate("accID", "username profileImg"); 
    const plainPosts = postResult.map(post => post.toObject());

    let s_user = await User.findOne({ username: "Anonymouse"});
    let su_id = s_user._id;

    console.log("SU ID: ", su_id);

    for (let post of plainPosts) {
      let post_id = post._id;
      /*
      console.log(post_id);
      */
     /*
      let voteDatum = await Vote.findOne({ user: su_id, post: post_id});
      let post_liked = false;
      let post_disliked = false;
      */
      /*
      console.log("Votes found:");
      console.log(voteDatum);
      */

      /*
      if(voteDatum != undefined && voteDatum._id != null){
        let vote_val = voteDatum.value;
        if(vote_val>0){
          post_liked = true;
        }else{
          post_disliked = true;
        }
      }

      post['liked'] = post_liked;
      post['disliked'] = post_disliked;

      /*
      console.log(post);
      */

    /*
    }
    */
    /*
    console.log("W", plainPosts);
    */

    /*
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
*/


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
      accID: '67cdbb525d28b303b3a17556',          //accID: req.body.accID for now super user first, but if sessions are implemented please adjust
      content: req.body.content
    });

    await newPost.save();
    console.log('Post created successfully');

    resp.redirect('/homepage-page');
    
  } catch (error) {
    console.error('Error creating post:', error);
    resp.status(500).render('addPost', {
      layout: 'addPostLayout',
      title: 'Add Post',
      msg: 'Error creating post. Please try again.'
    });
  }
});

server.get('/commentsPage/:postID', async function(req,resp) {
  try {

    const postID = req.params.postID;

    let postResult = await Post.findById(postID).populate("accID", "username profileImg");

    console.log("W", postResult);


    if (!postResult) {
      return resp.status(404).send("Post not found.");
    }
    
    const plainPost = postResult.toObject();

    let commentsResult = await Comment.find({ postId: postID }).populate("author","username profileImg")

    console.log("W", commentsResult);

    const plainComments = commentsResult.map(comment => comment.toObject());

    resp.render('commentsPage', {
      layout: 'commentsPageLayout',
      title: 'Comments',
      posts: plainPost, 
      comments: plainComments
    });
  } catch (err) {
    console.error("Database Error:", err);
    resp.status(500).send("Internal Server Error");
  }
})


server.post('/addComment', async function(req, resp) {
  try {
    const newComment = new Comment({
      postId: req.body.postID,  // Fixed field name to match schema
      author: '67cdbb525d28b303b3a17556',  // Placeholder user ID (adjust when session is implemented)
      parentComment: req.body.parentComment || null, // Set null if not a reply
      content: req.body.content,
    });

    await newComment.save();
    console.log('Commented Successfully');

    // Redirect to the correct post's comments page
    resp.redirect(`/commentsPage/${req.body.postID}`);
    
  } catch (error) {
    console.error('Error creating comment:', error);
    resp.status(500).render('commentsPage', {
      layout: 'commentsPageLayout',
      title: 'Comments',
      msg: 'Error creating comment. Please try again.'
    });
  }
});

// LOGIN PAGE

// Login page (default)
server.get('/', async function(req,resp){
  console.log("Login page opened.");
  
  // Checking status of session before trying to extract data
  store.get(req.sessionID, async (err, session) => {
    let log_uname = "";
    let log_passw = "";
    let saved = false;
    
    if (err) {
      console.log('Error checking session');
    }else if (!session) {
      // Session doesn't exist (expired or never existed)
      console.log('Session has expired or does not exist');
    }else if (session.expires && new Date(session.expires) < Date.now()) {
      // Session is expired based on the store's expiration time
      console.log('Session has expired');
    }else{
      // Session exists and is still valid
      console.log('Session is still active');

      if(req.session.remember){
        let current_user = await User.findById(req.session.login_user);
        
        log_uname = current_user.username;
        console.log("1 Saved username: " + log_uname);
        log_passw = current_user.password;
        console.log("1 Saved password: " + log_passw);
        saved = true;
      }

      console.log("2 Username: "+log_uname);
      console.log("2 Password: "+log_passw);
    }

    resp.render('login',{
      layout: 'loginRegisterLayout',
      title: 'Login Page',
      failed: false,
      u_saved: saved,
      saved_uname: log_uname,
      saved_passw: log_passw
    });
  });
});

// login function
server.post('/login', async function(req, resp) {
  console.log("Login attempted");
  const searchQuery = { username: req.body.username, password: req.body.password };
  let login = await User.findOne(searchQuery);
  console.log('Finding user');

  if(login != undefined && login._id != null){ // succesful login
    
    console.log("Remember?:");
    console.log(req.body.remember);

    //let sesh_exp = 0;
    let sesh_saved = true;

    if(req.body.remember != undefined){
      //store.expires = 21*24*60*60*1000; //three weeks
    }else{
      //store.expires = 1000; //1sec
      sesh_saved = false;
    }

    req.session.regenerate(function(err){
      //resp.redirect('/');
      if (err) {
        console.log('Error regenerating session');
      }
    });
    
    req.session.login_user = login._id;
    req.session.login_id = req.sessionID;
    req.session.remember = sesh_saved;
    req.session.guest = false;

    console.log("Current User ID: " + req.session.login_user);
    console.log("Current Login ID: " + req.session.login_id);
    console.log("Remember?: " + req.session.remember);

    resp.redirect('/homepage-page');
  }else{ // failed login
    resp.render('login',{
      layout: 'loginRegisterLayout',
      title:  'Login Page',
      failed: true,
      u_saved: false,
      saved_uname: "",
      saved_passw: ""});
  }
});

server.get('/guest', async function(req,resp){
  req.session.guest = true;
  resp.redirect('/homepage-page');
});

// Logout function
server.get('/logout', async function(req,resp){
  req.session.destroy(function(err){
    resp.redirect('/');
  });
});

// REGISTER PAGE

// Register page
server.get('/register-page', async function(req,resp){
  resp.render('register',{
    layout: 'loginRegisterLayout',
    title: 'Registration Page',
    passw_error: false,
    uname_taken: false,
    db_error: false
  });
});

// register function
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
