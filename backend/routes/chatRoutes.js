import express from 'express'
import chatController from '../controllers/chatController.js'

const router = express.Router()

router.get('/conversations', chatController.requireAuth, chatController.listConversations)
router.post('/conversations', chatController.requireAuth, chatController.createConversation)
router.get('/conversations/:id', chatController.requireAuth, chatController.getConversation)
router.delete('/conversations/:id', chatController.requireAuth, chatController.deleteConversation)
router.post('/conversations/:id/messages', chatController.requireAuth, chatController.sendMessage)

export default router