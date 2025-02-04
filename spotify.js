// Extract the access token from the URL after redirection
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');

if (accessToken) {
    console.log("Access Token:", accessToken);
    // Store the token for later use (e.g., in localStorage or a variable)
    localStorage.setItem('spotify_access_token', accessToken);
}


// Function to search for an artist and get top tracks
async function searchArtist() {
    const artistName = document.getElementById('artist-name').value;
    if (!artistName) {
        alert('Please enter an artist name');
        return;
    }

    try {
        // Fetch the access token from the server (ensure access token is available after auth)
        const tokenResponse = await fetch('http://localhost:5000/get-access-token'); // Adjust as needed
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch the artist ID using the search API
        const artistResponse = await fetch(`https://api.spotify.com/v1/search?q=${artistName}&type=artist&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const artistData = await artistResponse.json();
        const artistId = artistData.artists.items[0].id; // Get the first artist's ID

        // Fetch the artist's top tracks
        const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const topTracks = await topTracksResponse.json();

        displayTopTracks(topTracks);
    } catch (error) {
        console.error('Error searching for artist:', error);
    }
}

// Function to display the top tracks in the HTML
function displayTopTracks(topTracks) {
    const trackList = document.getElementById('track-list');
    trackList.innerHTML = ''; // Clear previous results

    topTracks.tracks.forEach(track => {
        const listItem = document.createElement('li');
        listItem.textContent = track.name;
        trackList.appendChild(listItem);
    });
}