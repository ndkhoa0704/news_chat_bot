import mongoose from "mongoose";

export const User = mongoose.model('User', mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
}, { versionKey: false, timestamps: true, strict: false }))