const Comment = require('../model/comment');
const Post = require('../model/post');
const User = require('../model/user');


async function commentPage (req, resp) {
    try {
        //console.log("postID received:", req.params.postID);

        const [plainComments, plainPost] = await findAllCommentsUnderPost(req.params.postID);

        //console.log("Curr User:  ",  req.session.login_user);

        let profile = await User.findById(req.session.login_user);
        const plainProfille = profile.toObject();

        resp.render('commentsPage', {
            layout: 'commentsPageLayout',
            title: 'Comments',
            posts: plainPost, 
            comments: plainComments,
            currUser: plainProfille,
        });
      
    } catch (err) {
      console.error("Database Error:", err);
      resp.status(500).send("Internal Server Error");
    }
  };

async function findAllCommentsUnderPost (req) {
    try {
  
        const postID = req;
    
        let postResult = await Post.findById(postID).populate("accID", "username profileImg");
        
        const plainPost = postResult.toObject();
    
        let commentsResult = await Comment.find({ postId: postID })
                    .populate("author","username profileImg")
                    .sort({_id:-1});
    
        //console.log("W", commentsResult);
    
        const plainComments = commentsResult.map(comment => comment.toObject());
    
        return [plainComments, plainPost];

        
      } catch (err) {
        console.error("Database Error:", err);
        return [];
      }
}

async function addComment (req, resp){
    try {
        const newComment = new Comment({
            postId: req.body.postID,  
            author: req.session.login_user,  
            parentComment: req.body.parentComment || null, // Set null if not a reply
            content: req.body.content,
        });

        await newComment.save();
        console.log('Commented Successfully');

        resp.redirect(`/commentsPage/${req.body.postID}`);

    } catch (error) {
        console.error('Error creating comment:', error);
        resp.status(500).redirect('homepage-page');
    }
}


  module.exports = {commentPage, addComment};