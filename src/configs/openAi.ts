import OpenAI from "openai";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    baseURL: process.env.OPEN_AI_BASE_URL || process.env.NEXT_PUBLIC_OPEN_AI_BASE_URL,
    dangerouslyAllowBrowser: typeof window !== "undefined",
})

export default openai;
