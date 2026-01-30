import OpenAI from "openai";


const openai = new OpenAI({
    apiKey: "hi",
    baseURL: "http://localhost:1234/v1",
    dangerouslyAllowBrowser: true,
})

export default openai;