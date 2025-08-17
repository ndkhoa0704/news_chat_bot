import OpenAI from 'openai'
import config from '../config'


function ChatService() {
    const SELF = {
        client: (() => {
            if (config.USE_LOCAL_MODEL) {
                return new OpenAI({
                    baseURL: config.LOCAL_MODEL_URL,
                })
            }
            return new OpenAI({
                apiKey: config.OPENAI_API_KEY,
            })
        })(),
        streamResponse: async (msg, tools) => {
            const stream = await SELF.client.chat.completions.create({
                model: config.CHAT_MODEL,
                msg,
                temperature: 0.7,
                tools: tools,
                tool_choice: 'auto',
                stream: true,
            });
            return stream;
        }
    }
    return {
        sendMsg: async (msg) => {
            const stream = await SELF.streamResponse(msg)
            return stream
        }
    }
}


export default ChatService()