let allShowcaseBeatmaps = []

// Load showcase beatmaps
export async function loadShowcaseBeatmaps() {
    const response = await axios.get("../_data/showcase-beatmaps.json")
    allShowcaseBeatmaps = response.data
    return allShowcaseBeatmaps
}