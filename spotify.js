// ==================== STEP 1: Handle Access & Refresh Tokens ==================== //
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');

if (accessToken) {
    console.log("New Access Token received:", accessToken);
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('token_timestamp', Date.now()); // Store timestamp

    if (refreshToken) {
        console.log("New Refresh Token received:", refreshToken);
        localStorage.setItem('spotify_refresh_token', refreshToken);
    }

    window.history.replaceState({}, document.title, "/"); // Remove tokens from URL
}

// Retrieve stored tokens
function getStoredToken() {
    const token = localStorage.getItem('spotify_access_token');
    const storedTime = localStorage.getItem('token_timestamp');
    const expiresIn = 3600 * 1000; // 1 hour validity

    if (!token || (Date.now() - storedTime > expiresIn)) {
        console.warn("Token expired. Attempting refresh...");
        return refreshAccessToken(); // Attempt refresh before logging out
    }
    return token;
}

// Attempt to refresh token using backend
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
        console.error("No refresh token available. User must log in again.");
        alert("Session expired. Please log in again.");
        localStorage.clear();
        location.reload();
        return null;
    }

    try {
        const response = await fetch(`http://localhost:5000/refresh-token?refresh_token=${refreshToken}`);
        const data = await response.json();

        if (data.access_token) {
            console.log("New Access Token:", data.access_token);
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('token_timestamp', Date.now());
            return data.access_token;
        } else {
            console.error("Failed to refresh token:", data);
            localStorage.clear();
            location.reload();
            return null;
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
        localStorage.clear();
        location.reload();
        return null;
    }
}

// Show search section if logged in, otherwise show login
document.addEventListener("DOMContentLoaded", function () {
    if (getStoredToken()) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("search-section").style.display = "block";
    }
});


// Retrieve stored token
function getStoredToken() {
    const token = localStorage.getItem('spotify_access_token');
    const storedTime = localStorage.getItem('token_timestamp');
    const expiresIn = 3600 * 1000; // Token validity (1 hour)

    if (!token || (Date.now() - storedTime > expiresIn)) {
        console.warn("Token missing or expired. User must log in again.");
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('token_timestamp');
        return null;
    }
    return token;
}

// Show search section if logged in, otherwise show login
document.addEventListener("DOMContentLoaded", function () {
    if (getStoredToken()) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("search-section").style.display = "block";
    }
});

// ==================== STEP 2: Search for an Artist ==================== //
async function searchArtist() {
    const artistName = document.getElementById('artist-name').value.trim();
    if (!artistName) {
        alert('Please enter an artist name');
        return;
    }

    try {
        const token = getStoredToken();
        if (!token) {
            alert('Session expired. Please log in again.');
            location.reload();
            return;
        }

        const response = await fetch(`http://localhost:5000/search-artist?q=${encodeURIComponent(artistName)}`);
        const data = await response.json();

        if (!data.artists || data.artists.items.length === 0) {
            alert('Artist not found. Try another name.');
            return;
        }

        const artistId = data.artists.items[0].id;
        fetchTopTracks(artistId);
    } catch (error) {
        console.error('Error searching for artist:', error);
    }
}

// ==================== STEP 3: Fetch & Display Artist's Top Tracks ==================== //
async function fetchTopTracks(artistId) {
    try {
        const token = getStoredToken();
        if (!token) {
            alert('Session expired. Please log in again.');
            location.reload();
            return;
        }

        const response = await fetch(`http://localhost:5000/artist/${artistId}/top-tracks`);
        const tracks = await response.json();

        displayTopTracks(tracks);
    } catch (error) {
        console.error('Error fetching top tracks:', error);
    }
}

// ==================== STEP 4: Display Tracks on the Page ==================== //
function displayTopTracks(tracks) {
    const trackList = document.getElementById('track-list');
    trackList.innerHTML = ''; // Clear previous results

    tracks.forEach(track => {
        const listItem = document.createElement('li');
        listItem.textContent = track.name;
        trackList.appendChild(listItem);
    });
}

// Attach event listener to the search button
document.getElementById('search-btn').addEventListener('click', searchArtist);
