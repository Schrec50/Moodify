require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// ==================== Initialize MySQL Connection ==================== //
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'moodify',
    port: 3308
});

db.connect(err => {
    if (err) throw err;
    console.log("Successfully Connected to MySQL");
});

// ==================== Initialize Spotify API Client ==================== //
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

// ==================== Authenticate with Spotify ==================== //
app.get('/auth', (req, res) => {
    const scopes = [
        'user-top-read',        // Needed for recommendations
        'user-library-read',    // Needed for fetching saved tracks
        'playlist-modify-public', // Needed to create public playlists
        'playlist-modify-private' // Needed to create private playlists
    ];
    res.redirect(spotifyApi.createAuthorizeURL(scopes, 'state-token'));
});



// ==================== Handle Spotify Callback & Retrieve Tokens ==================== //
app.get('/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.send("Error: No code received from Spotify.");

        const data = await spotifyApi.authorizationCodeGrant(code);
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        console.log("New Access Token:", data.body['access_token']);
        console.log("New Refresh Token:", data.body['refresh_token']);

        const userData = await spotifyApi.getMe();
        const userId = userData.body.id;

        res.redirect(`http://127.0.0.1:5500/Page2.html?access_token=${data.body['access_token']}&refresh_token=${data.body['refresh_token']}&user_id=${userId}`);
    } catch (error) {
        console.error("Spotify Auth Error:", error);
        res.status(500).send("Error during authentication.");
    }
});

// ==================== Get Recommended Songs ==================== //
app.get('/get-recommendations', async (req, res) => {
    try {
        const accessToken = spotifyApi.getAccessToken();
        if (!accessToken) {
            return res.status(401).json({ error: "Access token missing or invalid. Please log in again." });
        }

        // Step 1: Fetch 50 Top Artists
        const topArtistsData = await spotifyApi.getMyTopArtists({ limit: 50 });
        if (!topArtistsData.body.items.length) {
            return res.status(404).json({ error: "No top artists found. Please listen to more music on Spotify." });
        }

        const shuffledArtists = topArtistsData.body.items.sort(() => Math.random() - 0.5);
        let recommendedTracks = [];

        for (let i = 0; i < shuffledArtists.length; i++) {
            const artist = shuffledArtists[i];

            try {
                // Step 2: Fetch top tracks for the artist
                const topTracksData = await spotifyApi.getArtistTopTracks(artist.id, 'US');

                if (topTracksData.body.tracks.length > 0) {
                    const randomTrack = topTracksData.body.tracks[Math.floor(Math.random() * topTracksData.body.tracks.length)];
                    recommendedTracks.push(randomTrack);
                }
            } catch (error) {
                console.error(`Skipping artist ${artist.name} due to error:`, error.message);
            }

            // Stop after collecting 5 unique songs from 5 different artists
            if (recommendedTracks.length >= 5) break;
        }

        if (recommendedTracks.length === 0) {
            return res.status(500).json({ error: "No recommendations found. Try listening to more music." });
        }

        res.json(recommendedTracks);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ error: "Failed to fetch recommendations", details: error.message });
    }
});



// ==================== Store Liked Songs in MySQL ==================== //
app.post('/like-song', (req, res) => {
    const { spotify_id, title, artist, album, image_url } = req.body;

    if (!spotify_id || !title || !artist || !album || !image_url) {
        console.error("Missing data in request:", req.body);
        return res.status(400).json({ error: "Missing required song data." });
    }

    const sql = `INSERT INTO songs (spotify_id, title, artist, album, image_url) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP`;

    db.query(sql, [spotify_id, title, artist, album, image_url], (err) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send(err);
        }
        res.send({ message: "Song stored in database successfully" });
    });
});

// ==================== Generate Playlist & Add Songs ==================== //
app.post('/generate-playlist', async (req, res) => {
    try {
        const { user_id, playlist_name } = req.body;
        if (!user_id || !playlist_name?.trim()) {
            return res.status(400).json({ error: "User ID and Playlist name are required." });
        }

        // Create a new playlist on Spotify
        const playlistData = await spotifyApi.createPlaylist(user_id, {
            name: playlist_name.trim(),
            description: "Playlist generated from liked songs",
            public: false
        });

        if (!playlistData.body?.id) {
            return res.status(500).json({ error: "Failed to create playlist." });
        }

        const playlistId = playlistData.body.id;
        console.log(`Playlist "${playlist_name}" created with ID: ${playlistId}`);

        // Retrieve liked songs from the database
        db.query("SELECT spotify_id FROM songs", async (err, results) => {
            if (err) return res.status(500).json({ error: "Database error retrieving liked songs." });
            if (results.length === 0) return res.status(400).json({ error: "No liked songs found." });

            const trackUris = results.map(row => `spotify:track:${row.spotify_id}`);
            await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
            console.log(`Added ${trackUris.length} songs to playlist.`);

            res.json({ message: `Playlist "${playlist_name}" created successfully!`, playlistId });
        });

    } catch (error) {
        console.error("Error generating playlist:", error);
        res.status(500).json({ error: "Failed to generate playlist", details: error.message });
    }
});


// ==================== Clear Liked Songs and Generate Playlist (LikedSongs.js) ==================== //
// Get all liked songs
app.get('/get-liked-songs', (req, res) => {
    db.query("SELECT * FROM songs", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Clear all liked songs
app.post('/clear-liked-songs', (req, res) => {
    db.query("DELETE FROM songs", (err) => {
        if (err) return res.status(500).json({ error: "Failed to clear songs" });
        res.json({ message: "Liked songs cleared successfully" });
    });
});
// ==================== Search Songs (Searchbar/ Tinder.GUI) ==================== //
app.get('/search-track', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: "Missing search query." });

        const data = await spotifyApi.searchTracks(query, { limit: 1 });
        if (!data.body.tracks.items.length) return res.status(404).json({ error: "No track found." });

        res.json(data.body.tracks.items[0]);
    } catch (error) {
        console.error("Error in /search-track:", error);
        res.status(500).json({ error: "Search failed." });
    }
});



// ==================== Start Express Server ==================== //
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
