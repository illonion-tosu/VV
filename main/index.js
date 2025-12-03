import { loadBeatmaps, findBeatmap } from "../_shared/core/data"

// Load beatmaps and players
let allBeatmaps = []
Promise.all([loadBeatmaps()]).then(([beatmaps]) => {
    allBeatmaps = beatmaps
})