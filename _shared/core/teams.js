import { findTeam } from "../core/data.js"

// Set Team Displays
export default function setTeamDisplays(teamName, teamNameElement, avatarElement, seedNumberElement) {
    teamNameElement.textContent = teamName

    const team = findTeam(teamName)
    if (team) {
        // TOOD: Set actual team name
        avatarElement.style.backgroundImage = `url("https://a.ppy.sh/2")`
        seedNumberElement.textContent = team.seed
    }
    return teamName
}