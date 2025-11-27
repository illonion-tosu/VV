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
// Title
const titleScrollEl = document.getElementById("title-scroll")
const titleName1El = document.getElementById("title-name-1")
const titleName2El = document.getElementById("title-name-2")
const titleName3El = document.getElementById("title-name-3")
// Mapper
const mapperScrollEl = document.getElementById("mapper-scroll")
const mapperName1El = document.getElementById("mapper-name-1")
const mapperName2El = document.getElementById("mapper-name-2")
const mapperName3El = document.getElementById("mapper-name-3")
// Difficulty
const difficultyScrollEl = document.getElementById("difficulty-scroll")
const difficultyName1El = document.getElementById("difficulty-name-1")
const difficultyName2El = document.getElementById("difficulty-name-2")
const difficultyName3El = document.getElementById("difficulty-name-3")

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Beatmap information
    if ((beatmapId !== data.beatmap.id || beatmapChecksum !== data.beatmap.checksum) && allShowcaseBeatmaps) {
        beatmapId = data.beatmap.id
        beatmapChecksum = data.beatmap.checksum

        // Metadata
        setMetadataInformation(`${data.beatmap.artist.toUpperCase()} - ${data.beatmap.title.toUpperCase()}`, titleName1El, titleName2El, titleName3El, "title", titleScrollEl)
        setMetadataInformation(data.beatmap.mapper, mapperName1El, mapperName2El, mapperName3El, "mapper", mapperScrollEl)
        setMetadataInformation(data.beatmap.version, difficultyName1El, difficultyName2El, difficultyName3El, "difficulty", difficultyScrollEl)

        // Mods and Identifier
        const beatmap = findShowcaseBeatmap(beatmapId)
        if (beatmap) {
            identifierNameEl.style.display = "block"
            identifierNameEl.textContent = beatmap.identifier
            modNameContainerEl.style.display = "block"
            modNameEl.textContent = beatmap.mod
        } else {
            identifierNameEl.style.display = "none"
            modNameContainerEl.style.display = "none"
        }
    }
}

function setMetadataInformation(textContent, element1, element2, element3, sectionName, elementScroll) {
    // Mapper Name
    element1.textContent = textContent
    element2.textContent = textContent
    element3.textContent = textContent

    // Mapper Width
    const mapperWidth = Math.round(
        Math.max(element1.getBoundingClientRect().width,
                element2.getBoundingClientRect().width)
    )

    // Set styling for scrolling
    element3.style.transform = `translateX(calc(100% + 14px))`
    const timing = 45 * mapperWidth
    document.documentElement.style.setProperty(`--${sectionName}-name-animation-time`, `${timing}ms`)

    // Set styling for widths
    if (mapperWidth > 396) {
        element1.style.display = "none"
        elementScroll.style.display = "block"
    } else {
        element1.style.display = "block"
        elementScroll.style.display = "none"
    }
}