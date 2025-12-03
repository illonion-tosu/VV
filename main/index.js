import { loadBeatmaps, findBeatmap, loadTeams, findTeam } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

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

// Socket
const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    if (redTeamName !== data.tourney.team.left) {
        redTeamName = setTeamDisplays(data.tourney.team.left, redTeamNameEl, redTeamAvatarEl, redTeamSeedNumberEl)
    }
    if (blueTeamName !== data.tourney.team.right) {
        blueTeamName = setTeamDisplays(data.tourney.team.right, blueTeamNameEl, blueTeamAvatarEl, blueTeamSeedNumberEl)
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