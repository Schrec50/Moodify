// ==================== STEP 1: Handle Access & Refresh Tokens ==================== //
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');

if (accessToken) {
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('token_timestamp', Date.now());

    if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
    window.history.replaceState({}, document.title, "/");
}

// ==================== STEP 2: Retrieve Stored Token ==================== //
function getStoredToken() {
    const token = localStorage.getItem('spotify_access_token');
    const storedTime = localStorage.getItem('token_timestamp');
    const expiresIn = 3600 * 1000;

    // Ensure token exists and is still valid
    if (token && Date.now() - storedTime < expiresIn) {
        console.log("Using stored token:", token);
        return token;
    }

    console.warn("Token missing or expired.");
    return null;
}


// ==================== STEP 3: Refresh Access Token if Expired ==================== //
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
        console.error("No refresh token available. User must log in again.");
        alert("Session expired. Please log in again.");
        localStorage.clear();
        location.reload();
        return null;
    }

    const response = await fetch(`http://localhost:5000/refresh-token?refresh_token=${refreshToken}`);
    const data = await response.json();

    if (data.access_token) {
        console.log("New Access Token:", data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('token_timestamp', Date.now());
        return data.access_token;
    }

    console.error("Failed to refresh token:", data);
    localStorage.clear();
    location.reload();
    return null;
}


// ==================== STEP 4: Toggle Visibility Based on Login Status ==================== //
document.addEventListener("DOMContentLoaded", () => {
    const token = getStoredToken();
    if (token) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("search-section").style.display = "block";
    } else {
        console.log("No valid token found. Showing login section.");
        document.getElementById("login-section").style.display = "block";
        document.getElementById("search-section").style.display = "none";
    }
});


// ==================== STEP 5: Search for an Artist ==================== //
async function searchArtist() {
    const artistName = document.getElementById('artist-name').value.trim();
    if (!artistName) return alert('Please enter an artist name');

    const token = getStoredToken();
    if (!token) {
        alert('Session expired. Please log in again.');
        location.reload();
        return;
    }

    const response = await fetch(`http://localhost:5000/search-artist?q=${encodeURIComponent(artistName)}`);
    const data = await response.json();

    if (!data.artists || !data.artists.items.length) return alert('Artist not found. Try another name.');
    
    fetchTopTracks(data.artists.items[0].id);
}

// ==================== STEP 6: Fetch & Display Artist’s Top Tracks ==================== //
async function fetchTopTracks(artistId) {
    const token = getStoredToken();
    if (!token) {
        alert('Session expired. Please log in again.');
        location.reload();
        return;
    }

    const response = await fetch(`http://localhost:5000/artist/${artistId}/top-tracks`);
    displayTopTracks(await response.json());
}

// ==================== STEP 7: Display Tracks on the Page ==================== //
function displayTopTracks(tracks) {
    const trackList = document.getElementById('track-list');
    trackList.innerHTML = '';

    tracks.forEach(track => {
        const listItem = document.createElement('li');
        listItem.textContent = track.name;
        trackList.appendChild(listItem);
    });
}

// ==================== STEP 8: Attach Event Listener to Search Button ==================== //
document.getElementById('search-btn').addEventListener('click', searchArtist);
