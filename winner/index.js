import { loadBeatmaps } from "../_shared/core/beatmaps.js"
import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { getCookie } from "../_shared/core/utils.js"

// Load beatmaps and players
const roundNameEl = document.getElementById("round-name")
Promise.all([loadBeatmaps(), loadTeams()]).then(([beatmaps, teams]) => {
    roundNameEl.textContent = beatmaps.roundName
})

// Team Name
let currentTeamName, previousTeamName
const teamNameEl = document.getElementById("team-name")
const teamIconEl = document.getElementById("team-icon")
const playerNameContainerEl = document.getElementById("player-name-container")
setInterval(() => {
    // Get Team Name
    currentTeamName = getCookie("currentWinner")
    if (currentTeamName != previousTeamName) {
        previousTeamName = currentTeamName

        // Set Team Name
        if (currentTeamName === "none") return
        teamNameEl.textContent = currentTeamName

        // Get details
        const teamDetails = findTeam(currentTeamName)
        if (!teamDetails) return

        // Set details
        teamIconEl.style.backgroundImage = `url("${teamDetails.teamIcon}")`
        for (let i = 0; i < playerNameContainerEl.childElementCount; i++) {
            if (teamDetails.playerNames[i]) {
                playerNameContainerEl.children[i].style.display = "block"
                playerNameContainerEl.children[i].textContent = teamDetails.playerNames[i]
                continue
            }
            playerNameContainerEl.children[i].style.display = "none"
        }
    }
}, 200)