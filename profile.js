function changeImageLike(){
    let displayImage = document.getElementById('like');
    let filename = displayImage.src.split('/').pop(); 
    if (filename === 'heart.png') {
        displayImage.src = 'Header Elements/red-heart.png';
    } else {
        displayImage.src = 'Header Elements/heart.png';
    }
}

function changeImageDislike(){
    let displayImage = document.getElementById('dislike');
    let filename = displayImage.src.split('/').pop();

    if (filename === 'broken-heart.png') {
        displayImage.src = 'Header Elements/red-broken-heart.png';
    } else {
        displayImage.src = 'Header Elements/broken-heart.png';
    }
}

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/:username', (req, res) => {
    const username = req.params.username;
    const dataPath = path.join(__dirname, 'data/profileData.json');
    
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Server error');
        }
        
        const profileData = JSON.parse(data);
        
        if (profileData.username !== username) {
            return res.status(404).send('User not found');
        }
        
        res.render('profile', { user: profileData });
    });
});

module.exports = router;