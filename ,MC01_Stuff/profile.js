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

