const Post = require('../model/post');

async function homepage (req, resp) {
    try {
        if (!req.session || !req.session.login_user) {
            console.log("No user logged in. Redirecting to login page.");
            return resp.redirect('/');
        }

        let sessionUserID = req.session.login_user.toString();
        const plainPosts = await findAllPosts();

        console.log("ID: ", sessionUserID);

        resp.render('homepage', { 
            layout: 'homepageLayout',
            title: 'Home page',
            posts: plainPosts, 
            session: sessionUserID,
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

async function upvote(req){

    const sessionUserID = req.session.login_user;
    const postID = req.params.postID;
    let upvoted = 0; 
    let downvoted = 0;
    let arrayValue = null;

    try {
        const post = await Post.findById(postID).populate("accID", "username profileImg");
        
        for (let i = 0; i < post.upvotes.length; i++){
            if (sessionUserID == post.upvotes[i]){
                upvoted = 1;
                arrayValue = i;
                break;
            }
        }

        for (let i = 0; i < post.downvotes.length; i++){
            if (sessionUserID == post.downvotes[i]){
                downvoted = 1;
                arrayValue = i;
                break;
            }
        }

        if (downvoted == 1){
            post.downvotes.splice(arrayValue,1)
            downvoted = 0;
        }

        if (upvoted == 1) {
            post.upvotes.splice(arrayValue, 1);
            upvoted = 0; 
        } else {
            post.upvotes.push(sessionUserID);
        }


        updateReactCount(postID);

        await post.save();

    } catch (error) {
        console.error("Error can't upvote", error.message);
    }
}

async function downvote(req){

    const sessionUserID = req.session.login_user;
    const postID = req.params.postID;
    let upvoted = 0; 
    let downvoted = 0;
    let arrayValue = null;

    try {
        let post = await Post.findById(postID).populate("accID", "username profileImg");
        
        for (let i = 0; i < post.upvotes.length; i++){
            if (sessionUserID == post.upvotes[i]){
                upvoted = 1;
                arrayValue = i;
                break;
            }
        }

        for (let i = 0; i < post.downvotes.length; i++){
            if (sessionUserID == post.downvotes[i]){
                downvoted = 1;
                arrayValue = i;
                break;
            }
        }

        if (downvoted == 1){
            post.downvotes.splice(arrayValue,1)
            downvoted = 0;
        } else {
            post.downvotes.push(sessionUserID);
        }

        if (upvoted == 1) {
            post.upvotes.splice(arrayValue, 1);
            upvoted = 0; 
        } 

        updateReactCount(postID);

        await post.save();

    } catch (error) {
        console.error("Error can't upvote", error.message);
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


