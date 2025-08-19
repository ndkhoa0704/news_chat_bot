import OpenAI from 'openai'
import config from '../config.js'
import tools from '../tools/index.js'


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
                model: config.CHAT_MODEL,
                messages,
                temperature,
                tools: toolSpecs,
                tool_choice,
                stream,
            })
        },
        sendMsg: async (messages) => {
            const stream = await SELF.client.chat.completions.create({
                model: config.CHAT_MODEL,
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
                content: 'Bạn là trợ lý tạo tiêu đề ngắn gọn cho cuộc trò chuyện. Hãy tạo một tiêu đề súc tích (tối đa 8 từ), bằng tiếng Việt, nêu đúng chủ đề. Chỉ xuất ra tiêu đề, không thêm ký tự trang trí.'
            }
            const resp = await SELF.client.chat.completions.create({
                model: config.CHAT_MODEL,
                temperature: 0.2,
                messages: [systemPrompt, ...messages],
            })
            return resp.choices?.[0]?.message?.content?.trim() || ''
        }
    }
}


export default ChatService()