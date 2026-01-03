let allShowcaseBeatmaps = []
let allBeatmaps = []

// Load showcase beatmaps
export async function loadShowcaseBeatmaps() {
    const response = await axios.get("../_data/showcase-beatmaps.json")
    allShowcaseBeatmaps = response.data
    return allShowcaseBeatmaps
}

// Find showcase beatmap from Id
export function findShowcaseBeatmap(id) {
    return allShowcaseBeatmaps.beatmaps.find(b => Number(b.beatmap_id) === Number(id))
}

// Load Beatmaps
export async function loadBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data
    return allBeatmaps
}

// Find beatmap from Id
export function findBeatmap(id) {
    return allBeatmaps.beatmaps.find(b => Number(b.beatmap_id) === Number(id))
}