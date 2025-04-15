// ---------------------- Word Pools ----------------------
const wordPools = {
    global: {
        adjectives: [
            "chaotic", "feral", "soft", "glittery", "moody", "cursed", "unbothered", "unhinged", "vintage",
            "delusional", "cosmic", "luminous", "brooding", "electric", "bittersweet", "reckless",
            "velvet", "nocturnal", "gilded", "sublime", "foggy"
        ],
        nouns: [
            "goblin", "barista", "cryptid", "rat", "phantom", "demon", "poet", "vibe", "meltdown",
            "energy", "mirage", "daydream", "spiral", "rewind", "storm", "wanderer", "neon", "solstice",
            "riptide", "echo"
        ],
        verbs: [
            "ascend", "rage", "vibe", "dissociate", "haunt", "run", "wander", "glow", "unravel", "echo",
            "groove", "stargaze", "glide"
        ],
        suffixes: [
            "in the rain", "™", "volume I", "reboot", "redux", "remastered", "from the crypt",
            "for no reason", "after dark", "on shuffle", "at 3 AM", "in stereo", "from the attic", "after hours"
        ],
        emojis: [
            "🌧️", "✨", "🧃", "🖤", "🔥", "🌀", "💅", "📀", "🌙", "⚡", "🎧", "🌊", "🌸"
        ]
    },
    romance: {
        nouns: ["fling", "serenade", "roses", "late text", "candle", "flirt", "heartbeat"],
        adjectives: ["flirty", "doomed", "heartfelt", "gothic", "tender", "star‑crossed"],
        verbs: ["swoon", "overthink", "long"]
    },
    rage: {
        nouns: ["pit", "howl", "screech", "breakdown", "fire", "maelstrom"],
        adjectives: ["screaming", "feral", "metal", "bloody", "unholy"],
        verbs: ["scream", "destroy", "rage", "obliterate"]
    },
    chill: {
        nouns: ["cloud", "fog", "static", "nap", "dream", "breeze", "hammock"],
        adjectives: ["lo‑fi", "mellow", "vibey", "ethereal", "hazy", "tranquil"],
        verbs: ["float", "zone out", "breathe", "drift"]
    },
    quirky: {
        nouns: ["platypus", "frog", "gremlin", "villain", "meme", "pickle"],
        adjectives: ["goofy", "extra", "pastel", "chaotic neutral", "wonky", "offbeat"],
        verbs: ["giggle", "transform", "befuddle"]
    },
    party: {
        nouns: ["banger", "club rat", "drip", "glowstick", "confetti"],
        adjectives: ["sparkly", "hyped", "drippy", "wild", "turbo"],
        verbs: ["dance", "grind", "pop off", "turn up"]
    }
};

// ---------------------- Templates ----------------------
const templates = [
    "{adjective} {noun} {suffix}",
    "{noun} vibes",
    "{noun} but {adjective}",
    "songs to {verb} to",
    "certified {noun} energy",
    "{adjective} {noun}",
    "{adjective} {noun} syndrome",
    "i am the {adjective} {noun}",
    "{noun} arc",
    "{noun} playlist {emoji}",
    "{adjective} {noun} in the rain",
    "{adjective} {noun} volume I",
    "{adjective} {noun} (remastered)",
    "midnight {noun} club",
    "the art of {verb}ing",
    "too {adjective} to function"
];

// ---------------------- Genre Buckets ----------------------
const genreBuckets = {
    romance: ["romance", "r-n-b", "ballad", "piano", "pop"],
    rage: ["metal", "metalcore", "death-metal", "black-metal", "punk", "hardcore"],
    chill: ["lofi", "acoustic", "chill", "ambient", "sleep", "new-age", "folk"],
    quirky: ["anime", "disney", "k-pop", "j-pop", "comedy", "kids"],
    party: ["edm", "trap", "dance", "hip-hop", "house", "club", "reggaeton", "latin"]
};

// ---------------------- Main Generator ----------------------
function generateGoofyNameFromGenres(genreList) {
    const global = wordPools.global;
    let local = { nouns: [], adjectives: [], verbs: [] };

    // Determine best‑matching genre bucket
    let topBucket = null;
    let maxMatch = 0;
    for (const [bucket, values] of Object.entries(genreBuckets)) {
        const matchCount = genreList.filter(g => values.includes(g)).length;
        if (matchCount > maxMatch) {
            topBucket = bucket;
            maxMatch = matchCount;
        }
    }

    if (topBucket && wordPools[topBucket]) {
        local = wordPools[topBucket];
    }

    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
        .replace("{noun}", pick(local.nouns, global.nouns))
        .replace("{adjective}", pick(local.adjectives, global.adjectives))
        .replace("{verb}", pick(local.verbs, global.verbs))
        .replace("{suffix}", pick(global.suffixes))
        .replace("{emoji}", pick(global.emojis));
}

function pick(...lists) {
    const flat = lists.flat().filter(Boolean);
    return flat[Math.floor(Math.random() * flat.length)];
}

// export { generateGoofyNameFromGenres };