
$(document).ready(function(){
    console.log("doc loaded");
    
    /*
    $("#like/"+post_id).click(function(){
        console.log("clicked post: "+post_id);
    });
    */
});



function clickLike(post_id){
    let displayImage = document.getElementById('like/'+post_id);
    let filename = displayImage.src.split('/').pop(); 
    if (filename === 'heart.png') {
        displayImage.src = 'header-elements/red-heart.png';

        let otherImage = document.getElementById('dislike/'+post_id);
        let otherFile = otherImage.src.split('/').pop();

        if(otherFile === 'red-broken-heart.png'){
            otherImage.src = 'header-elements/broken-heart.png';
        }
    } else {
        displayImage.src = 'header-elements/heart.png';
    }

    fetch(`/like/${post_id}`, { method: 'POST' })  
}

function clickDislike(post_id){
    let displayImage = document.getElementById('dislike/'+post_id);
    let filename = displayImage.src.split('/').pop();

    if (filename === 'broken-heart.png') {
        displayImage.src = 'header-elements/red-broken-heart.png';

        let otherImage = document.getElementById('like/'+post_id);
        let otherFile = otherImage.src.split('/').pop();

        if(otherFile === 'red-heart.png'){
            otherImage.src = 'header-elements/heart.png';
        }
    } else {
        displayImage.src = 'header-elements/broken-heart.png';
    }

    fetch(`/dislike/${post_id}`, { method: 'POST' });
}
