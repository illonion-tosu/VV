// Update all chat information
export function updateChat(
    chatData,
    chatLength,
    chatDisplayContainerEl
) {
    (chatLength === 0 || chatLen > chatData.length) ? (chatDisplayContainerEl.innerHTML = "", chatLength = 0) : null
    const fragment = document.createDocumentFragment()

    for (let i = chatLen; i < chatData.length; i++) {
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
    }

    chatDisplayContainerEl.append(fragment)
    chatLength = chatData.length
}