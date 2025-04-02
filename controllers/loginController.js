const User = require('../model/user');

async function loginPage (req,resp){
  console.log("Login page opened.");

  if(req.session.login_id == null){
    console.log("No user session found. Redirecting...");

    resp.render('login',{
      layout: 'loginRegisterLayout',
      title: 'Login Page',
      failed: false,
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
  
  // Checking status of session before trying to extract data
  /*
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

    try{
      //check session, redirect
    }catch(err){

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
  */

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
  req.session.guest = true;
  resp.redirect('/homepage-page');
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
}

module.exports = {
    loginPage,
    login,
    guest,
    logout,
    registerPage,
    register
}