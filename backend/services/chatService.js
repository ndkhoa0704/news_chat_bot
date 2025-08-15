export async function generateBotReply(userMessage, conversation) {
    const lastBot = conversation?.messages?.[conversation.messages.length - 1]?.botMsg
    const prefix = lastBot ? `You said: ${userMessage}. Continuing our chat.` : `Hello! You said: ${userMessage}`
    return `${prefix} (demo reply)`
}