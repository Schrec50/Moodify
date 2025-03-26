let currentSongIndex = 0;
let songs = [];
let songCard, songCardWrapper;
let startX, isHolding = false;
const threshold = 200;


//Search for song and refresh song card
async function searchAndInjectSong() {
    const query = document.getElementById("song-search-input").value;
    if (!query) return;

    try {
        const response = await fetch(`http://localhost:5000/search-track?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search failed");

        const track = await response.json();
        songs.splice(currentSongIndex, 0, track);
        displaySong();
    } catch (error) {
        alert("No results or error searching.");
        console.error(error);
    }
}




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

//Fetch Recommendations from web api.
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

//Display Song to song card
function displaySong() {
    if (currentSongIndex >= songs.length) {
        alert("No more songs to display");
        return;
    }

    // Hide everything before loading
    songCard.style.opacity = "0";
    document.getElementById("left-zone").style.opacity = "0";
    document.getElementById("right-zone").style.opacity = "0";

    const song = songs[currentSongIndex];
    console.log("Displaying song:", song);

    // Set song details
    document.getElementById("song-image").src = song.album.images[0]?.url || "default.jpg";
    document.getElementById("song-title").textContent = song.name;
    document.getElementById("song-artist").textContent = song.artists[0]?.name || "Unknown Artist";
    document.getElementById("song-album").textContent = song.album.name || "Unknown Album";

    songCard.style.transform = "translateX(0px) rotate(0deg)";

    // Fade everything in together
    setTimeout(() => {
        songCard.style.opacity = "1";
        document.getElementById("left-zone").style.opacity = "1";
        document.getElementById("right-zone").style.opacity = "1";
    }, 50);
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

    songCard.style.opacity = "0";
    document.getElementById("left-zone").style.opacity = "0";
    document.getElementById("right-zone").style.opacity = "0";


    // Reset swipe-related styles
    songCard.classList.remove("swipe-right", "swipe-left");
    songCard.style.transition = "none";
    songCard.style.transform = "translateX(0px) rotate(0deg)";
    songCard.style.opacity = "0"; // Hide card before showing next

    if (currentSongIndex < songs.length) {
        // Wait briefly so swipe-out feels natural before fading next song in
        setTimeout(() => {
            displaySong();
        }, 200); // Adjust as needed
    } else {
        fetchRecommendations(); // Loop back to fresh set
    }
}

//Like Song Button
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
