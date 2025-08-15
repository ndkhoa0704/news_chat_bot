import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { User } from '../models/userModel.js'
import logger from '../utils/loggerUtil.js'

function AuthController() {
    return {
        createToken: (payload) => jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN }),
        sanitizeUser: (user) => ({
                id: user._id.toString(),
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                createdAt: user.createdAt
            }),
        register: async (req, res) => {
            try {
                const { userName, email, password } = req.body
                if (!email || !password || !userName) {
                    return res.status(400).json({ message: 'Missing fields' })
                }
                const existing = await User.findOne({ email })
                if (existing) {
                    return res.status(409).json({ message: 'Email already registered' })
                }
                const hashed = await bcrypt.hash(password, 10)
                const user = await User.create({
                    userId: randomUUID(),
                    userName,
                    email,
                    password: hashed
                })
                const token = createToken({ sub: user._id.toString(), email: user.email })
                return res.status(201).json({ token, user: sanitizeUser(user) })
            } catch (err) {
                logger.error(err)
                return res.status(500).json({ message: 'Server error' })
            }
        },
        login: async (req, res) => {
            try {
                const { email, password } = req.body
                if (!email || !password) return res.status(400).json({ message: 'Missing fields' })
                const user = await User.findOne({ email })
                if (!user) return res.status(401).json({ message: 'Invalid credentials' })
                const ok = await bcrypt.compare(password, user.password)
                if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
                const token = createToken({ sub: user._id.toString(), email: user.email })
                return res.json({ token, user: sanitizeUser(user) })
            } catch (err) {
                logger.error(err)
                return res.status(500).json({ message: 'Server error' })
            }
        },
        requireAuth: (req, res, next) => {
            const auth = req.headers.authorization || ''
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
            if (!token) return res.status(401).json({ message: 'Unauthorized' })
            try {
                const payload = jwt.verify(token, config.JWT_SECRET)
                req.user = payload
                return next()
            } catch (error) {
                logger.error(error)
                return res.status(401).json({ message: 'Invalid token' })
            }
        },
        requireAdmin: (req, res, next) => {
            if (!req.user?.email) return res.status(403).json({ message: 'Forbidden' })
            if (!config.ADMIN_EMAILS.includes(req.user.email)) return res.status(403).json({ message: 'Forbidden' })
            return next()
        },
        getUsers: async (_req, res) => {
            const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 })
            res.json(users)
        },
        createUser: async (req, res) => {
            try {
                const { userName, email, password } = req.body
                if (!email || !password || !userName) return res.status(400).json({ message: 'Missing fields' })
                const exists = await User.findOne({ email })
                if (exists) return res.status(409).json({ message: 'Email already exists' })
                const hashed = await bcrypt.hash(password, 10)
                const user = await User.create({ userId: randomUUID(), userName, email, password: hashed })
                res.status(201).json(sanitizeUser(user))
            } catch (e) {
                logger.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        },
        deleteUser: async (req, res) => {
            try {
                await User.findByIdAndDelete(req.params.id)
                res.json({ success: true })
            } catch (e) {
                logger.error(e)
                res.status(500).json({ message: 'Server error' })
            }
        }
    }
}


export default AuthController()