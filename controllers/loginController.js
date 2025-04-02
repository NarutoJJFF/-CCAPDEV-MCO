const User = require('../model/user');

async function loginPage (req,resp){
  console.log("Login page opened.");

  if(!req.session || req.session.guest){
    let log_req="";
    if(req.query.logReq != null){
      log_req = req.query.logReq
    }

    let ownProfile = false;
    if(log_req == "ownProfile"){
      ownProfile = true;
    }

    let addPost = false;
    if(log_req == "addPost"){
      addPost = true;
    }

    let vote = false;
    if(log_req == "vote"){
      vote = true;
    }

    console.log("No user session found. Redirecting...");

    resp.render('login',{
      layout: 'loginRegisterLayout',
      title: 'Login Page',
      failed: false,
      ownProfile: ownProfile,
      addPost: addPost,
      vote: vote
    });

  }else{
    let current_user = await User.findById(req.session.login_user);
    let log_uname = current_user.username;
    if(req.session.remember){
      console.log("Remembered. Session extended.");
      req.session.cookie.maxAge = 21*24*60*60*1000; // 3 week extension from login during remember period
    }else{
      console.log("Unremembered. Session unextended.");
    }
    console.log("Hello " + log_uname);
    resp.redirect('/homepage-page');
  }
}

async function login(req, resp) {
  console.log("Login attempted");
  const searchQuery = { username: req.body.username, password: req.body.password };
  let login = await User.findOne(searchQuery);
  console.log('Finding user');

  if(login != undefined && login._id != null){ // succesful login

    console.log("Remember?:");
    console.log(req.body.remember);

    let sesh_exp = 0;
    let sesh_saved = true;

    if(req.body.remember != undefined){
      sesh_exp = 21*24*60*60*1000; //three weeks
    }else{
      sesh_exp = 60*60*1000; //1min
      sesh_saved = false;
    }

    req.session.regenerate(function(err){
      //resp.redirect('/');
      if (err) {
        console.log('Error regenerating session');
      }
    });

    req.session.login_user = login._id.toString(); // Convert ObjectId to string
    req.session.username = login.username; // Store the username in the session
    req.session.login_id = req.sessionID;
    req.session.remember = sesh_saved;
    req.session.guest = false;
    req.session.cookie.maxAge = sesh_exp;

    console.log("Current User ID: " + req.session.login_user);
    console.log("Current Username: " + req.session.username); // Log the username
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
}

async function guest(req,resp){
  console.log("Guest thru loginController");
  try {
    req.session.guest = true; 
    resp.redirect('/homepage-page'); 
  } catch (err) {
    console.error("Error in /guest route:", err);
    resp.status(500).send("Internal Server Error");
  }
}

async function logout(req,resp){
  req.session.destroy(function(err){
    resp.redirect('/');
  });
}

async function registerPage(req,resp){
  resp.render('register',{
    layout: 'loginRegisterLayout',
    title: 'Registration Page',
    passw_error: false,
    uname_taken: false,
    db_error: false
  });
}

async function register(req, resp) {
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

        console.error('Error creating account:', error);

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
}

module.exports = {
    loginPage,
    login,
    guest,
    logout,
    registerPage,
    register
}