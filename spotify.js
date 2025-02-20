document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const userId = params.get('user_id');

    if (accessToken) {
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_user_id', userId);
        document.getElementById("login-section").style.display = "none";
    }
});

document.getElementById('recommend-btn').addEventListener('click', getRecommendations);

async function getRecommendations() {
    try {
        const response = await fetch('http://localhost:5000/get-recommendations');
        
        if (!response.ok) {
            alert("Failed to get recommendations.");
            return;
        }

        const data = await response.json();
        displayTopTracks(data);
    } catch (error) {
        alert("Error getting recommended songs.");
    }
}

function displayTopTracks(tracks) {
    const trackList = document.getElementById('track-list');
    trackList.innerHTML = '';

    tracks.forEach(track => {
        const listItem = document.createElement('li');
        listItem.textContent = track.name;

        // Create a button container
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        // Like button
        const likeButton = document.createElement('button');
        likeButton.textContent = "Like";
        likeButton.onclick = () => likeSong(track, listItem);

        // Dislike button
        const dislikeButton = document.createElement('button');
        dislikeButton.textContent = "Dislike";
        dislikeButton.onclick = () => removeSongFromList(listItem);

        // Append buttons inside the button container
        buttonContainer.appendChild(likeButton);
        buttonContainer.appendChild(dislikeButton);

        // Append everything to list item
        listItem.appendChild(buttonContainer);
        trackList.appendChild(listItem);
    });
}


async function likeSong(track, listItem) {
    const songData = {
        spotify_id: track.id,
        title: track.name,
        artist: track.artists[0]?.name || "Unknown Artist",
        album: track.album.name || "Unknown Album",
        preview_url: track.preview_url || null,
        image_url: track.album.images[0]?.url || null
    };

    try {
        const response = await fetch('http://localhost:5000/like-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(songData)
        });

        const data = await response.json();
        console.log("Song stored in database:", data);

        // Remove song from list after liking
        removeSongFromList(listItem);
    } catch (error) {
        console.error("Error storing song in database:", error);
    }
}


function removeSongFromList(listItem) {
    listItem.remove();

    // Check if all songs are gone
    const trackList = document.getElementById('track-list');
    if (trackList.children.length === 0) {
        document.getElementById('generate-playlist-section').style.display = 'block';
    }
}

async function generatePlaylist() {
    const userId = localStorage.getItem('spotify_user_id');

    if (!userId) {
        alert("User ID not found. Try logging in again.");
        return;
    }

    let playlistName = prompt("Enter a name for your playlist:", "Moodify Playlist");
    if (!playlistName || playlistName.trim() === "") {
        alert("Playlist name is required.");
        return;
    }
    playlistName = playlistName.trim();

    try {
        console.log("Sending request to generate playlist...");
        const response = await fetch('http://localhost:5000/generate-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, playlist_name: playlistName })
        });

        const data = await response.json();
        console.log("Playlist Generation Response:", data);

        if (response.ok) {
            alert(`Playlist "${playlistName}" successfully created in your Spotify account!`);
        } else {
            alert("Failed to generate playlist: " + data.error);
        }
    } catch (error) {
        console.error("Error generating playlist:", error);
        alert("An error occurred while generating the playlist.");
    }
}
