const Post = require('../model/post');
const User = require('../model/user');
const Comment = require('../model/comment');

async function homepage(req, resp) {
    try {
        let sessionUserID = "";
        let user = null;
        
        if (req.session && !req.session.guest && req.session.login_user) {
            console.log("Attempting homepage for user:", req.session.login_user);
            sessionUserID = req.session.login_user.toString();
            user = await User.findById(sessionUserID).lean();
        }
        
        const plainPosts = await findAllPosts();

        const userProfileImg = user && user.profileImg ? user.profileImg : "https://openclipart.org/image/800px/122107";
        console.log("Retrieved posts:", plainPosts);
        console.log("Session User ID:", sessionUserID);
        
        resp.render('homepage', { 
            layout: 'homepageLayout',
            title: 'Home page',
            posts: plainPosts, 
            session: {
                userID: sessionUserID,
                username: user ? user.username : null
            },
            userProfileImg: userProfileImg
        });
    } catch (err) {
        console.error("Database Error:", err);
        resp.status(500).send("Internal Server Error");
    }
}

async function findAllPosts() {
    try {
        const postResult = await Post.find({})
            .populate("accID", "username profileImg")
            .sort({ _id: -1 })
            .limit(20)
            .lean();

        const plainPostsWithComments = await Promise.all(
            postResult.map(async (post) => {
                const commentCount = await Comment.countDocuments({ postId: post._id });
                return { ...post, commentCount };
            })
        );

        return plainPostsWithComments;
    } catch (err) {
        console.error("Database Error:", err);
        return [];
    }
}


async function searchPage(req, resp) {
    try {
        let sessionUserID = "";
        if (req.session && !req.session.guest && req.session.login_user) {
            sessionUserID = req.session.login_user.toString();
        }
        
        const plainPosts = await search(req);

        resp.render('searchedPosts', { 
            layout: 'searchPostLayout',
            title: 'Searched page',
            posts: plainPosts,
            session: {
                userID: sessionUserID,
                username: req.session.username
            }
        });
    } catch (err) {
        console.error("Database Error:", err);
        resp.status(500).send("Internal Server Error");
    }
}

async function search(req) {
    const searchTerm = req.query.search;
    const tag = req.query.tag;

    // Build the search criteria
    let searchCriteria = {
        $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { content: { $regex: searchTerm, $options: 'i' } }
        ]
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
        // Execute the query and populate account info
        const posts = await Post.find(searchCriteria)
            .populate("accID", "username profileImg");

        // For each post, count the related comments and attach commentCount
        const plainPosts = await Promise.all(
            posts.map(async (post) => {
                const plainPost = post.toObject();
                const commentCount = await Comment.countDocuments({ postId: post._id });
                plainPost.commentCount = commentCount;
                return plainPost;
            })
        );

        return plainPosts;
    } catch (error) {
        console.error("Database Error:", error);
        return [];
    }
}


async function addPostPage (req, resp){
    if(!req.session || req.session.guest  || !req.session.login_user){
        console.log("Login before creating post/s.");
        const log_req = "addPost";
        return resp.redirect('/?logReq='+log_req);
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
        content: req.body.content,
        isEdited: false
      });
  
      await newPost.save();
      console.log('Post created successfully');
  
      resp.redirect('/homepage-page');
      
    } catch (error) {
      console.error('Error creating post:', error);
      resp.status(500).redirect('/homepage-page');
    }
  };

async function upvote(req, resp){
    console.log("Tried to like post");
    if(!req.session || req.session.guest  || !req.session.login_user){
        console.log("Login before viewing profile.");
        const log_req = "vote";
        return resp.redirect('/?logReq='+log_req);
    }

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

async function downvote(req, resp){
    if(!req.session || req.session.guest  || !req.session.login_user){
        console.log("Login before viewing profile.");
        const log_req = "vote";
        return resp.redirect('/?logReq='+log_req);
    }

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
        post.isEdited = true;
        await post.save();

        res.redirect(`/profile`);
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

        res.redirect(`/profile`);
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


