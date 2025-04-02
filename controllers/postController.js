const Post = require('../model/post');
const User = require('../model/user');

async function homepage (req, resp) {
    try {
        let sessionUserID = "";
        let user;
        //let is_guest = false;
        if (!req.session || req.session.guest) {
            //console.log("No user logged in. Redirecting to login page.");
            //return resp.redirect('/');
            //is_guest = true;
        }else{
            console.log("Attempting homepage for user: ");
            console.log(req.session.login_user);
            sessionUserID = req.session.login_user.toString();
            user = await User.findById(sessionUserID);
        }

        const plainPosts = await findAllPosts();
        const userProfileImg = user ? user.profileImg : "https://openclipart.org/image/800px/122107"; 

        console.log("ID: ", sessionUserID);

        resp.render('homepage', { 
            layout: 'homepageLayout',
            title: 'Home page',
            posts: plainPosts, 
            session: sessionUserID,
            userProfileImg: userProfileImg
        });

    } catch (err) {
        console.error("Database Error:", err);
        resp.status(500).send("Internal Server Error");
    }
}


//Finds all post (Sorted from latest to oldest)
async function findAllPosts (){
    try {
        let postResult = await Post.find({})
        .populate("accID", "username profileImg")
        .sort({_id:-1})
        .limit(20);
        
        const plainPosts = postResult.map(post => post.toObject());

        return plainPosts;

    } catch (err) {
        console.error("Database Error:", err);
        return [];
    }
}

async function searchPage (req, resp) {

    try {
        const plainPosts = await search(req);

        resp.render('searchedPosts', { 
            layout: 'searchPostLayout',
            title: 'Searched page',
            posts: plainPosts,
            session: {
                username: req.session.username, 
            },
        });

    } catch (err) {
        console.error("Database Error:", err);
        resp.status(500).send("Internal Server Error");
    }
}

//Search based based on req from tags and search
async function search (req) {
    const search = req.query.search;    
    const tag = req.query.tag;

    let searchCriteria = {
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
          ],
    }

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

        return plainPosts;
    
    } catch (error) {
        console.error("Database Error:", err);
        return[];
    }
}

async function addPostPage (req, resp){
    if(!req.session || req.session.guest){
        console.log("Login before creating post/s.");
        return resp.redirect('/');
    }
    resp.render('addPost',{
      layout: 'addPostLayout',
      title: 'Add Post page'
    });
};

async function addPost (req, resp) {
    try {
      const newPost = new Post({
        tag: req.body.tag,
        title: req.body.title,
        accID: req.session.login_user,          //accID: req.body.accID for now super user first, but if sessions are implemented please adjust
        content: req.body.content
      });
  
      await newPost.save();
      console.log('Post created successfully');
  
      resp.redirect('/homepage-page');
      
    } catch (error) {
      console.error('Error creating post:', error);
      resp.status(500).redirect('homepage-page');
    }
  };

async function upvote(req, resp) {
    const sessionUserID = req.session.login_user.toString();
    const postID = req.params.postID;
    let upvoted = 0;
    let downvoted = 0;

    try {
        const post = await Post.findById(postID);

        if (post.upvotes.includes(sessionUserID)) {
            post.upvotes = post.upvotes.filter(id => id !== sessionUserID);
            upvoted = -1;
        } else {
            post.upvotes.push(sessionUserID);
            upvoted = 1;

            if (post.downvotes.includes(sessionUserID)) {
                post.downvotes = post.downvotes.filter(id => id !== sessionUserID);
                downvoted = -1;
            }
        }

        post.upvoteCount += upvoted;
        post.downvoteCount += downvoted;

        await post.save();

    
        resp.json({ upvoteCount: post.upvoteCount, downvoteCount: post.downvoteCount });
    } catch (error) {
        console.error("Error in upvote:", error);
        resp.status(500).json({ error: "Internal Server Error" });
    }
}

async function downvote(req, resp) {
    const sessionUserID = req.session.login_user.toString();
    const postID = req.params.postID;
    let upvoted = 0;
    let downvoted = 0;

    try {
        const post = await Post.findById(postID);

        if (post.downvotes.includes(sessionUserID)) {
            post.downvotes = post.downvotes.filter(id => id !== sessionUserID);
            downvoted = -1;
        } else {
            post.downvotes.push(sessionUserID);
            downvoted = 1;

            if (post.upvotes.includes(sessionUserID)) {
                post.upvotes = post.upvotes.filter(id => id !== sessionUserID);
                upvoted = -1;
            }
        }

        post.upvoteCount += upvoted;
        post.downvoteCount += downvoted;

        await post.save();

        // Return updated counts as JSON
        resp.json({ upvoteCount: post.upvoteCount, downvoteCount: post.downvoteCount });
    } catch (error) {
        console.error("Error in downvote:", error);
        resp.status(500).json({ error: "Internal Server Error" });
    }
}

async function updateReactCount(req){
    try {
        const postID = req;
        
        let post = await Post.findById(postID).populate("accID", "username profileImg");
                    
        const numUpvote = post.upvotes.length;
        const numDownvote = post.downvotes.length;
        
        post.upvoteCount = numUpvote;
        post.downvoteCount = numDownvote;

        await post.save();

    
    } catch (error){
        console.error("Error in like counter:", error.message);
    }
}

async function likeChecker(req){

    const sessionUserID = req.session.login_user;
    const postID = req.params.postID;

    try {
        let post = await Post.findById(postID).populate("accID", "username profileImg");

        return post.upvotes.includes(sessionUserID);

    } catch (error){
        console.error("Error in like checker:", error.message);
    }
}

async function dislikeChecker(req){

    const sessionUserID = req.session.login_user;
    const postID = req.params.postID;

    try {
        let post = await Post.findById(postID).populate("accID", "username profileImg");

        return post.downvotes.includes(sessionUserID);

    } catch (error){
        console.error("Error in like checker:", error.message);
    }
}

async function editPostPage(req, res) {
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
}

async function updatePost(req, res) {
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
}

async function deletePost(req, res) {
    try {
        console.log(`Deleting post with ID: ${req.params.postId}`);
        const post = await Post.findByIdAndDelete(req.params.postId);
        if (!post) return res.status(404).send('Post not found');

        res.redirect(`/profile/${req.params.username}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}
  

module.exports = {homepage,
                searchPage, 
                addPostPage, 
                addPost, 
                upvote, 
                downvote, 
                likeChecker, 
                dislikeChecker, 
                editPostPage, 
                updatePost, 
                deletePost};


