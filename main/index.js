import { loadBeatmaps, findBeatmap, loadTeams } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"
import { delay } from "../_shared/core/utils.js"
import CountUp from "../_shared/core/countUp.js"
import { setTeamDisplays } from "../_shared/core/teams.js"

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

// Now Playing Container
const nowPlayingContainerEl = document.getElementById("now-playing-container")
const nowPlayingBorderEl = document.getElementById("now-playing-border")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
const nowPlayingSongTitleEl = document.getElementById("now-playing-song-title")
const nowPlayingDifficultyEl = document.getElementById("now-playing-difficulty")
const nowPlayingMapperEl = document.getElementById("now-playing-mapper")
// Stats
const nowPlayingSrNumberEl = document.getElementById("now-playing-sr-number")
const nowPlayingLenNumberEl = document.getElementById("now-playing-len-number")
const nowPlayingBpmNumberEl = document.getElementById("now-playing-bpm-number")
const nowPlayingArNumberEl = document.getElementById("now-playing-ar-number")
const nowPlayingCsNumberEl = document.getElementById("now-playing-cs-number")
const nowPlayingHpNumberEl = document.getElementById("now-playing-hp-number")
const nowPlayingOdNumberEl = document.getElementById("now-playing-od-number")
let beatmapId, beatmapChecksum, updateStats = false

// Playing Scores
const redPlayingScoreEl = document.getElementById("red-playing-score")
const bluePlayingScoreEl = document.getElementById("blue-playing-score")
const playingScoreDifferenceTextEl = document.getElementById("playing-score-difference-text")
const playingScoreDifferenceEl = document.getElementById("playing-score-difference")
let currentRedScore, currentBlueScore, numberOfClients, numberOfClientsPerTeam

const redAccuracyLineEl = document.getElementById("red-accuracy-line")
const blueAccuracyLineEl = document.getElementById("blue-accuracy-line")

const countUpAnimations = {
    "redPlayingScore": new CountUp(redPlayingScoreEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "%" }),
    "bluePlayingScore": new CountUp(bluePlayingScoreEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "%" }),
    "playingScoreDifference": new CountUp(playingScoreDifferenceEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "%" }),
}

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
            // Do chat animation
            chatDisplayLiveTitleTextEl.style.opacity = 0
            await delay(210)
            chatDisplayTitleEl.style.width = 0
            chatDisplayTitleEl.style.paddingLeft = 0
            await delay(410)
            chatDisplayEl.style.height = 0

            // Show scores
            redPlayingScoreEl.style.opacity = 1
            bluePlayingScoreEl.style.opacity = 1
            playingScoreDifferenceTextEl.style.opacity = 1
            playingScoreDifferenceEl.style.opacity = 1
        } else {
            // Do chat animation
            chatDisplayEl.style.height = "154px"
            await delay(510)
            chatDisplayTitleEl.style.paddingLeft = `var(--chat-display-padding-left)`
            chatDisplayTitleEl.style.width = `calc(100% - var(--chat-display-padding-left))`
            await delay(410)
            chatDisplayLiveTitleTextEl.style.opacity = 1

            // Hide scores
            redPlayingScoreEl.style.opacity = 0
            bluePlayingScoreEl.style.opacity = 0
            playingScoreDifferenceTextEl.style.opacity = 0
            playingScoreDifferenceEl.style.opacity = 0

            // Accuracy lines
            redAccuracyLineEl.style.width = "660px"
            blueAccuracyLineEl.style.width = "660px"
        }
    }

    // Now Playing
    const beatmapData = data.beatmap
    if (beatmapId !== data.beatmap.id || beatmapChecksum !== data.beatmap.checksum) {
        beatmapId = beatmapData.id
        beatmapChecksum = beatmapData.checksum
        updateStats = undefined

        // Metadata
        nowPlayingContainerEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`
        nowPlayingArtistEl.textContent = beatmapData.artist
        nowPlayingSongTitleEl.textContent = beatmapData.title
        nowPlayingDifficultyEl.textContent = beatmapData.version
        nowPlayingMapperEl.textContent = beatmapData.mapper

        updateStats = findBeatmap(beatmapId)
        if (updateStats) {
            const currentMap = updateStats
            console.log("undefined")
            const stats = getStats(Number(currentMap.difficultyrating), Number(currentMap.diff_approach),
                Number(currentMap.diff_size), Number(currentMap.diff_overall), Number(currentMap.diff_drain),
                Number(currentMap.bpm), Number(currentMap.total_length), currentMap.mod
            )

            nowPlayingSrNumberEl.textContent = stats.sr
            nowPlayingLenNumberEl.textContent = setLengthDisplay(stats.len)
            nowPlayingBpmNumberEl.textContent = stats.bpm
            nowPlayingArNumberEl.textContent = stats.ar
            nowPlayingCsNumberEl.textContent = stats.cs
            nowPlayingHpNumberEl.textContent = stats.hp
            nowPlayingOdNumberEl.textContent = stats.od
            updateStats = false
        } else {
            await delay(250)
            updateStats = true
        }
    }

    // Update stats
    if (updateStats) {
        const statsObj = beatmapData.stats
        const stats = getStats(statsObj.stars.total, statsObj.ar.converted, statsObj.cs.converted,
            statsObj.od.converted, statsObj.hp.converted, statsObj.bpm.common,
            Math.round((beatmapData.time.lastObject - beatmapData.time.firstObject) / 1000), "NM"
        )

        nowPlayingSrNumberEl.textContent = stats.sr
        nowPlayingLenNumberEl.textContent = setLengthDisplay(stats.len)
        nowPlayingBpmNumberEl.textContent = stats.bpm
        nowPlayingArNumberEl.textContent = stats.ar
        nowPlayingCsNumberEl.textContent = stats.cs
        nowPlayingHpNumberEl.textContent = stats.hp
        nowPlayingOdNumberEl.textContent = stats.od
    }

    // Number of clients
    const clients = data.tourney.clients
    if (numberOfClients !== clients.length) {
        numberOfClients = clients.length
        numberOfClientsPerTeam = numberOfClients / 2
    }

    // Score Display
    if (scoreVisible) {
        currentRedScore = 0
        currentBlueScore = 0

        // Set scores
        for (let i = 0; i < numberOfClients; i++) {
            const score = clients[i].play.accuracy
            if (i < numberOfClientsPerTeam) currentRedScore += score
            else currentBlueScore += score
        }

        // Get actual scores
        currentRedScore /= numberOfClientsPerTeam
        currentBlueScore /= numberOfClientsPerTeam
        const scoreDifference = Math.abs(currentRedScore - currentBlueScore)

        // Animations
        countUpAnimations.redPlayingScore.update(currentRedScore)
        countUpAnimations.bluePlayingScore.update(currentBlueScore)
        countUpAnimations.playingScoreDifference.update(scoreDifference)

        // Scorebar animations
        redAccuracyLineEl.style.width = `${(currentRedScore - 80) / 20 * 660}px`
        blueAccuracyLineEl.style.width = `${(currentBlueScore - 80) / 20 * 660}px`
    }
}

// Get Stats
function getStats(sr, ar, cs, od, hp, bpm, len, mod) {
    if (mod.includes("HR")) {
        cs = Math.min(Math.round(cs * 1.3 * 10) / 10, 10)
        ar = Math.min(Math.round(ar * 1.4 * 10) / 10, 10)
        hp = Math.min(Math.round(hp * 1.4 * 10) / 10, 10)
        od = Math.min(Math.round(od * 1.4 * 10) / 10, 10)
    }
    if (mod.includes("DT") || mod.includes("NC")) {
        if (ar > 5) ar = Math.round((((1200 - (( 1200 - (ar - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
        else ar = Math.round((1800 - ((1800 - ar * 120) * 2 / 3)) / 120 * 10) / 10
        if (hp > 5) hp = Math.round((((1200 - (( 1200 - (hp - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
        else hp = Math.round((1800 - ((1800 - hp * 120) * 2 / 3)) / 120 * 10) / 10
        od = Math.round((79.5 - (( 79.5 - 6 * od) * 2 / 3)) / 6 * 10) / 10
        bpm = Math.round(bpm * 1.5)
        len = Math.round(len / 1.5)
    }
    return {sr: sr, ar: ar, cs: cs, hp: hp, od: od, bpm: bpm, len: len, mod: mod}
}

// Set Length Display
function setLengthDisplay(seconds) {
    const minuteCount = Math.floor(seconds / 60)
    const secondCount = seconds % 60

    return `${minuteCount.toString()}:${secondCount.toString().padStart(2, "0")}`
}