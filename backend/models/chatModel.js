import mongoose from "mongoose";

export const Conversation = mongoose.model('Conversation', mongoose.Schema({
    conversationId: { type: String, required: true },
    userId: { type: String, required: true },
    messages: [
        {
            userMsg: { type: String },
            botMsg: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    summary: { type: String },
}, { versionKey: false, timestamps: true, strict: false }))