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
        const { oldUsername, newUsername } = req.body;

        const user = await User.findOneAndUpdate(
            { username: oldUsername },
            { username: newUsername },
            { new: true }
        );

        if (!user) return res.status(404).send("User not found");

        res.redirect(`/profile/${username}`);
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

        res.redirect(`/profile/${username}`);
    } catch (error) {
        console.error("Error updating bio:", error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    getEditProfile,
    updateProfileImg,
    updateUsername,
    updateBio,
};
