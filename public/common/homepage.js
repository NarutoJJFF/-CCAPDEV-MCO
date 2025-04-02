$(document).ready(function(){
    console.log("doc loaded");
    
    /*
    $("#like/"+post_id).click(function(){
        console.log("clicked post: "+post_id);
    });
    */
});

async function clickLike(post_id) {
    console.log("clickLike Triggered!");
    let displayImage = document.getElementById('like/' + post_id);
    let filename = displayImage.src.split('/').pop();

    if (filename === 'heart.png') {
        displayImage.src = 'header-elements/red-heart.png';

        let otherImage = document.getElementById('dislike/' + post_id);
        let otherFile = otherImage.src.split('/').pop();

        if (otherFile === 'red-broken-heart.png') {
            otherImage.src = 'header-elements/broken-heart.png';
        }
    } else {
        displayImage.src = 'header-elements/heart.png';
    }
    const response = await fetch(`/like/${post_id}`, { method: 'POST' });
    const data = await response.json();

    document.querySelector(`#like-count-${post_id}`).textContent = `${data.upvoteCount} Likes`;
    document.querySelector(`#dislike-count-${post_id}`).textContent = `${data.downvoteCount} Dislikes`;
}

async function clickDislike(post_id) {
    let displayImage = document.getElementById('dislike/' + post_id);
    let filename = displayImage.src.split('/').pop();

    if (filename === 'broken-heart.png') {
        displayImage.src = 'header-elements/red-broken-heart.png';

        let otherImage = document.getElementById('like/' + post_id);
        let otherFile = otherImage.src.split('/').pop();

        if (otherFile === 'red-heart.png') {
            otherImage.src = 'header-elements/heart.png';
        }
    } else {
        displayImage.src = 'header-elements/broken-heart.png';
    }

    const response = await fetch(`/dislike/${post_id}`, { method: 'POST' });
    const data = await response.json(); 

    document.querySelector(`#like-count-${post_id}`).textContent = `${data.upvoteCount} Likes`;
    document.querySelector(`#dislike-count-${post_id}`).textContent = `${data.downvoteCount} Dislikes`;
}
