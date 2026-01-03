import { initialiseLogsApi, getLogsApi } from "../_shared/core/apis.js"
import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { updateChat } from "../_shared/core/chat.js"
import { sendLog } from "../_shared/core/logs.js"
import { toggleStars, setDefaultStarCount, updateStarCount, isStarOn } from "../_shared/core/stars.js"
import { loadTeams, setTeamDisplays } from "../_shared/core/teams.js"
import { delay } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

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

Promise.all([loadBeatmaps(), loadTeams(), initialiseLogsApi()]).then(([beatmaps, teams]) => {
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

    // Styles for BO9
    if (bestOf === 9) {
        tileContainer.style.height = "103px"
        tileContainer.style.borderRadius = "52px"
        artistTitle.style.top = "27.625px"
        mappedBy.style.bottom = "27.625px"
    }

    // Append everything and return
    tileContainer.append(tileBackground, innerBackground, tileOverlay)
    return tileContainer
}

// Map Click Event
let currentTile
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

    // Set details for element + animation
    await setTileDetails(currentElement, currentMap)

    // Ban
    if (action === "ban") { await setBanDetails(currentElement, team) }
    else {
        currentTile = currentElement
        updateCurrentPicker(team)
    }
}

// Set tile details
async function setTileDetails(element, currentMap) {
    // Set details for element
    element.setAttribute("data-id", currentMap.beatmap_id)
    element.children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
    element.children[1].children[0].textContent = `${currentMap.artist} - ${currentMap.title}`
    element.children[1].children[1].textContent = currentMap.creator
    element.children[1].children[2].textContent = currentMap.identifier

    // Start doing animations
    element.children[0].style.width = "100%"
    element.children[1].style.width = "100%"
    await delay(500)
    element.children[1].children[0].style.opacity = 1
    element.children[1].children[1].style.opacity = 1
    element.children[1].children[2].style.opacity = 1
}

// Set ban details
async function setBanDetails(element, team) {
    await delay(500)
    element.children[2].children[0].textContent = `${team.toUpperCase()} BAN`
    element.children[2].style.opacity = 1
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
let chatLen = 0

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
    const clients = data.tourney.clients
    const numberOfClients = clients.length

    if (ipcState !== data.tourney.ipcState) {
        ipcState = data.tourney.ipcState
        if (ipcState !== 4) checkedWinner = false
        else {
            // Set winner
            if (!checkedWinner) {
                checkedWinner = true
                let redScore = 0
                let blueScore = 0
                
                // Set scores
                for (let i = 0; i < numberOfClients; i++) {
                    const score = clients[i].play.accuracy
                    if (i < numberOfClients / 2) redScore += score
                    else blueScore += score
                }

                // Set winner
                let winnerTileText
                if (redScore > blueScore) {
                    setStarRedPlusEl.click()
                    winnerTileText = "RED WIN"
                } else if (blueScore > redScore) {
                    setStarBluePlusEl.click()
                    winnerTileText = "BLUE WIN"
                }

                // Set winner tile
                currentTile.children[2].style.opacity = 1
                currentTile.children[2].children[0].textContent = winnerTileText
            }
        }
    }

    // Set beatmap information
    if ((mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) && allBeatmaps) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        // Find element
        const element = mappoolManagementMapsEl.querySelector(`[data-id="${mapId}"]`)

        // Click Event
        if (isAutopickOn && (!element.hasAttribute("data-is-autopicked") || element.getAttribute("data-is-autopicked") !== "true")) {
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
        } else {
            updateCurrentPicker("none")
        }
    }

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        chatLen = updateChat(data.tourney, chatLen, chatDisplayContainerEl, true, getLogsApi())
    }

    // Log Data
    const logData = {
        tournament: "VV",
        team: {
            left: redTeamName,
            right: blueTeamName
        },
        isStarOn: isStarOn(),
        ipcState: ipcState,
        checkedWinner: checkedWinner,
        playerInfo: {},
        accInfo: {
            team: {
                left: 0,
                right: 0
            },
            individual: {}
        },
        beatmapInfo: {
            currentBeatmapId: mapId,
            currentBeatmapMapDetails: findBeatmap(mapId)
        }
    }

    // Populate player info
    for (let i = 0; i < numberOfClients; i++) {
        logData.playerInfo[`player${i + 1}Id`] = clients[i].user.id
        logData.playerInfo[`player${i + 1}Name`] = clients[i].user.name
    }

    // Populate score info
    let scoresLeft = 0, scoresRight = 0
    for (let i = 0; i < numberOfClients; i++) {
        const currentScore = clients[i].play.accuracy
        logData.accInfo.individual[`player${i + 1}`] = currentScore
        if (i < numberOfClients / 2) scoresLeft += currentScore
        else scoresRight += currentScore
    }

    // Populate team score info
    scoresLeft = Math.round(scoresLeft / (numberOfClients / 2))
    scoresRight = Math.round(scoresRight / (numberOfClients / 2))
    logData.accInfo.team.left = scoresLeft
    logData.accInfo.team.right = scoresRight

    // sendLog(logData, "log", getLogsApi())
}

// Set Autopicker
function setAutopicker(picker) {
    currentPicker = picker
    nextAutopickNextEl.textContent = currentPicker
}

// Set Ban Pick Action
const banPickManagementEl = document.getElementById("ban-pick-management")
const banPickManagementSelectActionEl = document.getElementById("ban-pick-management-select-action")
let currentAction
function setBanPickAction() {
    currentAction = banPickManagementSelectActionEl.value
    currentBanContainer = undefined
    currentPickTeam = undefined
    currentBanTeam = undefined
    sidebarButtonBeatmap = undefined

    while (banPickManagementEl.childElementCount > 3) {
        banPickManagementEl.lastElementChild.remove()
    }

    // Bans
    if (currentAction === "setBan" || currentAction === "removeBan") {
        makeSidebarText("Which Team?")

        // Which Team Select
        const whichTeamSelect = document.createElement("select")
        whichTeamSelect.setAttribute("id", "which-ban-select")
        whichTeamSelect.classList.add("ban-pick-management-select")
        whichTeamSelect.setAttribute("size", 6)
        whichTeamSelect.addEventListener("change", event => setBanContainer(event.currentTarget))

        // Which Team Select Options
        whichTeamSelect.append(makeTeamBanOption("red", 1), makeTeamBanOption("blue", 1), makeTeamBanOption("red", 2), makeTeamBanOption("blue", 2))
        if (bestOf !== 9) {
            whichTeamSelect.append(makeTeamBanOption("red", 3), makeTeamBanOption("blue", 3))
            whichTeamSelect.setAttribute("size", 6)
        }
        banPickManagementEl.append(whichTeamSelect)

        if (currentAction === "setBan") makeTeamAddMaps()
    }

    // Picks / Winner
    if (currentAction === "setPick" || currentAction === "removePick" || currentAction === "setWinner" || currentAction === "removeWinner") {
        makeSidebarText("Which Pick?")

        // Which pick?
        const whichPickSelect = document.createElement("div")
        whichPickSelect.classList.add("which-map-select")

        // Which Map Select
        makeTeamPickButton("red", whichPickSelect)
        makeTeamPickButton("blue", whichPickSelect)
        whichTeamButtonCreate("TB", 1, "TB", whichPickSelect)
        banPickManagementEl.append(whichPickSelect)

        // Set Pick
        if (currentAction === "setPick") makeTeamAddMaps()

        // Set Winner
        if (currentAction === "setWinner") {
            // Which team?
            makeSidebarText("Which Team Won?")

            // Which Team Select
            const whichTeamSelect = document.createElement("select")
            whichTeamSelect.setAttribute("id", "which-team-select")
            whichTeamSelect.classList.add("ban-pick-management-select")
            whichTeamSelect.setAttribute("size", 2)

            // Which Team Select Options
            whichTeamSelect.append(makeTeamSelectOption("red"), makeTeamSelectOption("blue"))
            banPickManagementEl.append(whichTeamSelect)
        }
    }

    // Apply changes button
    const applyChangesButton = document.createElement("button")
    applyChangesButton.classList.add("sidebar-button", "full-size-button", "apply-changes-button")
    applyChangesButton.style.color = "var(--dark-gray)"
    applyChangesButton.textContent = "Apply Changes"

    // Apply changes clicks
    switch (currentAction) {
        case "setBan": applyChangesButton.addEventListener("click", sidebarSetBanAction); break;
        case "removeBan": applyChangesButton.addEventListener("click", sidebarRemoveBanAction); break;
        case "setPick": applyChangesButton.addEventListener("click", sidebarSetPickAction); break;
        case "removePick": applyChangesButton.addEventListener("click", sidebarRemovePickAction); break;
        case "setWinner": applyChangesButton.addEventListener("click", sidebarSetWinnerAction); break;
        case "removeWinner": applyChangesButton.addEventListener("click", sidebarRemoveWinnerAction); break;
    }
    banPickManagementEl.append(applyChangesButton)
}

// Make sidebar text
function makeSidebarText(text) {
    const h2 = document.createElement("h2")
    h2.textContent = text
    banPickManagementEl.append(h2)
}

// Team Ban Options
function makeTeamBanOption(team, number) {
    const selectOptionBan = document.createElement("option")
    selectOptionBan.setAttribute("value", `${team}|${number}|ban`)
    selectOptionBan.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)} Ban ${number}`
    return selectOptionBan
}

// Team Select Options
function makeTeamSelectOption(team) {
    const selectOptionTeam = document.createElement("option")
    selectOptionTeam.setAttribute("value", team)
    selectOptionTeam.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)}`
    return selectOptionTeam
}

// Team Pick Button
function makeTeamPickButton(side, whichPickSelect) {
    for (let i = 1; i < firstTo; i++) {
        // Which Map Button
        whichTeamButtonCreate(`${side.substring(0, 1).toUpperCase()}${side.substring(1)}`, i, side, whichPickSelect)
    }
}

// Which Pick Button Create
function whichTeamButtonCreate(text, i, side, whichPickSelect) {
    const whichPickButton = document.createElement("button")
    whichPickButton.classList.add("which-side-button", "which-pick-button")
    whichPickButton.innerText = `${text} Pick ${i}`
    whichPickButton.addEventListener("click", event => setSidebarPick(event.currentTarget))
    whichPickButton.dataset.side = side
    whichPickButton.dataset.pickNumber = i
    whichPickSelect.append(whichPickButton)
}

// Selected Option BG Colour
const selectedBGColour = "#CECECE"

// Set sidebar pick
const whichPickButtons = document.getElementsByClassName("which-pick-button")
let sidebarButtonPickSide, sidebarButtonPickNumber
function setSidebarPick(element) {
    sidebarButtonPickSide = element.dataset.side
    sidebarButtonPickNumber = element.dataset.pickNumber

    for (let i = 0; i < whichPickButtons.length; i++) {
        whichPickButtons[i].style.backgroundColor = "transparent"
    }

    element.style.backgroundColor = selectedBGColour
    setPickContainer(element)
}

// Add Ban Container
let currentBanContainer, currentBanTeam
function setBanContainer(element) {
    const currentBanElements = element.value.split("|")
    currentBanTeam = currentBanElements[0]
    if (currentBanTeam === "red") currentBanContainer = redChoiceContainerEl.querySelectorAll(".ban-container")[currentBanElements[1] - 1]
    else currentBanContainer = blueChoiceContainerEl.querySelectorAll(".ban-container")[currentBanElements[1] - 1]
}

// Set Piock Container
let currentPickContainer, currentPickTeam
function setPickContainer(element) {
    const currentPickElement = element
    currentPickTeam = currentPickElement.dataset.side
    if (currentPickTeam === "red") currentPickContainer = redChoiceContainerEl.querySelectorAll(".red-pick-container")[Number(currentPickElement.dataset.pickNumber) - 1]
    else if (currentPickTeam === "blue") currentPickContainer = blueChoiceContainerEl.querySelectorAll(".blue-pick-container")[Number(currentPickElement.dataset.pickNumber) - 1]
    else if (currentPickTeam === "TB") currentPickContainer = tiebreakerPickContainerEl
}

// Team Add maps
function makeTeamAddMaps() {
    // Which map?
    makeSidebarText("Which Map?")

    // Which Map Select
    const whichMapSelect = document.createElement("div")
    whichMapSelect.classList.add("which-map-select")
    const beatmaps = allBeatmaps.beatmaps
    for (let i = 0; i < beatmaps.length; i++) {
        // Which Map Button
        const whichMapButton = document.createElement("button")
        whichMapButton.classList.add("which-side-button", "which-map-button")
        whichMapButton.innerText = `${beatmaps[i].identifier}`
        whichMapButton.addEventListener("click", event => setSidebarBeatmap(event.currentTarget))
        whichMapButton.dataset.id = beatmaps[i].beatmap_id
        whichMapSelect.append(whichMapButton)
    }
    banPickManagementEl.append(whichMapSelect)
}

// Set sidebar beatmap
const whichMapButtons = document.getElementsByClassName("which-map-button")
let sidebarButtonBeatmap
function setSidebarBeatmap(element) {
    sidebarButtonBeatmap = element.dataset.id
    for (let i = 0; i < whichMapButtons.length; i++) {
        whichMapButtons[i].style.backgroundColor = "transparent"
    }
    element.style.backgroundColor = selectedBGColour
}

// Sidebar Set Ban Pick ACtion
async function sidebarSetBanPickAction(element) {
    if (!element) return

    // Get map
    if (!sidebarButtonBeatmap) return
    const currentMap = findBeatmap(sidebarButtonBeatmap)
    if (!currentMap) return

    // Set details for element + animation
    await setTileDetails(element, currentMap)
}
// Sidebar Set Ban Action
async function sidebarSetBanAction() {
    if (!currentBanContainer) return
    sidebarSetBanPickAction(currentBanContainer)
    await setBanDetails(currentBanContainer, currentBanTeam)
}
function sidebarSetPickAction() { sidebarSetBanPickAction(currentPickContainer) }

// Sidebare Remove Ban Pick Action
async function sidebareRemoveBanPickAction(element) {
    if (!element) return

    // Remove ban element
    element.children[2].style.opacity = 0
    await delay(500)

    // Start doing animations
    element.children[1].children[0].style.opacity = 0
    element.children[1].children[1].style.opacity = 0
    element.children[1].children[2].style.opacity = 0
    await delay(500)
    element.children[0].style.width = "0%"
    element.children[1].style.width = "0%"
    await delay(500)

    // Remove ban
    element.removeAttribute("data-id")
    element.children[2].children[0].textContent = ""
    element.children[0].style.backgroundImage = "unset"
    element.children[1].children[0].textContent = ""
    element.children[1].children[1].textContent = ""
    element.children[1].children[2].textContent = ""
}
// Sidebar Remove Ban / Pick Action functions
function sidebarRemoveBanAction() { sidebareRemoveBanPickAction(currentBanContainer) }
function sidebarRemovePickAction() { sidebareRemoveBanPickAction(currentPickContainer) }

// Sidebar Set Winner Action
function sidebarSetWinnerAction() {
    if (!currentPickContainer) return

    // Team Select Value
    const teamSelectValue = document.getElementById("which-team-select").value
    currentPickContainer.children[2].style.opacity = 1
    currentPickContainer.children[2].children[0].textContent = `${teamSelectValue} wins`
}

// Sidebar Remove Winner Action
function sidebarRemoveWinnerAction() {
    if (!currentPickContainer) return

    currentPickContainer.children[2].style.opacity = 1
    currentPickContainer.children[2].children[0].textContent = ""
}

// Setting current picker
const currentPickerTextEl = document.getElementById("current-picker-text")
const currentPickerRedEl = document.getElementById("current-picker-red")
const currentPickerBlueEl = document.getElementById("current-picker-blue")
const currentPickerNoneEl = document.getElementById("current-picker-none")
function updateCurrentPicker(side) {
    currentPickerTextEl.textContent = side
    document.cookie = `currentPicker=${side}; path=/`
}

// Toggle stars button
const toggleStarButtonEl = document.getElementById("toggle-stars-button")
const toggleStarsOnOffEl = document.getElementById("toggle-stars-on-off")
document.addEventListener("DOMContentLoaded", () => {
    toggleStarButtonEl.addEventListener("click", () => toggleStars(toggleStarsOnOffEl, toggleStarButtonEl, redTeamStarContainerEl, blueTeamStarContainerEl))
    document.cookie = `toggleStarContainers=${true}; path=/`

    // Update star count buttons
    setStarRedPlusEl.addEventListener("click", () => updateStarCount("red", "plus", redTeamStarContainerEl, blueTeamStarContainerEl, redTeamName, blueTeamName))
    setStarRedMinusEl.addEventListener("click", () => updateStarCount("red", "minus", redTeamStarContainerEl, blueTeamStarContainerEl, redTeamName, blueTeamName))
    setStarBluePlusEl.addEventListener("click", () => updateStarCount("blue", "plus", redTeamStarContainerEl, blueTeamStarContainerEl, redTeamName, blueTeamName))
    setStarBlueMinusEl.addEventListener("click", () => updateStarCount("blue", "minus", redTeamStarContainerEl, blueTeamStarContainerEl, redTeamName, blueTeamName))

    // Toggle Autopick button
    toggleAutopickButtonEl.addEventListener("click", function() {
        isAutopickOn = !isAutopickOn
        toggleAutopickOnOffEl.textContent = isAutopickOn ? "ON" : "OFF"
        toggleAutopickButtonEl.classList.toggle("toggle-on", isAutopickOn)
        toggleAutopickButtonEl.classList.toggle("toggle-off", !isAutopickOn)
    })

    // Set Autopicker Buttons
    nextAutopickRedEl.addEventListener("click", () => setAutopicker("red"))
    nextAutopickBlueEl.addEventListener("click",() => setAutopicker("blue"))

    // Ban Pick Management
    banPickManagementSelectActionEl.addEventListener("click", setBanPickAction)

    // Current Picker
    currentPickerRedEl.addEventListener("click", () => updateCurrentPicker("red"))
    currentPickerBlueEl.addEventListener("click", () => updateCurrentPicker("blue"))
    currentPickerNoneEl.addEventListener("click", () => updateCurrentPicker("none"))
    currentPickerNoneEl.click()
})