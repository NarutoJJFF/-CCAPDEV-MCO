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

        let sessionUserID = req.session.login_user.toString();
        console.log("Curr User:  ",  sessionUserID);


        resp.render('commentsPage', {
            layout: 'commentsPageLayout',
            title: 'Comments',
            posts: plainPost, 
            comments: plainComments,
            currUser: plainProfille,
            session2: sessionUserID,
            session: {
              username: req.session.username,
          },
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
            isEdited: false
        });

        await newComment.save();
        console.log('Commented Successfully');

        resp.redirect(`/commentsPage/${req.body.postID}`);

    } catch (error) {
        console.error('Error creating comment:', error);
        resp.status(500).redirect('homepage-page');
    }
}

async function editCommentPage(req, resp) {
    try {
        const commentId = req.params.commentId;

        const comment = await Comment.findById(commentId).populate('author', 'username');

        console.log('Retrieved comment:', comment);

        if (!comment) {
            console.log('Comment not found');
            return resp.status(404).send('Comment not found');
        }

        console.log('Logged-in user ID:', req.session.login_user);
        console.log('Comment author ID:', comment.author._id.toString());

        if (req.session.login_user !== comment.author._id.toString()) {
            console.log('Authorization failed: Logged-in user is not the author');
            return resp.status(403).send('You are not authorized to edit this comment');
        }

        console.log('Authorization successful: Rendering edit comment page');
        resp.render('editComment', {
            layout: 'editPostLayout',
            title: 'Edit Comment',
            comment: comment.toObject(),
        });
    } catch (err) {
        console.error('Error rendering edit comment page:', err);
        resp.status(500).send('Internal Server Error');
    }
}

async function updateComment(req, resp) {
  try {
      const commentId = req.params.commentId;
      const updatedContent = req.body.content;

      if (!updatedContent || !updatedContent.trim()) {
          return resp.status(400).send('Comment content cannot be empty');
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
          return resp.status(404).send('Comment not found');
      }

      if (!comment.author.equals(req.session.login_user)) {
          return resp.status(403).send('You are not authorized to edit this comment');
      }

      await Comment.findByIdAndUpdate(commentId, 
        { content: updatedContent, isEdited: true }, // Mark as edited
        { new: true }
      );

      console.log('Comment updated successfully');
      resp.redirect(`/commentsPage/${comment.postId}`);
  } catch (err) {
      console.error('Error updating comment:', err);
      resp.status(500).send('Internal Server Error');
  }
}

async function deleteReplies(commentId) {
  try {
      const replies = await Comment.find({ parentComment: commentId });

      if (replies.length === 0) return;

      await Promise.all(replies.map(async (reply) => {
          await deleteReplies(reply._id);
          await Comment.findByIdAndDelete(reply._id);
      }));

      console.log(`Deleted ${replies.length} replies`);

  } catch (err) {
      console.error('Error deleting replies:', err);
      throw new Error('Error deleting replies');
  }
}


async function deleteComment(req, res) {
  try {
      console.log(`Deleting comment with ID: ${req.params.commentId}`);

      const comment = await Comment.findById(req.params.commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      if (!comment.author.equals(req.session.login_user)) {
          return res.status(403).json({ error: 'You are not authorized to delete this comment' });
      }

      await deleteReplies(comment._id);

      if (comment.parentComment) {
          await Comment.findByIdAndUpdate(comment.parentComment, {
              $pull: { replies: comment._id }
          });
      }

      await Comment.findByIdAndDelete(comment._id);

      console.log('Comment deleted successfully');

      if (comment.postId) {
          res.redirect(`/commentsPage/${comment.postId}`);
      } else {
          res.status(200).json({ message: 'Comment deleted successfully' });
      }

  } catch (err) {
      console.error('Error deleting comment:', err);
      res.status(500).json({ error: 'Server Error' });
  }
}


async function upvoteComment(req, resp){
    if(!req.session || req.session.guest){
        console.log("Login before viewing profile.");
        const log_req = "vote";
        return resp.redirect('/?logReq='+log_req);
    }

    const sessionUserID = req.session.login_user.toString();
    const commentID = req.params.commentID;
    let upvoted = 0;
    let downvoted = 0;

    try {
        const comment = await Comment.findById(commentID);

        if (comment.upvotes.includes(sessionUserID)) {
            comment.upvotes = comment.upvotes.filter(id => id !== sessionUserID);
            upvoted = -1;
        } else {
            comment.upvotes.push(sessionUserID);
            upvoted = 1;

            if (comment.downvotes.includes(sessionUserID)) {
                comment.downvotes = comment.downvotes.filter(id => id !== sessionUserID);
                downvoted = -1;
            }
        }

        comment.upvoteCount += upvoted;
        comment.downvoteCount += downvoted;

        await comment.save();

    
        resp.json({ upvoteCount: comment.upvoteCount, downvoteCount: comment.downvoteCount });
    } catch (error) {
        console.error("Error in upvote:", error);
        resp.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = { commentPage, 
  addComment, 
  editCommentPage, 
  updateComment, 
  deleteReplies, 
  deleteComment, 
  upvoteComment
};