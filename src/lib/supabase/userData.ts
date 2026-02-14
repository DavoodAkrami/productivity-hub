import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type BookmarkRow = {
    id: string;
    title: string;
    description: string;
    link: string;
};

export type TodoRow = {
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low" | null;
    label: string;
    due_date: string | null;
    completed: boolean;
    completed_at: string | null;
};

export type NoteRow = {
    id: string;
    title: string;
    content: string;
    color: string;
    label: string;
    note_date: string | null;
    created_at: string;
    updated_at: string;
};

export type CalendarEventRow = {
    id: string;
    title: string;
    description: string;
    color: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    created_at: string;
    updated_at: string;
};

export type LabelRow = {
    id: string;
    name: string;
    value: string;
};

export type AIChatRow = {
    id: string;
    title: string;
    search_index: string;
    created_at: string;
    updated_at: string;
};

export type AIMessageRow = {
    chat_id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
};

const getUserId = async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
};

export const fetchBookmarksForCurrentUser = async (): Promise<BookmarkRow[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .select("id,title,description,link")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as BookmarkRow[];
};

export const replaceBookmarksForCurrentUser = async (bookmarks: BookmarkRow[]) => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("bookmarks").delete().eq("user_id", userId);
    if (deleteError) throw new Error(deleteError.message);
    if (bookmarks.length === 0) return;
    const payload = bookmarks.map((item) => ({
        id: item.id,
        user_id: userId,
        title: item.title,
        description: item.description ?? "",
        link: item.link,
    }));
    const { error: insertError } = await supabase.from("bookmarks").insert(payload);
    if (insertError) throw new Error(insertError.message);
};

export const fetchTodosForCurrentUser = async (): Promise<TodoRow[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("todos")
        .select("id,title,description,priority,label,due_date,completed,completed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TodoRow[];
};

export const replaceTodosForCurrentUser = async (todos: TodoRow[]) => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("todos").delete().eq("user_id", userId);
    if (deleteError) throw new Error(deleteError.message);
    if (todos.length === 0) return;
    const payload = todos.map((task) => ({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        label: task.label ?? "",
        due_date: task.due_date,
        completed: task.completed,
        completed_at: task.completed_at,
    }));
    const { error: insertError } = await supabase.from("todos").insert(payload);
    if (insertError) throw new Error(insertError.message);
};

export const fetchNotesForCurrentUser = async (): Promise<NoteRow[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("notes")
        .select("id,title,content,color,label,note_date,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as NoteRow[];
};

export const replaceNotesForCurrentUser = async (notes: NoteRow[]) => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("notes").delete().eq("user_id", userId);
    if (deleteError) throw new Error(deleteError.message);
    if (notes.length === 0) return;
    const payload = notes.map((note) => ({
        id: note.id,
        user_id: userId,
        title: note.title,
        content: note.content,
        color: note.color ?? "",
        label: note.label ?? "",
        note_date: note.note_date,
        created_at: note.created_at,
        updated_at: note.updated_at,
    }));
    const { error: insertError } = await supabase.from("notes").insert(payload);
    if (insertError) throw new Error(insertError.message);
};

export const fetchCalendarEventsForCurrentUser = async (): Promise<CalendarEventRow[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("calendar_events")
        .select("id,title,description,color,event_date,start_time,end_time,created_at,updated_at")
        .eq("user_id", userId)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CalendarEventRow[];
};

export const replaceCalendarEventsForCurrentUser = async (events: CalendarEventRow[]) => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("calendar_events").delete().eq("user_id", userId);
    if (deleteError) throw new Error(deleteError.message);
    if (events.length === 0) return;
    const payload = events.map((event) => ({
        id: event.id,
        user_id: userId,
        title: event.title,
        description: event.description,
        color: event.color,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        created_at: event.created_at,
        updated_at: event.updated_at,
    }));
    const { error: insertError } = await supabase.from("calendar_events").insert(payload);
    if (insertError) throw new Error(insertError.message);
};

export const fetchLabelsForCurrentUser = async (): Promise<LabelRow[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("labels")
        .select("id,name,value")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as LabelRow[];
};

export const replaceLabelsForCurrentUser = async (labels: Omit<LabelRow, "id">[]) => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();

    // Normalize + dedupe to avoid unique collisions on (user_id, value).
    const byValue = new Map<string, { name: string; value: string }>();
    for (const label of labels) {
        const value = String(label.value ?? "").trim();
        if (!value) continue;
        if (!byValue.has(value)) {
            byValue.set(value, {
                name: String(label.name ?? value).trim() || value,
                value,
            });
        }
    }

    const normalized = Array.from(byValue.values());

    if (normalized.length === 0) {
        const { error: clearError } = await supabase.from("labels").delete().eq("user_id", userId);
        if (clearError) throw new Error(clearError.message);
        return;
    }

    const keptValues = new Set(normalized.map((label) => label.value));
    const { data: existingRows, error: existingError } = await supabase
        .from("labels")
        .select("id,value")
        .eq("user_id", userId);
    if (existingError) throw new Error(existingError.message);

    const staleIds = (existingRows ?? [])
        .filter((row) => !keptValues.has(String(row.value ?? "")))
        .map((row) => row.id)
        .filter(Boolean);

    if (staleIds.length > 0) {
        const { error: deleteStaleError } = await supabase.from("labels").delete().in("id", staleIds);
        if (deleteStaleError) throw new Error(deleteStaleError.message);
    }

    const payload = normalized.map((label) => ({
        user_id: userId,
        name: label.name,
        value: label.value,
    }));
    const { error: upsertError } = await supabase
        .from("labels")
        .upsert(payload, { onConflict: "user_id,value" });
    if (upsertError) throw new Error(upsertError.message);
};

export const fetchAIChatsForCurrentUser = async () => {
    const userId = await getUserId();
    if (!userId) return { chats: [] as AIChatRow[], messages: [] as AIMessageRow[] };
    const supabase = getSupabaseBrowserClient();
    const { data: chats, error: chatsError } = await supabase
        .from("ai_chats")
        .select("id,title,search_index,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
    if (chatsError) throw new Error(chatsError.message);

    const { data: messages, error: messagesError } = await supabase
        .from("ai_messages")
        .select("chat_id,role,content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
    if (messagesError) throw new Error(messagesError.message);

    return {
        chats: (chats ?? []) as AIChatRow[],
        messages: (messages ?? []) as AIMessageRow[],
    };
};

export const replaceAIChatsForCurrentUser = async (
    chats: AIChatRow[],
    messages: AIMessageRow[]
) => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();

    const { error: deleteMessagesError } = await supabase.from("ai_messages").delete().eq("user_id", userId);
    if (deleteMessagesError) throw new Error(deleteMessagesError.message);

    const { error: deleteChatsError } = await supabase.from("ai_chats").delete().eq("user_id", userId);
    if (deleteChatsError) throw new Error(deleteChatsError.message);

    if (chats.length > 0) {
        const chatPayload = chats.map((chat) => ({
            id: chat.id,
            user_id: userId,
            title: chat.title,
            search_index: chat.search_index ?? "",
            created_at: chat.created_at,
            updated_at: chat.updated_at,
        }));
        const { error: insertChatsError } = await supabase.from("ai_chats").insert(chatPayload);
        if (insertChatsError) throw new Error(insertChatsError.message);
    }

    if (messages.length > 0) {
        const messagePayload = messages.map((msg) => ({
            user_id: userId,
            chat_id: msg.chat_id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
        }));
        const { error: insertMessagesError } = await supabase.from("ai_messages").insert(messagePayload);
        if (insertMessagesError) throw new Error(insertMessagesError.message);
    }
};
