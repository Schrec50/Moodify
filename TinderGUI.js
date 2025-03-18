
const presetSongs = [
    {
        id: "2rw5cbtHTyzy8iruujD28d",
        name: "Dough",
        artists: [{ name: "Key Glock" }],
        album: {
            name: "Yellow Tape",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b27377d6678d66fd48ecfed2cfe8" }]
        },
        preview_url: null
    },
    {
        id: "64YCRnMmAcj4982RtwNaag",
        name: "Georgia Ways (with Teddy Swims & Luke Bryan)",
        artists: [{ name: "Quavo" }],
        album: {
            name: "Georgia Ways",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273235923d7ba5d6effec0bc9a5" }]
        },
        preview_url: null
    },
    {
        id: "7BgyWwbbybJr2IbQoI1gzH",
        name: "Stevie Doesn't Wonder",
        artists: [{ name: "Hotel Ugly" }],
        album: {
            name: "Stevie Doesn't Wonder",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273d35174d28aadcef2843c7d07" }]
        },
        preview_url: null
    },
    {
        id: "15og0pCEcTFWEXOFKdcJlU",
        name: "Hate Me",
        artists: [{ name: "Ellie Goulding" }],
        album: {
            name: "Brightest Blue",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273156d79bdb60fc5f7af75590b" }]
        },
        preview_url: null
    },
    {
        id: "5n4FTCMefvyKUjeWumdaWv",
        name: "Miss The Rage",
        artists: [{ name: "Trippie Redd" }],
        album: {
            name: "Trip At Knight",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b2731c0aacb7cb42f20914d319f4" }]
        },
        preview_url: null
    },
    {
        id: "2WsuSYJNXGKXVYkHPnq2yp",
        name: "Ransom (with Juice WRLD) - Remix",
        artists: [{ name: "Lil Tecca" }],
        album: {
            name: "We Love You Tecca",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273bd69bbde4aeee723d6d08058" }]
        },
        preview_url: null
    },
    {
        id: "5SWnsxjhdcEDc7LJjq9UHk",
        name: "Runnin",
        artists: [{ name: "21 Savage" }],
        album: {
            name: "SAVAGE MODE II",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273aa57907bf0cb2ca0c8cc74bc" }]
        },
        preview_url: null
    },
    {
        id: "0vjeOZ3Ft5jvAi9SBFJm1j",
        name: "Superhero (Heroes & Villains)",
        artists: [{ name: "Metro Boomin" }],
        album: {
            name: "HEROES & VILLAINS",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273c4fee55d7b51479627c31f89" }]
        },
        preview_url: null
    },
    {
        id: "5I9sHwLDX28tLtzVgKLtpr",
        name: "Everybody Loves Somebody",
        artists: [{ name: "Dean Martin" }],
        album: {
            name: "Everybody Loves Somebody",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b273ba93cb5d7f8450ac548e04b6" }]
        },
        preview_url: null
    },
    {
        id: "5mCPDVBb16L4XQwDdbRUpz",
        name: "Passionfruit",
        artists: [{ name: "Drake" }],
        album: {
            name: "More Life",
            images: [{ url: "https://i.scdn.co/image/ab67616d0000b2734f0fd9dad63977146e685700" }]
        },
        preview_url: null
    }
];

//-----------------------------------------------------------------------------------------------------------------------------------------

let currentSongIndex = 0;
let songs = presetSongs; //  Now it correctly uses the 10 preset songs
let songCard = document.getElementById("song-card");
let songCardWrapper = document.getElementById("song-card-wrapper");
let startX, isHolding = false;
const threshold = 200; // Increase threshold to ensure swipe

document.addEventListener("DOMContentLoaded", () => {
    displaySong(); //  Ensure the first song is displayed on page load
});

function displaySong() {
    if (currentSongIndex >= songs.length) {
        alert("No more songs to display");
        return;
    }
    const song = songs[currentSongIndex];
    console.log("Displaying song:", song);

    document.getElementById("song-image").src = song.album.images[0]?.url || "default.jpg"; 
    document.getElementById("song-title").textContent = song.name; 
    document.getElementById("song-artist").textContent = song.artists[0]?.name || "Unknown Artist"; 
    document.getElementById("song-album").textContent = song.album.name || "Unknown Album"; 

    songCard.style.transform = "translateX(0px) rotate(0deg)";
    songCard.style.opacity = "1";
}

document.addEventListener("mousedown", (event) => {
    if (!songCardWrapper.contains(event.target)) return;
    isHolding = true;
    startX = event.clientX;
    songCard.style.transition = "none"; // Disable smooth transition while dragging
});

document.addEventListener("mousemove", (event) => {
    if (!isHolding) return;
    let diff = event.clientX - startX;
    songCard.style.transform = `translateX(${diff}px) rotate(${diff / 10}deg)`;
});

document.addEventListener("mouseup", (event) => {
    if (!isHolding) return;
    isHolding = false;

    let currentX = event.clientX;
    let diff = currentX - startX;
    let cardRect = songCard.getBoundingClientRect(); // Get current card position

    songCard.style.transition = "transform 0.3s ease-out";

    if (diff > threshold || cardRect.right > window.innerWidth - 150) {
        // Right swipe (Like)
        console.log("Right swipe detected:", diff, "Card Right Position:", cardRect.right);
        songCard.classList.add("swipe-right");
        likeSong(songs[currentSongIndex]);
        setTimeout(nextSong, 300);
    } else if (diff < -threshold || cardRect.left < 150) {
        // Left swipe (Dislike)
        console.log("Left swipe detected:", diff, "Card Left Position:", cardRect.left);
        songCard.classList.add("swipe-left");
        setTimeout(() => {
            nextSong();
            songCard.classList.remove("swipe-left");
        }, 300);
    } else {
        // Reset position if not far enough
        songCard.style.transform = "translateX(0px) rotate(0deg)";
    }
});

function nextSong() {
    currentSongIndex++;
    songCard.classList.remove("swipe-right", "swipe-left");
    songCard.style.transition = "none";
    songCard.style.transform = "translateX(0px) rotate(0deg)";

    if (currentSongIndex < songs.length) {
        displaySong();
    } else {
        alert("End of Presentation Songs!"); // 
        currentSongIndex = 0; // 
        displaySong();
    }
}

document.getElementById("liked-songs-btn").addEventListener("click", () => {
    window.location.href = "LikedSongs.html";
});
