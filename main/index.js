import { loadBeatmaps, findBeatmap, loadTeams, findTeam } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"
import { delay } from "../_shared/core/utils.js"

// Round names
const roundNameFrontEl = document.getElementById("round-name-front")
const roundNameBackEl = document.getElementById("round-name-back")

// Load beatmaps and players
let allBeatmaps = []
let allTeams = []
Promise.all([loadBeatmaps(), loadTeams()]).then(([beatmaps, teams]) => {
    allTeams = teams
    allBeatmaps = beatmaps
    roundNameFrontEl.innerText = allBeatmaps.roundName
    roundNameBackEl.setAttribute("src", `static/rounds/${allBeatmaps.roundName}.png`)
})

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

// Chat Display
const chatDisplayEl = document.getElementById("chat-display")
const chatDisplayTitleEl = document.getElementById("chat-display-title")
const chatDisplayLiveTitleTextEl = document.getElementById("chat-display-live-title-text")
const chatDisplayContainerEl = document.getElementById("chat-display-container")
// Variables
let chatLen = 0

// Score visibility
let scoreVisible

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

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        (chatLen === 0 || chatLen > data.tourney.chat.length) ? (chatDisplayContainerEl.innerHTML = "", chatLen = 0) : null
        const fragment = document.createDocumentFragment()

        for (let i = chatLen; i < data.tourney.chat.length; i++) {
            // Message container
            const messageContainer = document.createElement("div")

            // Name
            const messageName = document.createElement("span")
            messageName.classList.add(data.tourney.chat[i].team)
            messageName.textContent = `${data.tourney.chat[i].name}: `

            // Message
            const messageContent = document.createElement("span")
            messageContent.textContent = data.tourney.chat[i].message

            messageContainer.append(messageName, messageContent)
            fragment.append(messageContainer)
        }

        chatDisplayContainerEl.append(fragment)
        chatLen = data.tourney.chat.length
    }

    // Score visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
        if (scoreVisible) {
            chatDisplayLiveTitleTextEl.style.opacity = 0
            await delay(210)
            chatDisplayTitleEl.style.width = 0
            chatDisplayTitleEl.style.paddingLeft = 0
            await delay(410)
            chatDisplayEl.style.height = 0
        } else {
            chatDisplayEl.style.height = "154px"
            await delay(510)
            chatDisplayTitleEl.style.paddingLeft = `var(--chat-display-padding-left)`
            chatDisplayTitleEl.style.width = `calc(100% - var(--chat-display-padding-left))`
            await delay(410)
            chatDisplayLiveTitleTextEl.style.opacity = 1
        }
    }
}

// Set Team Displays
function setTeamDisplays(teamName, teamNameElement, avatarElement, seedNumberElement) {
    teamNameElement.textContent = teamName

    const team = findTeam(teamName)
    if (team) {
        // TOOD: Set actual team name
        avatarElement.style.backgroundImage = `url("https://a.ppy.sh/2")`
        seedNumberElement.textContent = team.seed
    }
    return teamName
}