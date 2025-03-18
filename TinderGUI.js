let currentSongIndex = 0;
let songs = [];
let songCard = document.getElementById("song-card");
let songCardWrapper = document.getElementById("song-card-wrapper");
let startX, isHolding = false;
const threshold = 200; // Increase threshold to ensure swipe

async function fetchRecommendations() {
    try {
        console.log("Fetching recommendations...");
        const response = await fetch('http://localhost:5000/get-recommendations');
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        songs = await response.json();
        console.log("Received songs:", songs);
        
        if (!songs || songs.length === 0) throw new Error("No songs received");
        
        currentSongIndex = 0;
        displaySong();
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        alert("Failed to fetch recommendations. Check console for details.");
    }
}

fetchRecommendations(); // Automatically fetch recommendations on page load

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
    if (!songCardWrapper.contains(event.target)) return; // Ensure click is inside the expanded area
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
        // Right swipe (Like), triggers if:
        // - diff is greater than threshold (normal behavior)
        // - OR the card has moved close to the right edge
        console.log("Right swipe detected:", diff, "Card Right Position:", cardRect.right);
        songCard.classList.add("swipe-right");
        likeSong(songs[currentSongIndex]);
        setTimeout(nextSong, 300);
    } else if (diff < -threshold || cardRect.left < 150) {
        // Left swipe (Dislike), same logic as before
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
        fetchRecommendations();
    }
}