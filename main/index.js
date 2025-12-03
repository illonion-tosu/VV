import { loadBeatmaps, findBeatmap } from "../_shared/core/data.js"

// Round names
const roundNameFrontEl = document.getElementById("round-name-front")
const roundNameBackEl = document.getElementById("round-name-back")

// Load beatmaps and players
let allBeatmaps = []
Promise.all([loadBeatmaps()]).then(([beatmaps]) => {
    allBeatmaps = beatmaps
    console.log(allBeatmaps)
    roundNameFrontEl.innerText = allBeatmaps.roundName
    roundNameBackEl.setAttribute("src", `static/rounds/${allBeatmaps.roundName}.png`)
})