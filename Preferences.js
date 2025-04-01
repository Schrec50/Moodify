//---------------------------------------- Get User ID from Storage ----------------------------------------//
const userId = localStorage.getItem('spotify_user_id');

//---------------------------------------- Ranges for Preference Mapping ----------------------------------------//
const vibeRanges = {
    chill: { danceability: 0.4, energy: 0.3, liveness: 0.2 },
    groovy: { danceability: 0.7, energy: 0.6, liveness: 0.4 },
    party: { danceability: 0.9, energy: 0.9, liveness: 0.8 },
    acoustic: { danceability: 0.3, energy: 0.2, liveness: 0.1 }
};

const moodRanges = {
    happy: { valence: 0.8, tempo: 125 },
    melancholy: { valence: 0.3, tempo: 90 },
    motivated: { valence: 0.6, tempo: 135 },
    calm: { valence: 0.4, tempo: 95 }
};

const talkingRanges = {
    podcast: { speechiness: 0.8, acousticness: 0.2 },
    organic: { speechiness: 0.3, acousticness: 0.7 },
    experimental: { speechiness: 0.5, acousticness: 0.5 }
};

//---------------------------------------- Save Preferences to DB ----------------------------------------//
function savePreferences() {
    if (!userId) return alert("User not logged in");

    const selectedSubgenres = Array.from(document.querySelectorAll('input[name="subgenre"]:checked'))
        .map(cb => cb.value);

    const genres = selectedSubgenres.join(',');

    const vibe = vibeRanges[document.getElementById('vibe-select').value];
    const mood = moodRanges[document.getElementById('mood-select').value];
    const speech = talkingRanges[document.getElementById('speech-select').value];

    const preferences = {
        user_id: userId,
        genres,
        ...vibe,
        ...mood,
        ...speech
    };

    fetch('http://localhost:5000/save-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
    })
    .then(res => res.json())
    .then(data => alert("Preferences saved!"))
    .catch(err => console.error("Couldn't Save Preferences:", err));
}

//---------------------------------------- Clear Preferences from DB ----------------------------------------//
function clearPreferences() {
    if (!userId) return alert("User not logged in");

    fetch('http://localhost:5000/clear-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(data => alert("Preferences Cleared!"))
    .catch(err => console.error("Couldn't clear Preferences:", err));
}

//---------------------------------------- Genre UI Controls ----------------------------------------//
document.addEventListener("DOMContentLoaded", () => {
    const mainGenreSelect = document.getElementById("main-genre-select");
    const subGenreContainer = document.getElementById("sub-genre-container");

    const genreMap = {
        pop: ["dance", "electropop", "pop-film", "power-pop"],
        rock: ["alt-rock", "hard-rock", "punk", "metal"],
        hiphop: ["hip-hop", "trap", "r-n-b"],
        electronic: ["edm", "house", "trance", "dubstep"],
        metal: ["metal", "death-metal", "metalcore", "heavy-metal"],
        indie: ["indie", "indie-pop", "folk", "emo"],
        latin: ["latin", "reggaeton", "salsa", "bachata"],
        japanese: ["j-pop", "j-rock", "anime", "j-idol"],
        jazz: ["jazz", "blues", "soul", "funk"],
        other: ["classical", "opera", "world-music", "experimental"]
    };

    mainGenreSelect.addEventListener("change", () => {
        const selectedMain = mainGenreSelect.value;
        const subgenres = genreMap[selectedMain] || [];

        subGenreContainer.innerHTML = subgenres.map(genre =>
            `<label><input type="checkbox" name="subgenre" value="${genre}"> ${genre}</label><br>`
        ).join("");
    });
});
