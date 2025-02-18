require('dotenv').config();
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
const port = 5000;

app.use(cors());

// ==================== STEP 1: Initialize Spotify API Client ==================== //
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

// ==================== STEP 2: Redirect User to Spotify Login ==================== //
app.get('/auth', (req, res) => {
    const scopes = ['user-library-read', 'user-top-read'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes, 'state-token'));
});

// ==================== STEP 3: Handle Spotify Callback & Retrieve Tokens ==================== //
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("Error: No code received from Spotify.");

    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);

    res.redirect(`http://127.0.0.1:5500/index.html?access_token=${data.body['access_token']}&refresh_token=${data.body['refresh_token']}`);
});

// ==================== STEP 4: Provide Access Token to Frontend ==================== //
app.get('/get-access-token', (req, res) => {
    const accessToken = spotifyApi.getAccessToken();
    accessToken ? res.json({ access_token: accessToken }) : res.status(401).send('No access token available');
});

// ==================== STEP 5: Fetch Artist’s Top Tracks ==================== //
app.get('/artist/:id/top-tracks', async (req, res) => {
    const artistId = req.params.id;
    const data = await spotifyApi.getArtistTopTracks(artistId, 'US');
    res.json(data.body.tracks);
});

// ==================== STEP 6: Search for an Artist ==================== //
app.get('/search-artist', async (req, res) => {
    const artistName = req.query.q;
    if (!artistName) return res.status(400).send('Artist name is required');

    let accessToken = spotifyApi.getAccessToken();
    if (!accessToken) {
        const refreshData = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(refreshData.body['access_token']);
        accessToken = refreshData.body['access_token'];
    }

    const data = await spotifyApi.searchArtists(artistName);
    res.json(data.body);
});


// ==================== STEP 7: Refresh Access Token ==================== //
app.get('/refresh-token', async (req, res) => {
    const refreshToken = req.query.refresh_token;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });

    try {
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body['access_token'];
        spotifyApi.setAccessToken(newAccessToken);

        console.log("New Access Token:", newAccessToken);
        res.json({ access_token: newAccessToken });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ error: "Failed to refresh token" });
    }
});


// ==================== STEP 8: Start the Express Server ==================== //
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
