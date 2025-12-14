import { loadBeatmaps, findBeatmap } from "../_shared/core/data.js"
import { loadTeams, setTeamDisplays } from "../_shared/core/teams.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"
import { delay } from "../_shared/core/utils.js"
import { toggleStars, setDefaultStarCount, updateStarCount } from "../_shared/core/stars.js"

// Team star containers
const redTeamStarContainerEl = document.getElementById("red-team-star-container")
const blueTeamStarContainerEl = document.getElementById("blue-team-star-container")

// Load beatmaps and players
const roundTextEl = document.getElementById("round-text")
let allBeatmaps = []
let allTeams = []
let banCount = 0, bestOf = 0, firstTo = 0

// Choice Containers
const redChoiceContainerEl = document.getElementById("red-choice-container")
const blueChoiceContainerEl = document.getElementById("blue-choice-container")

Promise.all([loadBeatmaps(), loadTeams()]).then(([beatmaps, teams]) => {
    allTeams = teams
    allBeatmaps = beatmaps

    const roundName = allBeatmaps.roundName
    roundTextEl.innerText = roundName
    
    // Set default star counts
    switch (roundName) {
        case "ROUND OF 32": case "ROUND OF 16":
            bestOf = 9
            banCount = 1
            break
        case "QUARTERFINALS": case "SEMIFINALS":
            bestOf = 11
            banCount = 2
            break
        case "FINALS": case "GRAND FINALS":
            bestOf = 13
            banCount = 2
            break
    }
    firstTo = Math.ceil(bestOf / 2)
    setDefaultStarCount(bestOf, redTeamStarContainerEl, blueTeamStarContainerEl)

    redChoiceContainerEl.innerHTML = ""
    blueChoiceContainerEl.innerHTML = ""

    // Create ban
    for (let i = 0; i < banCount; i++) {
        redChoiceContainerEl.append(createBanTile())
        blueChoiceContainerEl.append(createBanTile())
    }

    // First To
    for (let i = 0; i < firstTo - 1; i++) {
        redChoiceContainerEl.append(createPickTile("red"))
        blueChoiceContainerEl.append(createPickTile("blue"))
    }

    // Create ban
    redChoiceContainerEl.append(createBanTile())
    blueChoiceContainerEl.append(createBanTile())
})

// Create Ban Tile
function createBanTile() {
    // Ban Container
    const banContainer = document.createElement("div")
    banContainer.classList.add("tile-container", "ban-container")

    // Tile background
    const tileBackground = document.createElement("div")
    tileBackground.classList.add("tile-background")

    // Inner background
    const innerBackground = document.createElement("div")
    innerBackground.classList.add("inner-background")
    const artistTitle = document.createElement("div")
    artistTitle.classList.add("song-metadata", "artist-title")
    const mappedBy = document.createElement("div")
    mappedBy.classList.add("song-metadata", "mapped-by")
    const tileIdentifier = document.createElement("div")
    tileIdentifier.classList.add("tile-identifier")
    innerBackground.append(artistTitle, mappedBy, tileIdentifier)

    // Ban Tile Overlay
    const banTileOverlay = document.createElement("div")
    banTileOverlay.classList.add("ban-tile-overlay", "tile-overlay")
    const banText = document.createElement("div")
    banTileOverlay.append(banText)

    banContainer.append(tileBackground, innerBackground, banTileOverlay)
    return banContainer
}

// Create Pick Tile
function createPickTile(side) {
    // Pick Container
    const pickContainer = document.createElement("div")
    pickContainer.classList.add("tile-container", `${side}-pick-container`)

    // Tile background
    const tileBackground = document.createElement("div")
    tileBackground.classList.add("tile-background")

    // Inner background
    const innerBackground = document.createElement("div")
    innerBackground.classList.add("inner-background")
    const artistTitle = document.createElement("div")
    artistTitle.classList.add("song-metadata", "artist-title")
    const mappedBy = document.createElement("div")
    mappedBy.classList.add("song-metadata", "mapped-by")
    const tileIdentifier = document.createElement("div")
    tileIdentifier.classList.add("tile-identifier")
    innerBackground.append(artistTitle, mappedBy, tileIdentifier)

    // Ban Tile Overlay
    const pickTileOverlay = document.createElement("div")
    pickTileOverlay.classList.add("pick-tile-overlay", "tile-overlay")
    const banText = document.createElement("div")
    pickTileOverlay.append(banText)

    pickContainer.append(tileBackground, innerBackground, pickTileOverlay)
    return pickContainer
}

// Team Information
// Team Avatars
const redTeamAvatarEl = document.getElementById("red-team-avatar")
const blueTeamAvatarEl = document.getElementById("blue-team-avatar")
// Team Names
const redTeamNameEl = document.getElementById("red-team-name")
const blueTeamNameEl = document.getElementById("blue-team-name")
// Team Seed Number
const redTeamSeedNumberEl = document.getElementById("red-team-seed-number")
const blueTeamSeedNumberEl = document.getElementById("blue-team-seed-number")
// Variables
let redTeamName, blueTeamName

// Set winner
let ipcState
let checkedWinner = true

// Update Star Count Buttons
const setStarRedPlusEl = document.getElementById("set-star-red-plus")
const setStarRedMinueEl = document.getElementById("set-star-red-minue")
const setStarBluePlusEl = document.getElementById("set-star-blue-plus")
const setStarBlueMinueEl = document.getElementById("set-star-blue-minue")

// Socket
const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team
    if (redTeamName !== data.tourney.team.left) {
        redTeamName = setTeamDisplays(data.tourney.team.left, redTeamNameEl, redTeamAvatarEl, redTeamSeedNumberEl)
    }
    if (blueTeamName !== data.tourney.team.right) {
        blueTeamName = setTeamDisplays(data.tourney.team.right, blueTeamNameEl, blueTeamAvatarEl, blueTeamSeedNumberEl)
    }

    // IPC State
    if (ipcState !== data.tourney.ipcState) {
        ipcState = data.tourney.ipcState
        if (ipcState !== 4) checkedWinner = false
        else {
            // Set winner
            if (!checkedWinner) {
                checkedWinner = true
                let redScore = 0
                let blueScore = 0
                
                const numberOfClients = data.tourney.clients.length
                for (let i = 0; i < numberOfClients; i++) {
                    const score = clients[i].play.accuracy
                    if (i < numberOfClients / 2) redScore += score
                    else blueScore += score
                }

                if (redScore > blueScore) setStarRedPlusEl.click()
                else if (blueScore > redScore) setStarBluePlusEl.click()
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Toggle stars button
    const toggleStarButtonEl = document.getElementById("toggle-stars-button")
    const toggleStarsOnOffEl = document.getElementById("toggle-stars-on-off")
    toggleStarButtonEl.addEventListener("click", () => toggleStars(toggleStarsOnOffEl, toggleStarButtonEl, redTeamStarContainerEl, blueTeamStarContainerEl))
    document.cookie = `toggleStarContainers=${true}; path=/`

    setStarRedPlusEl.addEventListener("click", () => updateStarCount("red", "plus", redTeamStarContainerEl, blueTeamStarContainerEl))
    setStarRedMinueEl.addEventListener("click", () => updateStarCount("red", "minus", redTeamStarContainerEl, blueTeamStarContainerEl))
    setStarBluePlusEl.addEventListener("click", () => updateStarCount("blue", "plus", redTeamStarContainerEl, blueTeamStarContainerEl))
    setStarBlueMinueEl.addEventListener("click", () => updateStarCount("blue", "minus", redTeamStarContainerEl, blueTeamStarContainerEl))
})