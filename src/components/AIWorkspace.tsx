"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getOpenAIClient } from "@/configs/openAi";
import Button from "@/components/Buttons";
import Notodolists from "@/components/Notodolists";
import { AnimatePresence, motion } from "motion/react";
import { IoIosArrowUp } from "react-icons/io";
import clsx from "clsx";
import { BiCopy, BiHistory } from "react-icons/bi";
import { BsCircleFill } from "react-icons/bs";
import { FiCheck, FiPlus, FiTrash2 } from "react-icons/fi";
import { BsStopFill } from "react-icons/bs";
import { useRouter } from "next/navigation";
import { fetchAIChatsForCurrentUser, replaceAIChatsForCurrentUser } from "@/lib/supabase/userData";

interface MessageType {
    id: number;
    message: string;
    role: "user" | "assistant" | "system";
}

type ChatThread = {
    id: string;
    title: string;
    searchIndex: string;
    messages: MessageType[];
    createdAt: string;
    updatedAt: string;
};

type NotificationState = {
    isOpen: boolean;
    title: string;
    description: string;
    variant: "default" | "success" | "error";
    retryToken?: number;
    key: number;
};

const AI_CHATS_KEY = "aiChats";
const LEGACY_CHAT_KEY = "chatHistory";

const normalizeText = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "for", "to", "of", "in", "on", "at", "with", "from",
    "is", "are", "was", "were", "be", "am", "it", "this", "that", "i", "you", "we", "they",
    "he", "she", "my", "your", "our", "their", "me", "please", "help", "need",
    "و", "یا", "که", "را", "از", "به", "در", "با", "برای", "این", "اون", "آن", "من", "تو", "ما"
]);

const buildChatMetaFromFirstMessage = (text: string) => {
    const normalized = normalizeText(text);
    if (!normalized) return { title: "New Chat", searchSeed: "" };

    const tokens = normalized.split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
    const uniqueKeywords: string[] = [];
    for (const token of tokens) {
        if (!uniqueKeywords.includes(token)) uniqueKeywords.push(token);
        if (uniqueKeywords.length === 4) break;
    }

    const fallbackWords = normalized.split(" ").slice(0, 4);
    const titleWords = uniqueKeywords.length > 0 ? uniqueKeywords : fallbackWords;
    const titleRaw = titleWords.join(" ");
    const title = titleRaw.length > 36 ? `${titleRaw.slice(0, 36)}...` : titleRaw;
    return { title, searchSeed: normalized };
};

const buildSearchIndex = (chat: ChatThread) => {
    const joinedMessages = chat.messages.map((message) => message.message).join(" ");
    return normalizeText(`${chat.title} ${joinedMessages}`);
};

const makeUniqueTitle = (baseTitle: string, existingChats: ChatThread[], excludeId?: string) => {
    const trimmedBase = baseTitle.trim() || "New Chat";
    const used = new Set(
        existingChats
            .filter((chat) => chat.id !== excludeId)
            .map((chat) => chat.title.trim().toLowerCase())
    );
    if (!used.has(trimmedBase.toLowerCase())) return trimmedBase;

    let i = 2;
    while (used.has(`${trimmedBase} (${i})`.toLowerCase())) {
        i += 1;
    }
    return `${trimmedBase} (${i})`;
};

const dedupeChatTitles = (inputChats: ChatThread[]) => {
    const used = new Map<string, number>();
    return inputChats.map((chat) => {
        const base = chat.title.trim() || "New Chat";
        const key = base.toLowerCase();
        const count = used.get(key) ?? 0;
        used.set(key, count + 1);
        if (count === 0) return chat;

        let i = count + 1;
        let candidate = `${base} (${i})`;
        while (used.has(candidate.toLowerCase())) {
            i += 1;
            candidate = `${base} (${i})`;
        }
        used.set(candidate.toLowerCase(), 1);
        return { ...chat, title: candidate };
    });
};

const AIWorkspace: React.FC<{ routeChatId?: string | null }> = ({ routeChatId = null }) => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [input, setInput] = useState<string>("");
    const [chats, setChats] = useState<ChatThread[]>([]);
    const [isChatHovered, setIsChatHovered] = useState<number | null>(null);
    const [clipBoard, setClipBoard] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
    const [transientChatId, setTransientChatId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [retryPayload, setRetryPayload] = useState<{ message: string; chatId: string | null } | null>(null);
    const [notification, setNotification] = useState<NotificationState>({
        isOpen: false,
        title: "",
        description: "",
        variant: "default",
        retryToken: undefined,
        key: 0,
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastChat = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const pendingTextRef = useRef<string>("");
    const typingTimerRef = useRef<number | null>(null);
    const activeTypingRef = useRef<{ chatId: string; assistantId: number } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const chatsHydratedRef = useRef<boolean>(false);

    const effectiveChatId = routeChatId ?? transientChatId;
    const activeChat = useMemo(
        () => chats.find((chat) => chat.id === effectiveChatId) ?? null,
        [chats, effectiveChatId]
    );

    const currentMessages = useMemo(() => activeChat?.messages ?? [], [activeChat]);
    const isNewChat = !effectiveChatId || currentMessages.length === 0;

    const sortedChats = useMemo(
        () => [...chats].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        [chats]
    );

    const persistChats = (nextChats: ChatThread[]) => {
        setChats(nextChats);
        localStorage.setItem(AI_CHATS_KEY, JSON.stringify(nextChats));
    };

    const updateChatInStorage = (chatId: string, updater: (chat: ChatThread) => ChatThread) => {
        const stored = localStorage.getItem(AI_CHATS_KEY);
        const parsed: ChatThread[] = stored ? JSON.parse(stored) : chats;
        const next = parsed.map((chat) => {
            if (chat.id !== chatId) return chat;
            const updated = updater(chat);
            return { ...updated, searchIndex: buildSearchIndex(updated) };
        });
        localStorage.setItem(AI_CHATS_KEY, JSON.stringify(next));
        setChats(next);
    };

    const updateChat = (chatId: string, updater: (chat: ChatThread) => ChatThread) => {
        updateChatInStorage(chatId, updater);
    };

    const stopTypingLoop = () => {
        if (typingTimerRef.current) {
            window.clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
        }
        activeTypingRef.current = null;
        pendingTextRef.current = "";
    };

    const startTypingLoop = (chatId: string, assistantId: number) => {
        const current = activeTypingRef.current;
        if (current && (current.chatId !== chatId || current.assistantId !== assistantId)) {
            stopTypingLoop();
        }
        activeTypingRef.current = { chatId, assistantId };
        if (typingTimerRef.current) return;

        typingTimerRef.current = window.setInterval(() => {
            const active = activeTypingRef.current;
            if (!active) return;
            const pending = pendingTextRef.current;
            if (!pending) return;

            const step = Math.max(1, Math.min(4, Math.ceil(pending.length / 18)));
            const chunk = pending.slice(0, step);
            pendingTextRef.current = pending.slice(step);

            updateChat(active.chatId, (chat) => ({
                ...chat,
                updatedAt: new Date().toISOString(),
                messages: chat.messages.map((message) =>
                    message.id === active.assistantId
                        ? { ...message, message: message.message + chunk }
                        : message
                ),
            }));
        }, 24);
    };

    const startNewChat = () => {
        setInput("");
        setIsHistoryOpen(false);
        setTransientChatId(null);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        router.push("/AI");
    };

    const showErrorNotification = (message: string) => {
        setNotification({
            isOpen: true,
            title: "AI Error",
            description: message,
            variant: "error",
            retryToken: Date.now(),
            key: Date.now(),
        });
    };

    const stopGeneration = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        stopTypingLoop();
        setLoading(false);
        setIsStreaming(false);
    };

    const handleDeleteChat = (chatToDelete: ChatThread) => {
        const nextChats = chats.filter((chat) => chat.id !== chatToDelete.id);
        persistChats(nextChats);
        if (effectiveChatId === chatToDelete.id) {
            setTransientChatId(null);
            router.push("/AI");
        }
        setNotification({
            isOpen: true,
            title: "Chat Deleted",
            description: `${chatToDelete.title} chat deleted.`,
            variant: "error",
            key: Date.now(),
        });
    };

    const sendMessage = async (rawMessage: string, forceChatId?: string | null) => {
        const trimmedMessage = rawMessage.trim();
        if (!trimmedMessage || loading) {
            return;
        }

        setLoading(true);
        setIsStreaming(true);

        const userMessage: MessageType = {
            id: Math.random(),
            message: trimmedMessage,
            role: "user",
        };

        const assistantId = Math.random();
        const assistantPlaceholder: MessageType = {
            id: assistantId,
            message: "",
            role: "assistant",
        };

        const now = new Date().toISOString();
        let chatId = forceChatId ?? (effectiveChatId && activeChat ? effectiveChatId : null);
        let priorMessages: MessageType[] = [];

        if (!chatId) {
            chatId = crypto.randomUUID();
            const meta = buildChatMetaFromFirstMessage(trimmedMessage);
            const uniqueTitle = makeUniqueTitle(meta.title, chats);
            const newChat: ChatThread = {
                id: chatId,
                title: uniqueTitle,
                searchIndex: meta.searchSeed,
                messages: [userMessage, assistantPlaceholder],
                createdAt: now,
                updatedAt: now,
            };
            const hydrated = { ...newChat, searchIndex: buildSearchIndex(newChat) };
            persistChats([hydrated, ...chats]);
            setTransientChatId(chatId);
        } else {
            priorMessages = activeChat?.messages ?? [];
            updateChat(chatId, (chat) => ({
                ...chat,
                messages: [...chat.messages, userMessage, assistantPlaceholder],
                updatedAt: now,
            }));
        }

        setInput("");
        setRetryPayload(null);
        setNotification((prev) => ({ ...prev, retryToken: undefined }));
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            const shortTermMemory = priorMessages
                .filter((chat) => chat.role !== "system" && chat.message.trim() !== "")
                .slice(-10)
                .map((chat) => ({
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

            abortControllerRef.current = new AbortController();
            const stream = await getOpenAIClient().chat.completions.create(
                {
                    model: "gpt-5-nano",
                    messages: shortTermMemory,
                    stream: true,
                },
                {
                    signal: abortControllerRef.current.signal,
                }
            );

            let didReceiveFirstChunk = false;
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || "";
                if (!delta) continue;
                if (!didReceiveFirstChunk) {
                    didReceiveFirstChunk = true;
                    setLoading(false);
                }
                pendingTextRef.current += delta;
                startTypingLoop(chatId, assistantId);
            }
        } catch (err) {
            const isAbort = err instanceof Error && err.name === "AbortError";
            if (isAbort) {
                updateChat(chatId, (chat) => ({
                    ...chat,
                    messages: chat.messages.filter((message) =>
                        !(message.id === assistantId && message.message.trim() === "")
                    ),
                }));
                return;
            }
            console.error(err);
            const message = "Failed to send your request. Please try again.";
            showErrorNotification(message);
            setRetryPayload({ message: trimmedMessage, chatId });
            stopTypingLoop();
            updateChat(chatId, (chat) => ({
                ...chat,
                messages: chat.messages.filter((message) => message.id !== assistantId),
            }));
        } finally {
            abortControllerRef.current = null;
            if (activeTypingRef.current?.chatId === chatId && activeTypingRef.current?.assistantId === assistantId) {
                await new Promise<void>((resolve) => {
                    const check = () => {
                        if (!pendingTextRef.current) {
                            stopTypingLoop();
                            resolve();
                            return;
                        }
                        window.setTimeout(check, 30);
                    };
                    check();
                });
            }
            setLoading(false);
            setIsStreaming(false);
            if (!routeChatId) {
                router.push(`/AI/${chatId}`);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };

    const isSendDisabled = !isStreaming && (loading || input.trim() === "");

    useEffect(() => {
        const bootstrap = async () => {
            setChatLoading(true);
            try {
                const remote = await fetchAIChatsForCurrentUser();
                if (remote.chats.length > 0) {
                    const messagesByChat = new Map<string, MessageType[]>();
                    remote.messages.forEach((msg, index) => {
                        const arr = messagesByChat.get(msg.chat_id) ?? [];
                        arr.push({
                            id: Number(`${index + 1}${Math.floor(Math.random() * 9999)}`),
                            role: msg.role,
                            message: msg.content,
                        });
                        messagesByChat.set(msg.chat_id, arr);
                    });
                    const next = remote.chats.map((chat) => ({
                        id: chat.id,
                        title: chat.title,
                        searchIndex: chat.search_index ?? "",
                        createdAt: chat.created_at,
                        updatedAt: chat.updated_at,
                        messages: messagesByChat.get(chat.id) ?? [],
                    }));
                    const deduped = dedupeChatTitles(next);
                    setChats(deduped);
                    localStorage.setItem(AI_CHATS_KEY, JSON.stringify(deduped));
                    setChatLoading(false);
                    chatsHydratedRef.current = true;
                    return;
                }
            } catch {
                // fallback to local data
            }
            try {
                const storedChats = localStorage.getItem(AI_CHATS_KEY);
                if (storedChats) {
                    const parsed = JSON.parse(storedChats) as ChatThread[];
                    if (Array.isArray(parsed)) {
                        const normalized = parsed.map((chat) => ({ ...chat, searchIndex: chat.searchIndex ?? buildSearchIndex(chat) }));
                        const deduped = dedupeChatTitles(normalized);
                        setChats(deduped);
                        localStorage.setItem(AI_CHATS_KEY, JSON.stringify(deduped));
                    }
                    setChatLoading(false);
                    chatsHydratedRef.current = true;
                    return;
                }
            } catch {
                setChats([]);
            }
            const legacy = localStorage.getItem(LEGACY_CHAT_KEY);
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy) as MessageType[];
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const migrated: ChatThread = {
                            id: crypto.randomUUID(),
                            title: "Previous Chat",
                            searchIndex: normalizeText(parsed.map((message) => message.message).join(" ")),
                            messages: parsed,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        setChats([migrated]);
                        localStorage.setItem(AI_CHATS_KEY, JSON.stringify([migrated]));
                    }
                } catch {
                    setChats([]);
                }
            }
            setChatLoading(false);
            chatsHydratedRef.current = true;
        };

        void bootstrap();
    }, []);

    useEffect(() => {
        if (!chatsHydratedRef.current || isStreaming) return;
        const timer = window.setTimeout(() => {
            const chatRows = chats.map((chat) => ({
                id: chat.id,
                title: chat.title,
                search_index: chat.searchIndex ?? "",
                created_at: chat.createdAt,
                updated_at: chat.updatedAt,
            }));
            const messageRows = chats.flatMap((chat) =>
                chat.messages.map((message, index) => ({
                    chat_id: chat.id,
                    role: message.role,
                    content: message.message,
                    created_at: new Date(new Date(chat.createdAt).getTime() + index).toISOString(),
                }))
            );
            void replaceAIChatsForCurrentUser(chatRows, messageRows);
        }, 700);

        return () => window.clearTimeout(timer);
    }, [chats, isStreaming]);

    useEffect(() => {
        if (lastChat.current) {
            lastChat.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [currentMessages]);

    useEffect(() => {
        if (routeChatId) {
            setTransientChatId(null);
        }
    }, [routeChatId]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
            stopTypingLoop();
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (isHistoryOpen && historyRef.current && !historyRef.current.contains(target)) {
                setIsHistoryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isHistoryOpen]);

    const checkIsPersian = (text: string) => /[\u0600-\u06FF]/.test(text);

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setClipBoard(text);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full mx-auto flex flex-col h-screen pb-[3vh] pt-[3vh] relative">
            <Notodolists
                key={notification.key}
                title={notification.title}
                description={notification.description}
                variant={notification.variant}
                isOpen={notification.isOpen}
                undoLabel="Retry"
                onUndo={notification.retryToken && retryPayload ? () => {
                    void sendMessage(retryPayload.message, retryPayload.chatId);
                } : undefined}
                onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
            />
            <div className="absolute top-3 right-3 z-30" ref={historyRef}>
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={startNewChat}
                        className="cursor-pointer p-2.5 rounded-xl border-2 border-[var(--fill-primary)] bg-[var(--bg-control)] hover:bg-[var(--fill-primary)] transition-colors"
                        aria-label="New chat"
                    >
                        <FiPlus />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsHistoryOpen((prev) => !prev)}
                        className="cursor-pointer p-2.5 rounded-xl border-2 border-[var(--fill-primary)] bg-[var(--bg-control)] hover:bg-[var(--fill-primary)] transition-colors"
                        aria-label="Chat history"
                    >
                        <BiHistory />
                    </button>
                </div>

                <AnimatePresence>
                    {isHistoryOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            className="mt-2 w-[86vw] md:w-96 max-h-[60vh] overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-[var(--fill-primary)] bg-[var(--bg-control)]/90 backdrop-blur-xl p-2 shadow-xl"
                        >
                            {sortedChats.length === 0 ? (
                                <p className="text-sm text-[var(--text-secondary)] p-3">No chat history yet.</p>
                            ) : (
                                <ul className="flex flex-col gap-1">
                                    {sortedChats.map((chat) => {
                                        return (
                                            <li key={chat.id}>
                                                <div
                                                    className={clsx(
                                                        "w-full p-3 rounded-xl hover:bg-[var(--fill-primary)] transition-colors flex items-start gap-2",
                                                        effectiveChatId === chat.id && "bg-[var(--fill-primary)]"
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTransientChatId(null);
                                                            router.push(`/AI/${chat.id}`);
                                                            setIsHistoryOpen(false);
                                                        }}
                                                        className="flex-1 text-left cursor-pointer min-w-0"
                                                    >
                                                        <p className="font-semibold truncate max-w-full">{chat.title}</p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 rounded-lg text-[var(--accent-red)] hover:bg-[var(--accent-red)]/12 cursor-pointer"
                                                        onClick={() => handleDeleteChat(chat)}
                                                        aria-label="Delete chat"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                            <h2 className="h2 text-[2rem] md:text-[3rem] lg:text-[4rem] font-bold flex justify-center items-center h-full text-center px-4">
                                Welcome Ask Anything
                            </h2>
                        ) : (
                            <div className="w-[94%] md:w-[80%] lg:w-[45.5%] mx-auto">
                                {currentMessages.map((chat, index) => (
                                    <div
                                        key={chat.id}
                                        className={clsx(
                                            "flex flex-col pb-6 mb-2 relative",
                                            chat.role === "user"
                                                ? "items-end"
                                                : checkIsPersian(chat.message)
                                                    ? "items-end"
                                                    : "items-start"
                                        )}
                                        onMouseOver={() => setIsChatHovered(chat.id)}
                                        onMouseLeave={() => setIsChatHovered(null)}
                                    >
                                        <div
                                            ref={index === currentMessages.length - 1 ? lastChat : null}
                                            className={clsx(
                                                "flex flex-col overflow-y-auto",
                                                chat.role === "user"
                                                    ? "p-4 bg-[var(--bg-control)] rounded-2xl my-3 max-w-[85%]"
                                                    : "max-w-[100%] py-2"
                                            )}
                                            style={{
                                                direction: checkIsPersian(chat.message) ? "rtl" : "ltr",
                                                textAlign: checkIsPersian(chat.message) ? "right" : "left",
                                            }}
                                        >
                                            {chat.message}
                                        </div>

                                        <button
                                            onClick={() => copyText(chat.message)}
                                            className={clsx(
                                                "absolute bottom-0 right-0 mt-2 p-2 rounded-xl hover:bg-[var(--bg-control)] cursor-pointer",
                                                (isChatHovered !== chat.id || !chat.message.trim()) && "hidden"
                                            )}
                                        >
                                            {clipBoard === chat.message ? <FiCheck /> : <BiCopy />}
                                        </button>
                                    </div>
                                ))}
                                {loading && <BsCircleFill className="text-pulse animate-pulse" />}
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="w-[94%] md:w-[80%] lg:w-[45.5%] mx-auto flex justify-center items-center gap-1 relative"
                    >
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Ask Anything"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                const el = e.target;
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                            }}
                            className="bg-[var(--bg-control)] py-4 pl-6 pr-14 rounded-[2rem] outline-none focus:border-[var(--accent-blue)] w-full resize-none transition-all overflow-hidden leading-[1.6rem] max-h-[8rem]"
                            style={{
                                overflowY: "hidden",
                                direction: checkIsPersian(input) ? "rtl" : "ltr",
                                textAlign: checkIsPersian(input) ? "right" : "left",
                            }}
                        />

                        <Button
                            htmlType={isStreaming ? "button" : "submit"}
                            kind="button"
                            variant="filled"
                            color="accent-blue"
                            size="manual"
                            classname="p-3 absolute right-2 bottom-2.5 disabled:opacity-[60%]"
                            disabled={isSendDisabled}
                            onClick={isStreaming ? stopGeneration : undefined}
                        >
                            {isStreaming ? <BsStopFill className="rounded-sm" /> : <IoIosArrowUp className="rounded-full" />}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
};

export default AIWorkspace;
