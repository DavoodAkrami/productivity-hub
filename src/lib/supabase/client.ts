import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const getConfig = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    return { url, anonKey };
};

export const isSupabaseConfigured = () => {
    const { url, anonKey } = getConfig();
    return Boolean(url) && Boolean(anonKey);
};

export const getSupabaseBrowserClient = () => {
    const { url, anonKey } = getConfig();
    if (!url || !anonKey) {
        throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    if (!client) {
        client = createClient(url, anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });
    }
    return client;
};
