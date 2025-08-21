import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/userModel.js'


function AuthService() {
    return {
        // Token utilities
        createToken: (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }),

        verifyToken: (token) => {
            try {
                return jwt.verify(token, process.env.JWT_SECRET)
            } catch {
                throw new Error('Invalid token')
            }
        },

        // User data sanitization
        sanitizeUser: (user) => ({
            id: user._id.toString(),
            userId: user.userId,
            userName: user.userName,
            email: user.email,
            createdAt: user.createdAt
        }),

        // Registration logic
        registerUser: async (userData) => {
            const { userName, email, password } = userData

            if (!email || !password || !userName) {
                throw new Error('Missing required fields')
            }

            const existing = await User.findOne({ email })
            if (existing) {
                throw new Error('Email already registered')
            }

            const hashed = await bcrypt.hash(password, 10)
            const user = await User.create({
                userId: randomUUID(),
                userName,
                email,
                password: hashed
            })

            const token = this.createToken({ sub: user._id.toString(), email: user.email })
            return { token, user: this.sanitizeUser(user) }
        },

        // Login logic
        loginUser: async (credentials) => {
            const { email, password } = credentials

            if (!email || !password) {
                throw new Error('Missing required fields')
            }

            const user = await User.findOne({ email })
            if (!user) {
                throw new Error('Invalid credentials')
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) {
                throw new Error('Invalid credentials')
            }

            const token = this.createToken({ sub: user._id.toString(), email: user.email })
            return { token, user: this.sanitizeUser(user) }
        },

        // Admin authorization logic
        checkAdminPermission: (userEmail) => {
            if (!userEmail) {
                throw new Error('User email not found')
            }

            if (!process.env.ADMIN_EMAILS.includes(userEmail)) {
                throw new Error('Admin permission required')
            }

            return true
        },

        // User management logic
        getAllUsers: async () => {
            return await User.find({}, { password: 0 }).sort({ createdAt: -1 })
        },

        createNewUser: async (userData) => {
            const { userName, email, password } = userData

            if (!email || !password || !userName) {
                throw new Error('Missing required fields')
            }

            const exists = await User.findOne({ email })
            if (exists) {
                throw new Error('Email already exists')
            }

            const hashed = await bcrypt.hash(password, 10)
            const user = await User.create({
                userId: randomUUID(),
                userName,
                email,
                password: hashed
            })

            return this.sanitizeUser(user)
        },

        deleteUserById: async (userId) => {
            return await User.findByIdAndDelete(userId)
        }
    }
}

export default AuthService()