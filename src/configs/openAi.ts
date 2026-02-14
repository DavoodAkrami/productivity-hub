import OpenAI from "openai";

let browserClient: OpenAI | null = null;

const normalizeBaseURL = (raw: string) => {
    const input = raw.trim();
    if (!/^https?:\/\//i.test(input)) return undefined;

    let parsed: URL;
    try {
        parsed = new URL(input);
    } catch {
        return undefined;
    }

    let path = parsed.pathname.replace(/\/+$/, "");
    if (path === "") path = "/";

    // Most OpenAI-compatible providers expect a v1 API root.
    if (path === "/" || !/\/v\d+$/i.test(path)) {
        path = path === "/" ? "/v1" : `${path}/v1`;
    }

    parsed.pathname = path;
    return parsed.toString().replace(/\/+$/, "");
};

const getConfig = () => {
    const isBrowser = typeof window !== "undefined";
    const apiKey = isBrowser
        ? process.env.NEXT_PUBLIC_OPENAI_API_KEY
        : process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const rawBaseUrl = isBrowser
        ? process.env.NEXT_PUBLIC_OPEN_AI_BASE_URL || ""
        : process.env.OPEN_AI_BASE_URL || process.env.NEXT_PUBLIC_OPEN_AI_BASE_URL || "";
    const baseURL = normalizeBaseURL(rawBaseUrl);
    return { apiKey, baseURL };
};

export const getOpenAIClient = () => {
    const { apiKey, baseURL } = getConfig();
    if (!apiKey) {
        throw new Error("OpenAI API key is missing.");
    }

    if (typeof window !== "undefined") {
        if (!browserClient) {
            browserClient = new OpenAI({
                apiKey,
                baseURL,
                dangerouslyAllowBrowser: true,
            });
        }
        return browserClient;
    }

    return new OpenAI({
        apiKey,
        baseURL,
    });
};
