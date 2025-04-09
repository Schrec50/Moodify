document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded. Running Spotify authentication...");

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const userId = params.get('user_id');

    if (accessToken) {
        console.log("Access token found in URL. Storing in localStorage...");
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_user_id', userId);

        const loginSection = document.getElementById("login-section");
        if (loginSection) {
            loginSection.style.display = "none";
        }
    } else {
        console.log("Failed to find Access Token");
    }

    //Make sure Home page functions exist
    fetchSpotifyUserName();
    setupLogoutButton();
});

  //---------------------------------------------------Home Page Methods--------------------------------------------------//
function ensureElementExists(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID '${id}' NOT found in HTML!`);
    }
    return element;
}

async function fetchSpotifyUserName() {
    console.log("Running fetchSpotifyUserName()...");
    try {
        const accessToken = localStorage.getItem('spotify_access_token');

        if (!accessToken) {
            console.error("No access token found! Cannot fetch user data.");
            return;
        }

        console.log("Fetching user data from Spotify...");
        const response = await fetch("https://api.spotify.com/v1/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            console.error("Failed to fetch user data. Response:", await response.json());
            throw new Error("Failed to fetch user data.");
        }

        const data = await response.json();
        console.log("User data retrieved:", data);

        const userNameElement = ensureElementExists("spotify-user-name");
        if (userNameElement) {
            userNameElement.innerText = data.display_name;
            console.log("Updated username:", data.display_name);
        }
    } catch (error) {
        console.error("Error fetching Spotify user:", error);
        const userNameElement = ensureElementExists("spotify-user-name");
        if (userNameElement) {
            userNameElement.innerText = "Unknown User";
        }
    }
}

function setupLogoutButton() {
    console.log("Setting up logout button...");
    const logoutButton = ensureElementExists("logout-btn");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", () => {
        console.log("Logging out...");
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_user_id");
        sessionStorage.clear();
        setTimeout(() => {
            window.location.href = "Landingpage.html";
        }, 500);
    });
    console.log("Logout button is ready!");
}

//document.addEventListener("DOMContentLoaded", function () {
    //const recommendButton = ensureElementExists("recommend-btn");
   // if (recommendButton) {
        //recommendButton.addEventListener("click", getRecommendations);
  //  }
//});

    //-------------------------------------------------- Get Recomemndations--------------------------------------------------//
    async function getRecommendations() {
        const userId = localStorage.getItem('spotify_user_id');
        const accessToken = localStorage.getItem('spotify_access_token');
    
        try {
            const response = await fetch(`http://localhost:5000/get-recommendations?user_id=${userId}&access_token=${accessToken}`);
            if (!response.ok) {
                alert("Failed to get recommendations.");
                return;
            }
            const data = await response.json();
            displayTopTracks(data);
        } catch (error) {
            console.error("Error getting recommended songs:", error);
            alert("Error getting recommended songs.");
        }
    }
    

    //---------------------------------------------------Display Top Tracks--------------------------------------------------//
function displayTopTracks(tracks) {
    const trackList = ensureElementExists('track-list');
    if (!trackList) return;
    trackList.innerHTML = '';
    tracks.forEach(track => {
        const listItem = document.createElement('li');
        listItem.textContent = track.name;
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        const likeButton = document.createElement('button');
        likeButton.textContent = "Like";
        likeButton.onclick = () => likeSong(track, listItem);
        const dislikeButton = document.createElement('button');
        dislikeButton.textContent = "Dislike";
        dislikeButton.onclick = () => removeSongFromList(listItem);
        buttonContainer.appendChild(likeButton);
        buttonContainer.appendChild(dislikeButton);
        listItem.appendChild(buttonContainer);
        trackList.appendChild(listItem);
    });
}

    //---------------------------------------------------Like Song--------------------------------------------------//
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
        removeSongFromList(listItem);
    } catch (error) {
        console.error("Error storing song in database:", error);
    }
}

function removeSongFromList(listItem) {
    listItem.remove();
    const trackList = ensureElementExists('track-list');
    if (trackList && trackList.children.length === 0) {
        const generateSection = ensureElementExists('generate-playlist-section');
        if (generateSection) {
            generateSection.style.display = 'block';
        }
    }
}

    //---------------------------------------------------Generate Playlist--------------------------------------------------//
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
        const response = await fetch('http://localhost:5000/generate-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, playlist_name: playlistName })
        });
        const data = await response.json();
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
