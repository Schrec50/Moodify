let currentSongIndex = 0;
let songs = [];
let songCard, songCardWrapper;
let startX, isHolding = false;
const threshold = 200;

document.addEventListener("DOMContentLoaded", () => {
    songCard = document.getElementById("song-card");
    songCardWrapper = document.getElementById("song-card-wrapper");

    fetchRecommendations();

    // Hook up Liked Songs button
    const likedSongsBtn = document.getElementById("liked-songs-btn");
    if (likedSongsBtn) {
        likedSongsBtn.addEventListener("click", () => {
            window.location.href = "LikedSongs.html";
        });
    }
});

async function fetchRecommendations() {
    try {
        console.log("Fetching recommendations...");
        const response = await fetch('http://localhost:5000/get-recommendations');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        songs = await response.json();
        if (!songs || songs.length === 0) throw new Error("No songs received");

        currentSongIndex = 0;
        displaySong();
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        alert("Failed to fetch recommendations. Check console for details.");
    }
}

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

// Swipe interaction logic
document.addEventListener("mousedown", (event) => {
    if (!songCardWrapper?.contains(event.target)) return;
    isHolding = true;
    startX = event.clientX;
    songCard.style.transition = "none";
});

document.addEventListener("mousemove", (event) => {
    if (!isHolding) return;
    let diff = event.clientX - startX;
    songCard.style.transform = `translateX(${diff}px) rotate(${diff / 10}deg)`;
});

document.addEventListener("mouseup", (event) => {
    if (!isHolding) return;
    isHolding = false;

    let diff = event.clientX - startX;
    const cardRect = songCard.getBoundingClientRect();
    songCard.style.transition = "transform 0.3s ease-out";

    if (diff > threshold || cardRect.right > window.innerWidth - 150) {
        songCard.classList.add("swipe-right");
        likeSong(songs[currentSongIndex]);
        setTimeout(nextSong, 300);
    } else if (diff < -threshold || cardRect.left < 150) {
        songCard.classList.add("swipe-left");
        setTimeout(() => {
            nextSong();
            songCard.classList.remove("swipe-left");
        }, 300);
    } else {
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
        fetchRecommendations(); // Loop back to a fresh set if needed
    }
}

async function likeSong(song) {
    const songData = {
        spotify_id: song.id,
        title: song.name,
        artist: song.artists[0]?.name || "Unknown Artist",
        album: song.album.name || "Unknown Album",
        image_url: song.album.images[0]?.url || "default.jpg"
    };

    try {
        const response = await fetch('http://localhost:5000/like-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(songData)
        });
        const result = await response.json();
        console.log("Liked song saved:", result);
    } catch (error) {
        console.error("Failed to save liked song:", error);
    }
}
