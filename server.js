require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());

// Spotify credentials
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

// Global variable to store the access token after Spotify authorization
let accessToken = null;

// Middleware to serve static files from the 'public' directory
app.use(express.static('public'));

// Route to initiate Spotify authorization
app.get('/auth', (req, res) => {
    const scope = "user-library-read user-top-read";
    const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `show_dialog=true`;  // 

    console.log("Redirecting user to:", authUrl);
    res.redirect(authUrl);
});



app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.send("Error: No code received from Spotify.");
    }

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            },
            headers: {
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

        accessToken = response.data.access_token; // Store token globally

        console.log("Access Token:", accessToken);

        // ✅ Redirect back to the frontend (make sure it's running!)
        res.redirect(`http://localhost:3000/?access_token=${accessToken}`);
    } catch (error) {
        console.error("Error exchanging code for token:", error.response?.data || error.message);
        res.send("Error getting access token.");
    }
});







// Endpoint to send the access token
app.get('/get-access-token', (req, res) => {
    if (accessToken) {
        res.json({ access_token: accessToken });
    } else {
        res.status(401).send('No access token available');
    }
});

// Route to get the artist's top tracks
app.get('/artist/:id/top-tracks', async (req, res) => {
    const artistId = req.params.id;
    const accessToken = req.query.access_token;  // The access token sent as a query parameter

    try {
        const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const topTracks = response.data.tracks;
        res.json(topTracks); // Return top tracks to the frontend
    } catch (error) {
        console.error('Error fetching artist top tracks:', error);
        res.send('Error fetching artist top tracks');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
