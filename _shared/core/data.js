let allShowcaseBeatmaps = []
let allBeatmaps = []
let allTeams = []

// Load showcase beatmaps
export async function loadShowcaseBeatmaps() {
    const response = await axios.get("../_data/showcase-beatmaps.json")
    consol
    allShowcaseBeatmaps = response.data
    return allShowcaseBeatmaps
}

// Find showcase beatmap from Id
export function findShowcaseBeatmap(id) {
    return allShowcaseBeatmaps.beatmaps.find(b => Number(b.beatmap_id) === Number(id))
}

// Load Beatmaps
export async function loadBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data
    return allBeatmaps
}

// Find beatmap from Id
export function findBeatmap(id) {
    return allBeatmaps.beatmaps.find(b => Number(b.beatmap_id) === Number(id))
}

// Load teams
export async function loadTeams() {
    const response = await axios.get("../_data/teams.json")
    allTeams = response.data
    return allTeams
}

// Find team
export function findTeam(team) {
    return allTeams.find(t => t.team_name.toLowerCase().trim() === team.toLowerCase().trim())
}