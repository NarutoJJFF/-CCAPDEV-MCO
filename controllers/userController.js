const User = require('../model/user');
const Post = require('../model/post');
const Follow = require('../model/follow');
const Comment = require('../model/comment');

// Function to render the edit profile page
async function getEditProfile(req, res) {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username: username });
  
      if (!user) {
        return res.status(404).send("User not found");
      }
  
        res.render('editprofile', {
            layout: 'editPostLayout', 
            username: user.username,
            profileImg: user.profileImg,
            bio: user.bio
      });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
  }

async function editProfile(req, res) {
    try {
        const { username, newUsername, profileImg, bio } = req.body;
        let updateFields = {};

        if (newUsername) {
            updateFields.username = newUsername;
        }
        if (profileImg) {
            updateFields.profileImg = profileImg;
        }
        if (bio) {
            updateFields.bio = bio;
        }

        const user = await User.findOneAndUpdate(
            { username }, 
            updateFields,
            { new: true } 
        );

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.redirect('/profile');
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).send("Internal Server Error");
    }
}

async function browseAsGuest(req, res) {
    console.log("Guest thru userController");
    try {
        req.session.guest = true; 
        res.redirect('/homepage-page'); 
    } catch (err) {
        console.error("Error in /guest route:", err);
        res.status(500).send("Internal Server Error");
    }
}

async function seedDefaultUser() {
    try {
        const defaultUser = await User.findOne({ username: "DefaultUser" });

        if (!defaultUser) {
            await User.create({
                username: "DefaultUser",
                password: "default", 
                profileImg: "https://thumbs.dreamstime.com/b/default-profile-picture-avatar-photo-placeholder-vector-illustration-default-profile-picture-avatar-photo-placeholder-vector-189495158.jpg",
                bio: "This is my Default Bio"
            });
            console.log("Default user 'DefaultUser' created.");
        }
    } catch (err) {
        console.error("Error seeding default user:", err);
    }
}

async function viewUserProfile(req, res) {
    try {
        const username = req.params.username;
        const loggedInUserId = req.session.login_user;

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send("User not found");
        }

        const isFollowing = await Follow.findOne({
            follower: loggedInUserId,
            followed: user._id
        });

        const followerCount = await Follow.countDocuments({ followed: user._id });
        const followingCount = await Follow.countDocuments({ follower: user._id });

        // Get the user's posts
        const userPosts = await Post.find({ accID: user._id }).sort({ _id: -1 });

        // For each post, count the number of comments
        const postsWithComments = await Promise.all(
            userPosts.map(async (post) => {
                const plainPost = post.toObject();
                const commentCount = await Comment.countDocuments({ postId: post._id });
                return { ...plainPost, commentCount };
            })
        );

        const followersList = await Follow.find({ followed: user._id })
            .populate('follower', 'username profileImg')
            .then(follows => follows.map(f => f.follower.toObject()));

        // console.log("Posts by this user:");
        // console.log(userPosts);
        // console.log(loggedInUserId);

        res.render('profileView', {
            layout: 'profileLayout',
            profileImg: user.profileImg,
            username: user.username,
            bio: user.bio,
            followers: followerCount,
            following: followingCount,
            posts: postsWithComments, // Posts now include commentCount
            followersList,
            isFollowing: !!isFollowing,
            session: { username: req.session.username },
            sesh_user: loggedInUserId
        });
    } catch (err) {
        console.error("Error in viewUserProfile:", err);
        res.status(500).send("Internal Server Error");
    }
}

async function viewOwnProfile(req, res) {
    try {
        if (!req.session || req.session.guest || !req.session.login_user) {
            console.log("Login before viewing profile.");
            const log_req = "ownProfile";
            return res.redirect('/?logReq=' + log_req);
        }
        const loggedInUserId = req.session.login_user;

        const user = await User.findById(loggedInUserId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        const followersList = await Follow.find({ followed: user._id })
            .populate('follower', 'username profileImg')
            .then(follows => follows.map(f => f.follower.toObject()));

        const userPosts = await Post.find({ accID: user._id }).sort({ _id: -1 });

        // Add comment count to each post
        const postsWithComments = await Promise.all(
            userPosts.map(async (post) => {
                const plainPost = post.toObject();
                const commentCount = await Comment.countDocuments({ postId: post._id });
                return { ...plainPost, commentCount };
            })
        );

        res.render('profile', {
            layout: 'profileLayout',
            profileImg: user.profileImg,
            username: user.username,
            bio: user.bio,
            followers: followersList.length, 
            following: await Follow.countDocuments({ follower: user._id }),
            posts: postsWithComments, // Posts now include commentCount
            followersList,
            session: { username: req.session.username },
            sesh_user: loggedInUserId
        });
    } catch (err) {
        console.error("Error in viewOwnProfile:", err);
        res.status(500).send("Internal Server Error");
    }
}

async function followUser(req, res) {
    if(!req.session || req.session.guest  || !req.session.login_user){
        console.log("Login before creating post/s.");
        const log_req = "follow";
        return res.redirect('/?logReq='+log_req);
    }
    try {
        const followerId = req.session.login_user;
        const followedUser = await User.findOne({ username: req.params.username });

        if (!followedUser) {
            return res.status(404).send("User not found");
        }

        const alreadyFollowing = await Follow.findOne({
            follower: followerId,
            followed: followedUser._id
        });

        if (alreadyFollowing) {
            return res.redirect(`/profile/view/${req.params.username}`);
        }

        await Follow.create({
            follower: followerId,
            followed: followedUser._id
        });

        res.redirect(`/profile/view/${req.params.username}`);
    } catch (err) {
        console.error("Error in followUser:", err);
        res.status(500).send("Internal Server Error");
    }
}

async function unfollowUser(req, res) {
    try {
        const followerId = req.session.login_user; 
        const followedUser = await User.findOne({ username: req.params.username });

        if (!followedUser) {
            return res.status(404).send("User not found");
        }

        await Follow.findOneAndDelete({
            follower: followerId,
            followed: followedUser._id
        });

        res.redirect(`/profile/view/${req.params.username}`);
    } catch (err) {
        console.error("Error in unfollowUser:", err);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    getEditProfile,
    editProfile,
    browseAsGuest,
    seedDefaultUser,
    viewUserProfile,
    viewOwnProfile,
    followUser,
    unfollowUser
};
