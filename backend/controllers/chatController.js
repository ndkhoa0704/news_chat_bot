import { randomUUID } from 'node:crypto'
import { Conversation } from '../models/chatModel.js'
import { generateBotReply } from '../services/chatService.js'


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

                const botMsg = await generateBotReply(message, conversation)

                conversation.messages.push({ userMsg: message, botMsg })
                if (!conversation.summary) {
                    conversation.summary = message.slice(0, 80)
                }
                await conversation.save()

                res.status(201).json({ userMsg: message, botMsg })
            } catch (e) {
                console.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        }
    }
}


export default chatController()