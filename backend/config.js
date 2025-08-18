import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(import.meta.dirname, '.env') });

export default {
    MONGO_URL: process.env.DB_URL || 'mongodb://localhost:27017/news_chat_bot',
    PG_URL: process.env.PG_URL || 'postgres://postgres:postgres@localhost:5432/news_chat_bot',
    WEB_PORT: process.env.WEB_PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret_in_production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ADMIN_EMAILS: process.env.ADMIN_EMAILS || [],
    CHAT_MODEL: 'qwen/qwen3-14b',
    EMBED_MODEL: 'text-embedding-nomic-embed-text-v1.5',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    USE_LOCAL_MODEL: process.env.USE_LOCAL_MODEL || true,
    LOCAL_MODEL_URL: process.env.LOCAL_MODEL_URL || 'http://localhost:11434/v1',
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY
}
