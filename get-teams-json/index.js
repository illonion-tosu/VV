const textarea = document.getElementById("textarea")
const teams = []
function submit() {
    submitButtonEl.disabled = true
    const textareaValue = textarea.value
    const textareaValueSplit = textareaValue.split("\n")
    for (let i = 0; i < textareaValueSplit.length; i++) {
        const textareaValueSplitIndividual = textareaValueSplit[i].split("\t")
        const teamData = {
            teamName: textareaValueSplitIndividual[1],
            teamIcon: textareaValueSplitIndividual[0],
            playerNames: [
                textareaValueSplitIndividual[2],
                textareaValueSplitIndividual[3],
                textareaValueSplitIndividual[4],
                textareaValueSplitIndividual[5],
            ],
            teamSeed: textareaValueSplitIndividual[6]
        }
        teams.push(teamData)
    }

    const jsonString = JSON.stringify(teams, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "players.json"
    link.click()

    submitButtonEl.disabled = false
}

// Submit button loading
const submitButtonEl = document.getElementById("submit-button")
window.addEventListener("load", () => {
    submitButtonEl.addEventListener("click", submit)
})