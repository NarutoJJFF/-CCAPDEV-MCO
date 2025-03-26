const Post = require('../models/post');

async function homepage (req, resp) {
    try {
        let postResult = await Post.find({})
        .populate("accID", "username profileImg")
        .sort({_id:-1})
        .limit(20);
        
        const plainPosts = postResult.map(post => post.toObject());

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