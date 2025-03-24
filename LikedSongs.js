
//---------------------------------------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", loadLikedSongs);

// Handle Playlist Generation
document.getElementById("generate-playlist-btn").addEventListener("click", async () => {
    const userId = localStorage.getItem('spotify_user_id');
    if (!userId) return alert("User ID not found. Try logging in again.");

    let playlistName = prompt("Enter a name for your playlist:", "Moodify Playlist");
    if (!playlistName) return;

    const response = await fetch('http://localhost:5000/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, playlist_name: playlistName })
    });

    const data = await response.json();
    alert(response.ok ? `Playlist "${playlistName}" created successfully!` : `Error: ${data.error}`);
});

// Handle Clearing Liked Songs
document.getElementById("clear-liked-songs-btn").addEventListener("click", async () => {
    if (!confirm("Are you sure you want to clear all liked songs? This cannot be undone.")) return;

    await fetch('http://localhost:5000/clear-liked-songs', { method: 'POST' });
    alert("All liked songs have been cleared.");
    loadLikedSongs(); // Refresh list
});

document.addEventListener("DOMContentLoaded", loadLikedSongs);

async function loadLikedSongs() {
    const response = await fetch('http://localhost:5000/get-liked-songs');
    const songs = await response.json();
    const container = document.getElementById("liked-songs-list");
    container.innerHTML = ""; // Clear previous entries

    songs.forEach(song => {
        const songElement = document.createElement("div");
        songElement.classList.add("song-card");

        songElement.innerHTML = `
            <img src="${song.image_url}" alt="Album Cover">
            <h3>${song.title}</h3>
            <p>${song.artist}</p>
            <p>${song.album}</p>
        `;

        container.appendChild(songElement);
    });
}
