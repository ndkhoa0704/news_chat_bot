import { randomUUID } from 'node:crypto'
import { Conversation } from '../models/chatModel.js'
import chatService from '../services/chatService.js'
import tools from '../tools/index.js'


function chatController() {
    return {
        listConversations: async (req, res) => {
            try {
                const userId = req.user.sub
                const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 })
                res.json(conversations.map(c => ({
                    id: c._id.toString(),
                    conversationId: c.conversationId,
                    summary: c.summary ?? (c.messages?.[0]?.userMsg ?? 'New chat'),
                    updatedAt: c.updatedAt
                })))
            } catch (e) {
                console.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        },
        createConversation: async (req, res) => {
            try {
                const userId = req.user.sub
                const conversation = await Conversation.create({
                    conversationId: randomUUID(),
                    userId,
                    messages: [],
                    summary: ''
                })
                res.status(201).json({ id: conversation._id.toString(), conversationId: conversation.conversationId })
            } catch (e) {
                console.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        },
        getConversation: async (req, res) => {
            try {
                const userId = req.user.sub
                const conversation = await Conversation.findOne({ _id: req.params.id, userId })
                if (!conversation) return res.status(404).json({ message: 'Not found' })
                res.json(conversation)
            } catch (e) {
                console.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        },
        deleteConversation: async (req, res) => {
            try {
                const userId = req.user.sub
                await Conversation.deleteOne({ _id: req.params.id, userId })
                res.json({ success: true })
            } catch (e) {
                console.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        },
        sendMessage: async (req, res) => {
            try {
                const { message } = req.body
                if (!message) return res.status(400).json({ message: 'Missing message' })
                const userId = req.user.sub
                const conversation = await Conversation.findOne({ _id: req.params.id, userId })
                if (!conversation) return res.status(404).json({ message: 'Conversation not found' })

                res.setHeader('Content-Type', 'text/event-stream')
                res.setHeader('Cache-Control', 'no-cache')
                res.setHeader('Connection', 'keep-alive')
                if (typeof res.flushHeaders === 'function') res.flushHeaders()

                const systemPrompt = {
                    role: 'system',
                    content: 'Bạn là trợ lý tin tức hữu ích. Luôn tham chiếu và sử dụng lịch sử cuộc trò chuyện đã cung cấp để giữ ngữ cảnh, tránh lặp lại, và trả lời bằng tiếng Việt một cách súc tích, chính xác. Nếu cần, bạn có thể dùng các công cụ có sẵn.'
                }

                const history = []
                for (const m of conversation.messages || []) {
                    if (m.userMsg) history.push({ role: 'user', content: m.userMsg })
                    if (m.botMsg) history.push({ role: 'assistant', content: m.botMsg })
                }
                const userMsg = { role: 'user', content: message }
                const baseMessages = [systemPrompt, ...history, userMsg]

                const toolMap = new Map((tools || []).map(t => [t.function?.name, t]))

                const send = (data) => {
                    res.write(`data: ${JSON.stringify(data)}\n\n`)
                }

                let finalAssistantText = ''

                async function streamOnce(messages) {
                    const stream = await chatService.complete(messages, { stream: true })
                    let toolCalls = []
                    for await (const chunk of stream) {
                        const choice = chunk?.choices?.[0]
                        const delta = choice?.delta || {}
                        if (delta.content) {
                            finalAssistantText += delta.content
                            send({ delta: delta.content })
                        }
                        if (Array.isArray(delta.tool_calls)) {
                            for (const tc of delta.tool_calls) {
                                const existing = toolCalls.find(x => x.id === tc.id)
                                if (!existing) {
                                    toolCalls.push({ id: tc.id, type: 'function', function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' } })
                                } else {
                                    // concatenate streamed arguments
                                    existing.function.arguments = (existing.function.arguments || '') + (tc.function?.arguments || '')
                                }
                            }
                        }
                        if (choice?.finish_reason === 'tool_calls') {
                            break
                        }
                    }
                    return toolCalls
                }

                async function runWithTools(messages) {
                    const calls = await streamOnce(messages)
                    if (!calls.length) return

                    const toolResults = []
                    for (const call of calls) {
                        const name = call.function?.name
                        const rawArgs = call.function?.arguments || '{}'
                        let args
                        try { args = JSON.parse(rawArgs) } catch { args = {} }
                        const tool = toolMap.get(name)
                        if (!tool) continue
                        try {
                            const result = await tool.execute(args)
                            toolResults.push({ role: 'tool', tool_call_id: call.id, content: typeof result === 'string' ? result : JSON.stringify(result) })
                        } catch (err) {
                            toolResults.push({ role: 'tool', tool_call_id: call.id, content: `Tool ${name} error: ${(err && err.message) || String(err)}` })
                        }
                    }
                    await runWithTools([...messages, ...calls.map(c => ({ role: 'assistant', content: '', tool_calls: [c] })), ...toolResults])
                }

                runWithTools(baseMessages)
                    .then(async () => {
                        // Persist conversation
                        conversation.messages.push({ userMsg: message, botMsg: finalAssistantText })
                        try {
                            const title = await chatService.summarize([systemPrompt, ...history, userMsg, { role: 'assistant', content: finalAssistantText }])
                            conversation.summary = title || (conversation.summary || message.slice(0, 80))
                        } catch {
                            conversation.summary = conversation.summary || message.slice(0, 80)
                        }
                        await conversation.save()
                        send({ event: 'end' })
                        res.end()
                    })
                    .catch(err => {
                        console.error(err)
                        send({ event: 'error', message: 'Generation failed' })
                        res.end()
                    })

                req.on('close', () => {
                    try { res.end() } catch {}
                })
            } catch (e) {
                console.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        }
    }
}


export default chatController()