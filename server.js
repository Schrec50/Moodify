//---------------------------------------- Environment Setup ----------------------------------------//
require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

//---------------------------------------- MySQL Connection ----------------------------------------//
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'JavaFantasy321!',
    database: 'moodify',
    port: 3308
});
db.connect(err => {
    if (err) throw err;
    console.log("Successfully Connected to MySQL");
});

//---------------------------------------- Spotify API Client Setup ----------------------------------------//
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

//---------------------------------------- Spotify Auth Route ----------------------------------------//
app.get('/auth', (req, res) => {
    const scopes = [
        'user-top-read',
        'user-library-read',
        'playlist-modify-public',
        'playlist-modify-private'
    ];
    res.redirect(spotifyApi.createAuthorizeURL(scopes, 'state-token'));
});

//---------------------------------------- Spotify Callback Handler ----------------------------------------//
app.get('/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.send("Error: No code received from Spotify.");

        const data = await spotifyApi.authorizationCodeGrant(code);
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        const userData = await spotifyApi.getMe();
        const userId = userData.body.id;

        res.redirect(`http://127.0.0.1:5500/Page2.html?access_token=${data.body['access_token']}&refresh_token=${data.body['refresh_token']}&user_id=${userId}`);
    } catch (error) {
        console.error("Spotify Auth Error:", error);
        res.status(500).send("Error during authentication.");
    }
});

//---------------------------------------- Get Recommendations (from Preferences + Spotify API) ----------------------------------------//
app.get('/get-recommendations', async (req, res) => {
    const userId = req.query.user_id;
    const accessToken = req.query.access_token;

    if (!userId || !accessToken) {
        return res.status(400).json({ error: "Missing user_id or access_token" });
    }

    spotifyApi.setAccessToken(accessToken);

    const sql = "SELECT * FROM user_preferences WHERE user_id = ?";
    db.query(sql, [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ error: "Preferences not found" });
        }

        const prefs = results[0];
        const genres = prefs.genres.split(',').map(g => g.trim()).filter(Boolean);
        if (genres.length === 0) return res.status(400).json({ error: "No valid genres in preferences" });

        const clamp = (val, min, max) => Math.max(min, Math.min(val, max));
        const tol = 0.3, tempoMargin = 40;

        const query = `
            SELECT * FROM tracks
            WHERE track_genre IN (${genres.map(() => '?').join(',')})
              AND danceability BETWEEN ? AND ?
              AND energy BETWEEN ? AND ?
              AND liveness BETWEEN ? AND ?
              AND valence BETWEEN ? AND ?
              AND tempo BETWEEN ? AND ?
              AND speechiness BETWEEN ? AND ?
              AND acousticness BETWEEN ? AND ?
            ORDER BY RAND()
            LIMIT 100
        `;

        const values = [
            ...genres,
            clamp(prefs.danceability - tol, 0, 1), clamp(prefs.danceability + tol, 0, 1),
            clamp(prefs.energy - tol, 0, 1), clamp(prefs.energy + tol, 0, 1),
            clamp(prefs.liveness - tol, 0, 1), clamp(prefs.liveness + tol, 0, 1),
            clamp(prefs.valence - tol, 0, 1), clamp(prefs.valence + tol, 0, 1),
            clamp(prefs.tempo - tempoMargin, 0, 250), clamp(prefs.tempo + tempoMargin, 0, 250),
            clamp(prefs.speechiness - tol, 0, 1), clamp(prefs.speechiness + tol, 0, 1),
            clamp(prefs.acousticness - tol, 0, 1), clamp(prefs.acousticness + tol, 0, 1),
        ];

        db.query(query, values, async (err, tracks) => {
            if (err || tracks.length === 0) {
                console.warn("Fallback triggered");
                const fallback = `SELECT * FROM tracks WHERE track_genre IN (${genres.map(() => '?').join(',')}) ORDER BY RAND() LIMIT 50`;
                db.query(fallback, genres, async (fbErr, fallbackTracks) => {
                    if (fbErr || fallbackTracks.length === 0) return res.status(500).json({ error: "Fallback failed" });
                    return respondWithSpotifyMetadata(fallbackTracks, res);
                });
            } else {
                return respondWithSpotifyMetadata(tracks, res);
            }
        });
    });
});

//---------------------------------------- Spotify Track Metadata Fetcher ----------------------------------------//
async function respondWithSpotifyMetadata(trackRows, res) {
    const ids = trackRows.map(t => t.track_id).filter(id => typeof id === 'string' && id.length === 22);
    if (ids.length === 0) return res.status(500).json({ error: "No valid Spotify IDs found." });

    try {
        const meta = await Promise.all(ids.map(id =>
            spotifyApi.getTrack(id).then(r => r.body).catch(() => null)
        ));
        const validTracks = meta.filter(Boolean);
        res.json(validTracks);
    } catch (error) {
        res.status(500).json({ error: "Spotify API failed" });
    }
}

//---------------------------------------- Like Song (Add to MySQL DB) ----------------------------------------//
app.post('/like-song', (req, res) => {
    const { spotify_id, title, artist, album, image_url } = req.body;
    if (!spotify_id || !title || !artist || !album || !image_url) {
        return res.status(400).json({ error: "Missing required song data." });
    }

    const sql = `INSERT INTO songs (spotify_id, title, artist, album, image_url)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP`;

    db.query(sql, [spotify_id, title, artist, album, image_url], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Song stored successfully" });
    });
});

//---------------------------------------- Undo Like (Remove from songs table) ----------------------------------------//
app.post('/unlike-song', (req, res) => {
    const { spotify_id } = req.body;
    if (!spotify_id) return res.status(400).json({ error: "Missing spotify_id" });

    db.query("DELETE FROM songs WHERE spotify_id = ?", [spotify_id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to unlike song" });
        res.json({ message: "Song removed from liked songs" });
    });
});


//---------------------------------------- Playlist Generator ----------------------------------------//
app.post('/generate-playlist', async (req, res) => {
    try {
        const { user_id, playlist_name } = req.body;
        if (!user_id || !playlist_name?.trim()) {
            return res.status(400).json({ error: "User ID and Playlist name required." });
        }

        const playlistData = await spotifyApi.createPlaylist(user_id, {
            name: playlist_name.trim(),
            public: false
        });

        const playlistId = playlistData.body.id;

        db.query("SELECT spotify_id FROM songs", async (err, results) => {
            if (err || results.length === 0) return res.status(500).json({ error: "No liked songs" });

            const trackUris = results.map(row => `spotify:track:${row.spotify_id}`);
            await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
            res.json({ message: "Playlist created!", playlistId });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate playlist" });
    }
});

//---------------------------------------- Like Songs: Get & Clear ----------------------------------------//
app.get('/get-liked-songs', (req, res) => {
    db.query("SELECT * FROM songs", (err, results) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json(results);
    });
});
app.post('/clear-liked-songs', (req, res) => {
    db.query("DELETE FROM songs", (err) => {
        if (err) return res.status(500).json({ error: "Failed to clear songs" });
        res.json({ message: "Liked songs cleared" });
    });
});

//---------------------------------------- Track Search (Search Bar) ----------------------------------------//
app.get('/search-track', async (req, res) => {
    const query = req.query.q;
    const token = req.query.access_token;
    if (!query || !token) return res.status(400).json({ error: "Missing query or token" });

    spotifyApi.setAccessToken(token);
    try {
        const data = await spotifyApi.searchTracks(query, { limit: 1 });
        if (!data.body.tracks.items.length) return res.status(404).json({ error: "No track found" });
        res.json(data.body.tracks.items[0]);
    } catch (error) {
        res.status(500).json({ error: "Spotify search failed" });
    }
});

//---------------------------------------- Preferences: Save & Clear ----------------------------------------//
app.post('/save-preferences', (req, res) => {
    const {
        user_id, genres,
        danceability, energy, liveness,
        valence, tempo, speechiness, acousticness
    } = req.body;

    if (!user_id || !genres) return res.status(400).json({ error: "Missing user ID or genres" });

    const sql = `
        INSERT INTO user_preferences (
            user_id, genres, danceability, energy, liveness,
            valence, tempo, speechiness, acousticness
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            genres = VALUES(genres),
            danceability = VALUES(danceability),
            energy = VALUES(energy),
            liveness = VALUES(liveness),
            valence = VALUES(valence),
            tempo = VALUES(tempo),
            speechiness = VALUES(speechiness),
            acousticness = VALUES(acousticness)
    `;

    const values = [user_id, genres, danceability, energy, liveness, valence, tempo, speechiness, acousticness];
    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ error: "DB error saving preferences" });
        res.json({ message: "Preferences saved" });
    });
});
app.post('/clear-preferences', (req, res) => {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "Missing user ID" });

    db.query("DELETE FROM user_preferences WHERE user_id = ?", [user_id], (err) => {
        if (err) return res.status(500).json({ error: "DB error clearing preferences" });
        res.json({ message: "Preferences cleared" });
    });
});

//---------------------------------------- Start Server ----------------------------------------//
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
