const User = require('../model/user'); // Ensure correct path

// Function to render the edit profile page
async function getEditProfile(req, res) {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username: username });
  
      if (!user) {
        return res.status(404).send("User not found");
      }
  
      // Render the edit profile page, passing user data
        res.render('editProfile', {
            layout: 'profileLayout', // Layout for the edit profile page
            username: user.username,
            profileImg: user.profileImg,
            bio: user.bio
      });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
  }

// Update Profile Image (Accepts Image URL instead of File Upload)
async function updateProfileImg(req, res) {
    try {
        const { username, profileImg } = req.body;

        const user = await User.findOneAndUpdate({ username }, { profileImg });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Redirect to the profile page after updating the profile image
        res.redirect(`/profile/${username}`);
    } catch (error) {
        console.error("Error updating profile image:", error);
        res.status(500).send("Internal Server Error");
    }
}

// Update Username
async function updateUsername(req, res) {
    try {
        const { username, newUsername } = req.body;  // Corrected typo

        const user = await User.findOneAndUpdate(
            { username },  // Find user by the current username
            { username: newUsername },  // Update to the new username
            { new: true }
        );

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Redirect to the updated username profile
        res.redirect(`/profile/${newUsername}`);
    } catch (error) {
        console.error("Error updating username:", error);
        res.status(500).send("Internal Server Error");
    }
}

// Update Bio
async function updateBio(req, res) {
    try {
        const { username, bio } = req.body;

        const user = await User.findOneAndUpdate({ username }, { bio });

        if (!user) return res.status(404).send("User not found");

        // Redirect to the same username's edit profile page
        res.redirect(`/profile/${username}`);
    } catch (error) {
        console.error("Error updating bio:", error);
        res.status(500).send("Internal Server Error");
    }
}

async function browseAsGuest(req, res) {
    try {
        req.session.guest = true;

        const defaultUser = await User.findOne({ username: "DefaultUser" });

        if (!defaultUser) {
            console.error("Default user not found in the database.");
            return res.status(404).send("Default user not found.");
        }

        res.redirect(`/profile/${defaultUser.username}`);
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



module.exports = {
    getEditProfile,
    updateProfileImg,
    updateUsername,
    updateBio,
    browseAsGuest,
    seedDefaultUser
};
