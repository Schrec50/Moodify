//---------------------------------------- Global Swipe State ----------------------------------------//
let currentSongIndex = 0;
let songs = [];
let songCard, songCardWrapper;
let startX, isHolding = false;
const threshold = 200;
let undoStack = [];

//---------------------------------------- DOM Ready Events ----------------------------------------//
document.addEventListener("DOMContentLoaded", () => {
    songCard = document.getElementById("song-card");
    songCardWrapper = document.getElementById("song-card-wrapper");

    fetchRecommendations();

    const likedSongsBtn = document.getElementById("liked-songs-btn");
    if (likedSongsBtn) {
        likedSongsBtn.addEventListener("click", () => {
            window.location.href = "/html/LikedSongs.html";
        });
    }
});

//---------------------------------------- Fetch Recommendations from API ----------------------------------------//
async function fetchRecommendations() {
    try {
        const userId = localStorage.getItem('spotify_user_id');
        const accessToken = localStorage.getItem('spotify_access_token');
        if (!userId || !accessToken) throw new Error("Missing credentials");

        const response = await fetch(`http://localhost:5000/get-recommendations?user_id=${userId}&access_token=${accessToken}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        songs = await response.json();
        if (!songs || songs.length === 0) throw new Error("No songs received");

        currentSongIndex = 0;
        displaySong();
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        alert("Failed to fetch recommendations.");
    }
}

//---------------------------------------- Display a Song on the Card ----------------------------------------//
async function displaySong() {
    if (currentSongIndex >= songs.length) {
        alert("No more songs to display");
        return;
    }

    const song = songs[currentSongIndex];
    document.getElementById("song-image").src = song.album.images[0]?.url || "default.jpg";
    document.getElementById("song-title").textContent = song.name;
    document.getElementById("song-artist").textContent = song.artists[0]?.name || "Unknown Artist";
    document.getElementById("song-album").textContent = song.album.name || "Unknown Album";
    document.getElementById("song-genre").textContent = song.track_genre || "Unknown Genre";

    songCard.style.transform = "translateX(0px) rotate(0deg)";
    setTimeout(() => {
        songCard.style.opacity = "1";
        document.getElementById("left-zone").style.opacity = "1";
        document.getElementById("right-zone").style.opacity = "1";
    }, 50);
}

//---------------------------------------- Swipe Logic ----------------------------------------//
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
        setTimeout(() => nextSong(true), 300); // Pass `true` for liked
    } else if (diff < -threshold || cardRect.left < 150) {
        songCard.classList.add("swipe-left");
        setTimeout(() => {
            nextSong(false);
            songCard.classList.remove("swipe-left");
        }, 300);
    }else {
        songCard.style.transform = "translateX(0px) rotate(0deg)";
    }
});

//---------------------------------------- Move to Next Song ----------------------------------------//
function nextSong(liked = false) {
    const current = songs[currentSongIndex];
    if (current) {
        undoStack.push({ ...current, wasLiked: liked });

        // Log swipe to backend
        const userId = localStorage.getItem('spotify_user_id');
        const action = liked ? 'like' : 'dislike';
        const genre = current.track_genre || "Unknown";

        if (userId && current.id) {
            fetch('http://localhost:5000/log-swipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    track_id: current.id,
                    track_genre: genre,
                    action: action
                })
            }).catch(err => console.error("Failed to log swipe:", err));
        }
    }

    currentSongIndex++;
    songCard.style.opacity = "0";
    document.getElementById("left-zone").style.opacity = "0";
    document.getElementById("right-zone").style.opacity = "0";

    songCard.classList.remove("swipe-right", "swipe-left");
    songCard.style.transition = "none";
    songCard.style.transform = "translateX(0px) rotate(0deg)";
    songCard.style.opacity = "0";

    if (currentSongIndex < songs.length) {
        setTimeout(() => displaySong(), 200);
    } else {
        fetchRecommendations();
    }
}


//---------------------------------------- Undo Song Swipe----------------------------------------//
function undoSwipe() {
    if (undoStack.length === 0) {
        alert("No Previous Swipe Stored!");
        return;
    }

    const lastEntry = undoStack.pop();
    const { id, wasLiked } = lastEntry;

    // Clean duplicate
    songs = songs.filter(song => song.id !== id);

    // remove from DB if it was liked
    if (wasLiked) {
        fetch('http://localhost:5000/unlike-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spotify_id: id })
        }).then(res => res.json())
          .then(data => console.log("Undo: song removed from DB", data))
          .catch(err => console.error("Undo: Failed to remove song from DB", err));
    }

    currentSongIndex = Math.max(0, currentSongIndex - 1);
    songs.splice(currentSongIndex, 0, lastEntry);
    displaySong();
}


//---------------------------------------- Like Song & Save ----------------------------------------//
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

//---------------------------------------- Manual Search Song ----------------------------------------//
async function searchAndInjectSong() {
    const query = document.getElementById("song-search-input").value;
    const token = localStorage.getItem('spotify_access_token');
    if (!query || !token) return;

    try {
        const response = await fetch(`http://localhost:5000/search-track?q=${encodeURIComponent(query)}&access_token=${token}`);
        if (!response.ok) throw new Error("Search failed");

        const track = await response.json();
        songs.splice(currentSongIndex, 0, track);
        displaySong();
    } catch (err) {
        console.error("Search error:", err);
        alert("Search failed or no track found");
    }
}

document.getElementById("song-genre").textContent = song.track_genre || "Unknown Genre";
