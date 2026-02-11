"use client";

import { useEffect, useState, useRef } from "react";
import openai from "@/configs/openAi";
import Button from "@/components/Buttons";
import { IoIosArrowUp } from "react-icons/io";
import clsx from "clsx";
import { BiCopy } from "react-icons/bi";
import { BsCircleFill } from "react-icons/bs";
import { FiCheck } from "react-icons/fi";


interface MessageType {
    id: number;
    message: string;
    role: "user" | "assistant" | "system";
}

const Ai = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState<string>("");
    const [isNewChat, setIsNewChat] = useState<boolean>(true);
    const [chatHistory, setChatHistory] = useState<MessageType[]>([]);
    const [isChatHovered, setIsChatHovered] = useState<number | null>(null);
    const [clipBoard, setClipBoard] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastChat = useRef<HTMLDivElement>(null);



    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedMessage = input.trim();
        if (!trimmedMessage) {
            setError("Please enter a valid message");
            return;
        }

        setError(null);
        setLoading(true);

        const userMessage: MessageType = {
            id: Math.random(),
            message: trimmedMessage,
            role: "user",
        };

        setChatHistory(prev => [...prev, userMessage]);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            const storedChats = JSON.parse(
                localStorage.getItem("chatHistory") || "[]"
            ) as MessageType[];

            const shortTermMemory = storedChats
                .slice(-10)
                .map(chat => ({
                    role: chat.role,
                    content: chat.message,
                }));

            shortTermMemory.unshift({
                role: "system",
                content: "Answer anything under 50 words.",
            });

            shortTermMemory.push({
                role: "user",
                content: trimmedMessage,
            });

            const assistantId = Math.random();

            setChatHistory(prev => [
                ...prev,
                {
                    id: assistantId,
                    message: "",
                    role: "assistant",
                },
            ]);

            const stream = await openai.chat.completions.create({
                model: "gpt-5-nano",
                messages: shortTermMemory,
                stream: true,
            });

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || "";
                if (!delta) continue;

                setChatHistory(prev =>
                    prev.map(chat =>
                        chat.id === assistantId
                            ? { ...chat, message: chat.message + delta }
                            : chat
                    )
                );
            }
        } catch (err) {
            console.error(err);
            setError("Failed to send your request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setChatLoading(true);
        const stored = localStorage.getItem("chatHistory");
        if (stored) {
            const parsed = JSON.parse(stored) as MessageType[];
            setChatHistory(parsed);
            if (parsed.length > 0) {
                setIsNewChat(false);
            }
        }
        setChatLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        if (chatHistory.length > 0 && isNewChat) {
            setIsNewChat(false);
        }
    }, [chatHistory, isNewChat]);

    useEffect(() => {
        if (lastChat.current) {
          lastChat.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, [chatHistory]);

    const checkIsPersian = (text: string) => {
        return /[\u0600-\u06FF]/.test(text);
    };

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setClipBoard(text);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full mx-auto flex flex-col h-screen pb-[3vh] pt-[3vh]">
            {chatLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-10 w-10">
                            <span className="absolute inset-0 rounded-full border-4 border-[var(--bg-control)] border-t-[var(--accent-blue)] animate-spin" />
                        </div>
                        <p className="text-sm text-gray-400">
                            Preparing your chat...
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div
                        className={clsx(
                            "w-full mx-auto overflow-y-auto pb-[1rem] pr-1",
                            isNewChat ? "h-[50%]" : "h-full"
                        )}
                    >
                        {isNewChat ? (
                            <h2 className="h2 text-[4rem] font-bold flex justify-center items-center h-full">
                                Welcome Ask Anything
                            </h2>
                        ) : error ? (
                            <div className="text-[red]">{error}</div>
                        ) : (
                            <div className="w-[45.5%] mx-auto">
                                {chatHistory.map((chat, index) => (
                                    <div
                                        key={chat.id}
                                        className={clsx(
                                            "flex flex-col pb-6 mb-2 relative",
                                            chat.role === "user"
                                                ? "items-end"
                                                : checkIsPersian(chat.message) ? 
                                                    "items-end" :
                                                    "items-start"
                                        )}
                                        onMouseOver={() =>
                                            setIsChatHovered(chat.id)
                                        }
                                        onMouseLeave={() =>
                                            setIsChatHovered(null)
                                        }
                                    >
                                        <div
                                            ref={index === chatHistory.length - 1 ? lastChat : null}
                                            className={clsx(
                                                "flex flex-col overflow-y-auto",
                                                chat.role === "user" ?
                                                    "p-4 bg-[var(--bg-control)] rounded-2xl my-3 max-w-[85%]"
                                                    : "max-w-[100%] py-2"
                                            )}
                                            style={{
                                                direction: checkIsPersian(
                                                    chat.message
                                                )
                                                    ? "rtl"
                                                    : "ltr",
                                                textAlign: checkIsPersian(
                                                    chat.message
                                                )
                                                    ? "right"
                                                    : "left",
                                            }}
                                        >
                                            {chat.message}
                                        </div>

                                        <button
                                            onClick={() =>
                                                copyText(chat.message)
                                            }
                                            className={clsx(
                                                "absolute bottom-0 right-0 mt-2 p-2 rounded-xl hover:bg-[var(--bg-control)] cursor-pointer",
                                                isChatHovered !== chat.id &&
                                                    "hidden"
                                            )}
                                        >
                                            {clipBoard === chat.message ? (
                                                <FiCheck />
                                            ) : (
                                                <BiCopy />
                                            )}
                                        </button>
                                    </div>
                                ))}
                                {loading && <BsCircleFill className="text-pulse animate-pulse" />}
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="w-[45.5%] mx-auto flex justify-center items-center gap-1 relative"
                    >
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            max-rows={4}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e); 
                                }
                            }}
                            placeholder="Ask Anything"
                            value={input}
                            onChange={e => {
                                setInput(e.target.value)
                                const el = e.target;
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                            }}
                            className="bg-[var(--bg-control)] py-4 pl-6 pr-14 rounded-[2rem] outline-none focus:border-[var(--accent-blue)] w-full resize-none transition-all overflow-hidden leading-[1.6rem] max-h-[8rem]"
                            style={{ 
                                overflowY: 'hidden', 
                                direction: checkIsPersian(input) ? 'rtl' : 'ltr',
                                textAlign: checkIsPersian(input) ? 'right' : 'left'
                            }}
                        />

                        <Button
                            htmlType="submit"
                            kind="button"
                            variant="filled"
                            color="accent-blue"
                            size="manual"
                            classname="p-3 absolute right-2 bottom-2.5 disabled:opacity-[60%]"
                            disabled={loading}
                        >
                            <IoIosArrowUp className="rounded-full" />
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
};

export default Ai;