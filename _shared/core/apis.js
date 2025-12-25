// Load osu! api
let osuApi
export async function initialiseOsuApi() {
    const response = await fetch("../_data/osu-api.json")
    const responseJson = await response.json()
    osuApi = responseJson.api
}

// Load logs api
let logsApi
export async function initialiseLogsApi() {
    const response = await fetch("../_data/logs-api.json")
    const responseJson = await response.json()
    logsApi = responseJson.api
}

// Get osu! api
export function getOsuApi() {
    return osuApi
}

// Get logs api
export function getLogsApi() {
    return logsApi
}