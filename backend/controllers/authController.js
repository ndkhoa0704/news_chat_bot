import authService from '../services/authService.js'
import logger from '../utils/loggerUtil.js'

function AuthController() {
    return {
        register: async (req, res) => {
            try {
                const result = await authService.registerUser(req.body)
                return res.status(201).json(result)
            } catch (err) {
                logger.error(err)
                if (err.message === 'Missing required fields') {
                    return res.status(400).json({ message: 'Missing fields' })
                }
                if (err.message === 'Email already registered') {
                    return res.status(409).json({ message: 'Email already registered' })
                }
                return res.status(500).json({ message: 'Server error' })
            }
        },
        login: async (req, res) => {
            try {
                const result = await authService.loginUser(req.body)
                return res.json(result)
            } catch (err) {
                logger.error(err)
                if (err.message === 'Missing required fields' || err.message === 'Invalid credentials') {
                    return res.status(401).json({ message: 'Invalid credentials' })
                }
                return res.status(500).json({ message: 'Server error' })
            }
        },
        requireAuth: (req, res, next) => {
            const auth = req.headers.authorization || ''
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
            if (!token) return res.status(401).json({ message: 'Unauthorized' })
            try {
                const payload = authService.verifyToken(token)
                req.user = payload
                return next()
            } catch (error) {
                logger.error(error)
                return res.status(401).json({ message: 'Invalid token' })
            }
        },
        requireAdmin: (req, res, next) => {
            try {
                authService.checkAdminPermission(req.user?.email)
                return next()
            } catch (error) {
                logger.error(error)
                return res.status(403).json({ message: 'Forbidden' })
            }
        },
        getUsers: async (_req, res) => {
            try {
                const users = await authService.getAllUsers()
                res.json(users)
            } catch (err) {
                logger.error(err)
                res.status(500).json({ message: 'Server error' })
            }
        },
        createUser: async (req, res) => {
            try {
                const user = await authService.createNewUser(req.body)
                res.status(201).json(user)
            } catch (err) {
                logger.error(err)
                if (err.message === 'Missing required fields') {
                    return res.status(400).json({ message: 'Missing fields' })
                }
                if (err.message === 'Email already exists') {
                    return res.status(409).json({ message: 'Email already exists' })
                }
                res.status(500).json({ message: 'Server error' })
            }
        },
        deleteUser: async (req, res) => {
            try {
                await authService.deleteUserById(req.params.id)
                res.json({ success: true })
            } catch (err) {
                logger.error(err)
                res.status(500).json({ message: 'Server error' })
            }
        }
    }
}


export default AuthController()