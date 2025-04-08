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
        pop: [
          "pop", "pop-film", "power-pop", "party", "romance", "dance", "dancehall",
          "happy", "latin", "latino", "reggaeton", "mandopop", "cantopop"
        ],
        rock: [
          "rock", "alt-rock", "hard-rock", "punk", "punk-rock", "rock-n-roll",
          "grunge", "garage", "psych-rock", "rockabilly", "british"
        ],
        hiphop: [
          "hip-hop", "r-n-b", "emo"
        ],
        electronic: [
          "edm", "electronic", "electro", "dubstep", "dub", "idm", "deep-house",
          "detroit-techno", "minimal-techno", "disco", "club", "breakbeat",
          "drum-and-bass", "chicago-house", "progressive-house"
        ],
        metal: [
          "metal", "heavy-metal", "black-metal", "death-metal", "metalcore",
          "grindcore", "hardcore", "goth", "industrial"
        ],
        indie: [
          "indie", "indie-pop", "alternative", "folk", "singer-songwriter",
          "songwriter", "acoustic", "guitar"
        ],
        world: [
          "brazil", "forro", "mpb", "pagode", "samba", "sertanejo", "french",
          "german", "spanish", "afrobeat", "iranian", "indian", "malay"
        ],
        jazz: [
          "jazz", "blues", "bluegrass", "funk", "soul", "ska"
        ],
        classical: [
          "classical", "piano", "opera", "new-age", "ambient"
        ],
        asian: [
          "j-pop", "j-rock", "j-dance", "j-idol", "anime", "k-pop"
        ],
        kids: [
          "children", "disney", "show-tunes", "comedy", "honky-tonk", "kids"
        ],
        mood: [
          "chill", "sleep", "sad", "happy", "groove"
        ],
        country: [
          "country", "honky-tonk"
        ],
        reggae: [
          "reggae"
        ]
      };
      
      

      mainGenreSelect.addEventListener("change", () => {
        const selectedMain = mainGenreSelect.value;
        const subgenres = genreMap[selectedMain] || [];
    
        // Prevent duplicates
        if (document.getElementById(`box-${selectedMain}`)) return;
    
        // Create wrapper box
        const box = document.createElement("div");
        box.className = "subgenre-box";
        box.id = `box-${selectedMain}`;
    
        // Create header with remove button
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
    
        const title = document.createElement("h4");
        title.textContent = selectedMain.charAt(0).toUpperCase() + selectedMain.slice(1);
    
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.className = "remove-genre-btn";
        removeBtn.onclick = () => box.remove();
    
        header.appendChild(title);
        header.appendChild(removeBtn);
    
        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "subgenre-container";
        checkboxContainer.innerHTML = subgenres.map(genre =>
            `<label><input type="checkbox" name="subgenre" value="${genre}"> ${genre}</label>`
        ).join("");
    
        box.appendChild(header);
        box.appendChild(checkboxContainer);
        document.getElementById("sub-genre-container").appendChild(box);
    });
    
    
});
