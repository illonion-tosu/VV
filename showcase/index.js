import { loadShowcaseBeatmaps, findShowcaseBeatmap } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Round name
const roundNameEl = document.getElementById("round-name")

// Load beatmaps and players
let allShowcaseBeatmaps = []
Promise.all([loadShowcaseBeatmaps()]).then(([showcaseBeatmaps]) => {
    allShowcaseBeatmaps = showcaseBeatmaps.beatmaps
    roundNameEl.textContent = showcaseBeatmaps.roundName
})

// Beatmap ID and Checksum
let beatmapId, beatmapChecksum

// Sidebar
const identifierNameEl = document.getElementById("identifier-name")
const modNameContainerEl = document.getElementById("mod-name-container")
const modNameEl = document.getElementById("mod-name")
const titleScrollEl = document.getElementById("title-scroll")
const titleName1El = document.getElementById("title-name-1")
const titleName2El = document.getElementById("title-name-2")
const titleName3El = document.getElementById("title-name-3")

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Beatmap information
    if ((beatmapId !== data.beatmap.id || beatmapChecksum !== data.beatmap.checksum) && allShowcaseBeatmaps) {
        beatmapId = data.beatmap.id
        beatmapChecksum = data.beatmap.checksum

        // Metadata
        // Title
        const authorTitle = `${data.beatmap.artist.toUpperCase()} - ${data.beatmap.title.toUpperCase()}`
        titleName1El.textContent = authorTitle
        titleName2El.textContent = authorTitle
        titleName3El.textContent = authorTitle
        const currentWidth = Math.round(
            Math.max(titleName1El.getBoundingClientRect().width,
                    titleName2El.getBoundingClientRect().width)
        )
        if (currentWidth > 396) {
            titleName1El.style.display = "none"
            titleScrollEl.style.display = "block"
            titleName3El.style.transform = `translateX(calc(100% + 14px))`
            const timing = 45 * currentWidth
            document.documentElement.style.setProperty("--title-name-animation-time", `${timing}ms`)
        } else {
            titleName1El.style.display = "block"
            titleScrollEl.style.display = "none"
        }

        const beatmap = findShowcaseBeatmap(beatmapId)
        if (beatmap) {
            identifierNameEl.textContent = beatmap.identifier
            modNameContainerEl.style.display = "block"
            modNameEl.textContent = beatmap.mod.toUpperCase()
        } else {
            identifierNameEl.textContent = ""
            modNameContainerEl.style.display = "none"
        }
    }
}