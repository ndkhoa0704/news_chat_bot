import express from 'express'
import authController from '../controllers/authController.js'
import chatController from '../controllers/chatController.js'

const router = express.Router()

router.get('/conversations', authController.requireAuth, chatController.listConversations)
router.post('/conversations', authController.requireAuth, chatController.createConversation)
router.get('/conversations/:id', authController.requireAuth, chatController.getConversation)
router.delete('/conversations/:id', authController.requireAuth, chatController.deleteConversation)
router.post('/conversations/:id/messages', authController.requireAuth, chatController.sendMessage)

export default router