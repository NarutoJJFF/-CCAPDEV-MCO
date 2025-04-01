const Post = require('../model/post');

async function homepage (req, resp) {
    try {
        
        const plainPosts = await findAllPosts();

        resp.render('homepage', { 
            layout: 'homepageLayout',
            title: 'Home page',
            posts: plainPosts, 
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
    const upvoted = 0; 
    const downvoted = 0;
    try {
        const post = await Post.find(postID).populate("accID", "username profileImg");
        
        for (let i = 0; i < post.upvotes.length; i++){
            if (sessionUserID == post.upvote.length[i]){
                upvoted = 1;
            }
        }

        for (let i = 0; i < post.downvotes.length; i++){
            if (sessionUserID == post.upvote.length[i]){
                upvoted = 1;
            }
        }


    } catch (error) {

    }

}


async function updateReactCount(req){
    try {
        const postID = req;
        
        let post = await Post.findById(postID).populate("accID", "username profileImg");
                    
        const numUpvote = post.upvotes.length + 1;
        const numDownvote = post.downvotes.length + 1;
        
        post.upvoteCount = numUpvote;
        post.downvoteCount = numDownvote;
    
    } catch (error){
        console.error("Error in likeCounter:", error.message);
    }
}
  
module.exports = {homepage, searchPage, addPostPage, addPost, };