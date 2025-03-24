


//-----------------------------------------------------------------------------------------------------------------------------------------

let currentSongIndex = 0;
let songs = presetSongs; //  Now it correctly uses the 10 preset songs
let songCard = document.getElementById("song-card");
let songCardWrapper = document.getElementById("song-card-wrapper");
let startX, isHolding = false;
const threshold = 200; // Increase threshold to ensure swipe

document.addEventListener("DOMContentLoaded", () => {
    displaySong(); //  Ensure the first song is displayed on page load
});

function displaySong() {
    if (currentSongIndex >= songs.length) {
        alert("No more songs to display");
        return;
    }
    const song = songs[currentSongIndex];
    console.log("Displaying song:", song);

    document.getElementById("song-image").src = song.album.images[0]?.url || "default.jpg"; 
    document.getElementById("song-title").textContent = song.name; 
    document.getElementById("song-artist").textContent = song.artists[0]?.name || "Unknown Artist"; 
    document.getElementById("song-album").textContent = song.album.name || "Unknown Album"; 

    songCard.style.transform = "translateX(0px) rotate(0deg)";
    songCard.style.opacity = "1";
}

document.addEventListener("mousedown", (event) => {
    if (!songCardWrapper.contains(event.target)) return;
    isHolding = true;
    startX = event.clientX;
    songCard.style.transition = "none"; // Disable smooth transition while dragging
});

document.addEventListener("mousemove", (event) => {
    if (!isHolding) return;
    let diff = event.clientX - startX;
    songCard.style.transform = `translateX(${diff}px) rotate(${diff / 10}deg)`;
});

document.addEventListener("mouseup", (event) => {
    if (!isHolding) return;
    isHolding = false;

    let currentX = event.clientX;
    let diff = currentX - startX;
    let cardRect = songCard.getBoundingClientRect(); // Get current card position

    songCard.style.transition = "transform 0.3s ease-out";

    if (diff > threshold || cardRect.right > window.innerWidth - 150) {
        // Right swipe (Like)
        console.log("Right swipe detected:", diff, "Card Right Position:", cardRect.right);
        songCard.classList.add("swipe-right");
        likeSong(songs[currentSongIndex]);
        setTimeout(nextSong, 300);
    } else if (diff < -threshold || cardRect.left < 150) {
        // Left swipe (Dislike)
        console.log("Left swipe detected:", diff, "Card Left Position:", cardRect.left);
        songCard.classList.add("swipe-left");
        setTimeout(() => {
            nextSong();
            songCard.classList.remove("swipe-left");
        }, 300);
    } else {
        // Reset position if not far enough
        songCard.style.transform = "translateX(0px) rotate(0deg)";
    }
});

function nextSong() {
    currentSongIndex++;
    songCard.classList.remove("swipe-right", "swipe-left");
    songCard.style.transition = "none";
    songCard.style.transform = "translateX(0px) rotate(0deg)";

    if (currentSongIndex < songs.length) {
        displaySong();
    } else {
        alert("End of Presentation Songs!"); // 
        currentSongIndex = 0; // 
        displaySong();
    }
}

document.getElementById("liked-songs-btn").addEventListener("click", () => {
    window.location.href = "LikedSongs.html";
});
