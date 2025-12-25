import { sendLog } from "../core/logs.js"

// Update all chat information
export function updateChat(
    tourneyData,
    chatLength,
    chatDisplayContainerEl,
    logData,
    api
) {
    const chatData = tourneyData.chat
    if (chatLength === 0 || chatLength > chatData.length) {
        chatDisplayContainerEl.innerHTML = ""
        chatLength = 0
    }
    const fragment = document.createDocumentFragment()

    for (let i = chatLength; i < chatData.length; i++) {
        // Message container
        const messageContainer = document.createElement("div")

        // Name
        const messageName = document.createElement("span")
        messageName.classList.add(chatData[i].team)
        messageName.textContent = `${chatData[i].name}: `

        // Message
        const messageContent = document.createElement("span")
        messageContent.textContent = chatData[i].message

        messageContainer.append(messageName, messageContent)
        fragment.append(messageContainer)

        // Chat log data
        if (logData) {
            const chatLogData = {
                tournament: "VV",
                team: {
                    left: tourneyData.team.left,
                    right: tourneyData.team.right
                },
                chatContent: {
                    team: chatData[i].team,
                    name: chatData[i].name,
                    message: chatData[i].message,
                    timestamp: chatData[i].timestamp
                }
            }

            sendLog(chatLogData, "chat", api)
        }
    }

    chatDisplayContainerEl.append(fragment)
    chatLength = chatData.length
    return chatLength
}