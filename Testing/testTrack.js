require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Replace this with the ID you want to test
const testTrackId = '2J3MdVrlrZ46M4ylHhmNVH';

(async () => {
  try {
    // Get a new token
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    const track = await spotifyApi.getTrack(testTrackId);
    console.log("Track found:", track.body.name);
    console.log("Artist:", track.body.artists.map(a => a.name).join(', '));
    console.log("Album:", track.body.album.name);
    console.log("Preview URL:", track.body.preview_url);
  } catch (err) {
    console.error("Error fetching track:", err);
  }
})();
