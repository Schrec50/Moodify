require('dotenv').config();
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
const port = 5000;

// Enable CORS (allow frontend to communicate with backend)
app.use(cors());

// Spotify API setup using spotify-web-api-node
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

// ==================== STEP 1: Redirect User to Spotify Login ==================== //
app.get('/auth', (req, res) => {
    const scopes = ['user-library-read', 'user-top-read'];
    const authUrl = spotifyApi.createAuthorizeURL(scopes, 'state-token'); // 'state-token' is optional

    console.log("Redirecting user to:", authUrl);
    res.redirect(authUrl);
});

// ==================== STEP 2: Handle Spotify Callback and Retrieve Token ==================== //
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send("Error: No code received from Spotify.");
    }

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);

        // Store both access and refresh tokens
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);

        // Redirect user to frontend with both tokens in the URL
        res.redirect(`http://127.0.0.1:5500/index.html?access_token=${accessToken}&refresh_token=${refreshToken}`);
    } catch (error) {
        console.error("Error exchanging code for token:", error);
        res.send("Error getting access token.");
    }
});


// ==================== STEP 3: Provide Access Token to Frontend ==================== //
app.get('/get-access-token', (req, res) => {
    const accessToken = spotifyApi.getAccessToken();

    if (accessToken) {
        res.json({ access_token: accessToken });
    } else {
        res.status(401).send('No access token available');
    }
});

// ==================== STEP 4: Fetch Artist’s Top Tracks ==================== //
app.get('/artist/:id/top-tracks', async (req, res) => {
    try {
        const artistId = req.params.id;
        const data = await spotifyApi.getArtistTopTracks(artistId, 'US'); // Fetches top tracks for the given artist

        res.json(data.body.tracks); // Sends top tracks to frontend
    } catch (error) {
        console.error('Error fetching artist top tracks:', error);
        res.status(500).send('Error fetching artist top tracks');
    }
});

// ==================== STEP 5: Start the Server ==================== //
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// ==================== NEW ROUTE: Search for an Artist ==================== //
app.get('/search-artist', async (req, res) => {
    try {
        const artistName = req.query.q;
        if (!artistName) {
            return res.status(400).send('Artist name is required');
        }

        // Ensure we have an access token
        let accessToken = spotifyApi.getAccessToken();
        if (!accessToken) {
            console.log("Access token is missing, attempting to refresh...");
            try {
                const refreshData = await spotifyApi.refreshAccessToken();
                spotifyApi.setAccessToken(refreshData.body['access_token']);
                accessToken = refreshData.body['access_token'];
                console.log("New Access Token:", accessToken);
            } catch (refreshError) {
                console.error("Failed to refresh token:", refreshError);
                return res.status(401).send('Failed to refresh access token');
            }
        }

        console.log("Using Access Token:", accessToken);

        // Search for the artist
        const data = await spotifyApi.searchArtists(artistName);
        res.json(data.body);
    } catch (error) {
        console.error('Error searching for artist:', error);
        res.status(500).send('Error searching for artist');
    }
});

// ==================== STEP 3: Refresh Access Token ==================== //
app.get('/refresh-token', async (req, res) => {
    const refreshToken = req.query.refresh_token;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body['access_token'];

        console.log("New Access Token (Refreshed):", newAccessToken);
        spotifyApi.setAccessToken(newAccessToken);

        res.json({ access_token: newAccessToken });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ error: "Failed to refresh token" });
    }
});

