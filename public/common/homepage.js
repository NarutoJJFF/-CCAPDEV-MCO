function changeImageLike(){
    let displayImage = document.getElementById('like');
    let filename = displayImage.src.split('/').pop(); 
    if (filename === 'heart.png') {
        displayImage.src = 'header-elements/red-heart.png';
    } else {
        displayImage.src = 'header-elements/heart.png';
    }
}

function changeImageDislike(){
    let displayImage = document.getElementById('dislike');
    let filename = displayImage.src.split('/').pop();

    if (filename === 'broken-heart.png') {
        displayImage.src = 'header-elements/red-broken-heart.png';
    } else {
        displayImage.src = 'header-elements/broken-heart.png';
    }
}

$(document).ready(function(){
    
})