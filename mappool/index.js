import { updateChat } from "../_shared/core/chat.js"
import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
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
const tiebreakerPickContainerEl = document.getElementById("tiebreaker-pick-container")

// Mappool Management
const mappoolManagementMapsEl = document.getElementById("mappool-management-maps")

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
        redChoiceContainerEl.append(createTile("ban", ""))
        blueChoiceContainerEl.append(createTile("ban", ""))
    }

    // First To
    for (let i = 0; i < firstTo - 1; i++) {
        redChoiceContainerEl.append(createTile("pick", "red"))
        blueChoiceContainerEl.append(createTile("pick", "blue"))
    }

    // Create ban
    redChoiceContainerEl.append(createTile("ban", ""))
    blueChoiceContainerEl.append(createTile("ban", ""))

    // Create map pick buttons
    for (let i = 0; i < allBeatmaps.beatmaps.length; i++) {
        const button = document.createElement("button")
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", function(event) {event.preventDefault()})
        button.classList.add("sidebar-button")
        button.dataset.id = allBeatmaps.beatmaps[i].beatmap_id
        button.textContent = allBeatmaps.beatmaps[i].identifier
        mappoolManagementMapsEl.append(button)
    }
})

// Create tile
function createTile(choice, side) {
    // Ban / Pick Container
    const tileContainer = document.createElement("div")
    tileContainer.classList.add("tile-container", `${choice === "ban" ? "ban" : `${side}-pick`}-container`)
    
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

    // Tile overlay
    const tileOverlay = document.createElement("div")
    tileOverlay.classList.add(`${choice}-tile-overlay`, "tile-overlay")
    const overlayText = document.createElement("div")
    tileOverlay.append(overlayText)

    // Append everything and return
    tileContainer.append(tileBackground, innerBackground, tileOverlay)
    return tileContainer
}

// Map Click Event
async function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    const currentMap = findBeatmap(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"
    if (event.shiftKey) action = "tbPick"

    // Check if map exists in bans
    const mapCheck = !!(
        redChoiceContainerEl.querySelector(`[data-id="${currentMapId}"]`) ||
        blueChoiceContainerEl.querySelector(`[data-id="${currentMapId}"]`)
    )

    if (mapCheck) return

    // Find element
    let currentElement
    if (action === "tbPick") {
        currentElement = tiebreakerPickContainerEl
    } else {
        // Find side container and then ban the map
        const side = team === "red" ? redChoiceContainerEl : blueChoiceContainerEl
        const containers = side.querySelectorAll(action === "ban" ? ".ban-container" : `.${team}-pick-container`)

        // See if there is an element that is empty
        for (const container of containers) {
            // Skip if this container already has a data-id
            if (container.dataset.id) continue
            currentElement = container
            break
        }
        if (!currentElement) return
    }

    // Set details for element
    currentElement.setAttribute("data-id", currentMapId)
    currentElement.children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
    currentElement.children[1].children[0].textContent = `${currentMap.artist} - ${currentMap.title}`
    currentElement.children[1].children[1].textContent = currentMap.creator
    currentElement.children[1].children[2].textContent = currentMap.identifier

    // Start doing animations
    currentElement.children[0].style.width = "100%"
    currentElement.children[1].style.width = "100%"
    await delay(500)
    currentElement.children[1].children[0].style.opacity = 1
    currentElement.children[1].children[1].style.opacity = 1
    currentElement.children[1].children[2].style.opacity = 1

    // Ban
    if (action === "ban") {
        await delay(500)
        currentElement.children[2].children[0].textContent = `${team.toUpperCase()} BAN`
        currentElement.children[2].style.opacity = 1
    }
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
const setStarRedMinusEl = document.getElementById("set-star-red-minus")
const setStarBluePlusEl = document.getElementById("set-star-blue-plus")
const setStarBlueMinusEl = document.getElementById("set-star-blue-minus")

// Now Playing Information
let mapId, mapChecksum

/* Next Autopick */
const nextAutopickNextEl = document.getElementById("next-autopick-text")
const nextAutopickRedEl = document.getElementById("next-autopick-red")
const nextAutopickBlueEl = document.getElementById("next-autopick-blue")
const toggleAutopickButtonEl = document.getElementById("toggle-autopick-button")
const toggleAutopickOnOffEl = document.getElementById("toggle-autopick-on-off")
let isAutopickOn = false, currentPicker = "red"

// Chat Display
const chatDisplayContainerEl = document.getElementById("chat-display-container")
let chatLen

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

    // Set beatmap information
    if ((mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) && allBeatmaps) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        console.log("hello")

        // Find element
        const element = mappoolManagementMapsEl.querySelector(`[data-id="${mapId}"]`)

        console.log(element, isAutopickOn)

        // Click Event
        if (isAutopickOn && (!element.hasAttribute("data-is-autopicked") || element.getAttribute("data-is-autopicked") !== "true")) {
            console.log(isAutopickOn)
            // Check if autopicked already
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (currentPicker === "red")? 0 : 2
            })
            element.dispatchEvent(event)
            element.setAttribute("data-is-autopicked", "true")

            if (currentPicker === "red") setAutopicker("blue")
            else if (currentPicker === "blue") setAutopicker("red")
        }
    }

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        chatLen = updateChat(data.tourney.chat, chatLen, chatDisplayContainerEl)
    }
}

// Set Autopicker
function setAutopicker(picker) {
    currentPicker = picker
    nextAutopickNextEl.textContent = currentPicker
    document.cookie = `currentPicker=${currentPicker}; path=/`
}

document.addEventListener("DOMContentLoaded", () => {
    // Toggle stars button
    const toggleStarButtonEl = document.getElementById("toggle-stars-button")
    const toggleStarsOnOffEl = document.getElementById("toggle-stars-on-off")
    toggleStarButtonEl.addEventListener("click", () => toggleStars(toggleStarsOnOffEl, toggleStarButtonEl, redTeamStarContainerEl, blueTeamStarContainerEl))
    document.cookie = `toggleStarContainers=${true}; path=/`

    // Update star count buttons
    setStarRedPlusEl.addEventListener("click", () => updateStarCount("red", "plus", redTeamStarContainerEl, blueTeamStarContainerEl))
    setStarRedMinusEl.addEventListener("click", () => updateStarCount("red", "minus", redTeamStarContainerEl, blueTeamStarContainerEl))
    setStarBluePlusEl.addEventListener("click", () => updateStarCount("blue", "plus", redTeamStarContainerEl, blueTeamStarContainerEl))
    setStarBlueMinusEl.addEventListener("click", () => updateStarCount("blue", "minus", redTeamStarContainerEl, blueTeamStarContainerEl))

    // Toggle Autopick button
    toggleAutopickButtonEl.addEventListener("click", function() {
        isAutopickOn = !isAutopickOn
        toggleAutopickOnOffEl.textContent = isAutopickOn ? "ON" : "OFF"
        toggleAutopickButtonEl.classList.toggle("toggle-on", isAutopickOn)
        toggleAutopickButtonEl.classList.toggle("toggle-off", !isAutopickOn)
    })

    // Set Autopicker Buttons
    document.cookie = `currentPicker="red"; path=/`
    nextAutopickRedEl.addEventListener("click", () => setAutopicker("red"))
    nextAutopickBlueEl.addEventListener("click",() => setAutopicker("blue"))
})