import { NextResponse } from "next/server";
import openai from "@/configs/openAi";

type Payload = {
    name: string;
    stats: {
        bookmarksCount: number;
        notesCount: number;
        avgDonePerDay: number;
        recentSeries: Array<{ day: string; done: number }>;
    };
    activeGoals: Array<{ title: string; dueDate: string }>;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Payload;

        const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY is missing on the server. AI feedback cannot be generated." },
                { status: 500 }
            );
        }

        const compactSeries = body.stats.recentSeries.map((item) => `${item.day}:${item.done}`).join(", ");
        const goals = body.activeGoals.slice(0, 5).map((goal) => `${goal.title} (${goal.dueDate})`).join("; ");

        const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                {
                    role: "system",
                    content: "You are a concise productivity coach. Output plain text only.",
                },
                {
                    role: "user",
                    content:
                        `Name: ${body.name}. Stats -> avg/day: ${body.stats.avgDonePerDay}, bookmarks: ${body.stats.bookmarksCount}, notes: ${body.stats.notesCount}. ` +
                        `Daily done: ${compactSeries || "none"}. Active goals: ${goals || "none"}. ` +
                        "Write max 70 words. Give: 1 short praise, 1 risk, 2 actionable tips.",
                },
            ],
            max_tokens: 110,
            temperature: 0.4,
        });

        const feedback = completion.choices[0]?.message?.content?.trim();
        if (!feedback) {
            return NextResponse.json({ error: "AI returned an empty response." }, { status: 500 });
        }

        return NextResponse.json({ feedback });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate feedback.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
