import OpenAI from 'openai'
import tools from '../tools/index.js'
import PostgresService from './postgresService.js'

function ChatService() {
    const SELF = {
        client: (() => {
            if (process.env.USE_LOCAL_MODEL) {
                return new OpenAI({
                    baseURL: process.env.LOCAL_MODEL_URL,
                })
            }
            return new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })
        })(),
    }
    return {
        complete: async (messages, options = {}) => {
            const {
                temperature = 0.7,
                tools: toolSpecs = tools,
                tool_choice = 'auto',
                stream = false,
            } = options
            return await SELF.client.chat.completions.create({
                model: process.env.CHAT_MODEL,
                messages,
                temperature,
                tools: toolSpecs,
                tool_choice,
                stream,
            })
        },
        sendMsg: async (messages) => {
            const stream = await SELF.client.chat.completions.create({
                model: process.env.CHAT_MODEL,
                messages,
                temperature: 0.7,
                tools: tools,
                tool_choice: 'auto',
                stream: true,
            });
            return stream;
        },
        summarize: async (messages) => {
            const systemPrompt = {
                role: 'system',
                content: `You are a helpful assistant that summarizes conversations. 
                The summary should be concise and to the point, and should be in the same language as the conversation
                and have at most 255 characters.
                `
            }
            const resp = await SELF.client.chat.completions.create({
                model: process.env.CHAT_MODEL,
                temperature: 0.2,
                messages: [systemPrompt, ...messages],
            })
            return resp.choices?.[0]?.message?.content?.trim() || ''
        },
        /**
         * Embed a document and store it in the database
         * @param {string} name - The name of the document
         * @param {string} text - The text of the document
         * @returns {Promise<number>} - The id of the document
         */
        embedDocument: async (name, text) => {
            const resp = await SELF.client.embeddings.create({
                model: process.env.EMBEDDING_MODEL,
                input: text,
            })
            const embeddings = resp.data[0].embedding
            const query = `
                INSERT INTO documents (name, embeddings)
                VALUES ($1, $2)
                RETURNING id
            `
            const result = await PostgresService.executeSQL(query, [name, embeddings])
            return result[0].id
        }

    }
}


export default ChatService()