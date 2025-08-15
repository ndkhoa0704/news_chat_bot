import express from 'express'
import authController from '../controllers/authController.js'

const router = express.Router()

router.post('/register', authController.register)
router.post('/login', authController.login)

router.get('/users', authController.requireAuth, authController.requireAdmin, authController.getUsers)
router.post('/users', authController.requireAuth, authController.requireAdmin, authController.createUser)
router.delete('/users/:id', authController.requireAuth, authController.requireAdmin, authController.deleteUser)

export default router