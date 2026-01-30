import OpenAI from "openai";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPEN_AI_BASE_URL,
    dangerouslyAllowBrowser: true,
})

export default openai;