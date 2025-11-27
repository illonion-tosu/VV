let allShowcaseBeatmaps = []

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