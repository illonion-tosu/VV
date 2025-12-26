let allTeams = []

// Load teams
export async function loadTeams() {
    const response = await axios.get("../_data/teams.json")
    allTeams = response.data
    return allTeams
}

// Find team
export function findTeam(team) {
    return allTeams.find(t => t.teamName.toLowerCase().trim() === team.toLowerCase().trim())
}

// Set Team Displays
export function setTeamDisplays(teamName, teamNameElement, avatarElement, seedNumberElement) {
    teamNameElement.textContent = teamName

    const team = findTeam(teamName)
    if (team) {
        // TOOD: Set actual team name
        avatarElement.style.backgroundImage = `url("${team.teamIcon}")`
        seedNumberElement.textContent = team.teamSeed
    }

    return teamName
}