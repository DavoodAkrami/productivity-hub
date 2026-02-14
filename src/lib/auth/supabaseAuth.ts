import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type LoginPayload = {
    email: string;
    password: string;
};

export type SignUpPayload = {
    name: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export type VerifyEmailCodePayload = {
    email: string;
    code: string;
};

export type ResendSignUpCodePayload = {
    email: string;
};

export const validateSignUpPayload = (payload: SignUpPayload) => {
    if (!payload.name.trim()) return "First name is required.";
    if (!payload.lastName.trim()) return "Last name is required.";
    if (!payload.email.trim()) return "Email is required.";
    if (!payload.password.trim()) return "Password is required.";
    if (payload.password !== payload.confirmPassword) return "Passwords do not match.";
    return null;
};

const getConfiguredDomain = () => {
    if (typeof window !== "undefined" && window.location.origin) {
        return window.location.origin.replace(/\/+$/, "");
    }

    const configured =
        process.env.NEXT_PUBLIC_DOMINE?.trim() ||
        process.env.NEXT_PUBLIC_DOMAIN?.trim() ||
        "";
    return configured.replace(/\/+$/, "");
};

export const loginWithEmail = async (payload: LoginPayload) => {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    if (!payload.email.trim() || !payload.password.trim()) {
        throw new Error("Email and password are required.");
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email.trim(),
        password: payload.password,
    });
    if (error) throw new Error(error.message);
    return data;
};

export const signUpWithEmail = async (payload: SignUpPayload) => {
    const validationError = validateSignUpPayload(payload);
    if (validationError) {
        throw new Error(validationError);
    }
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    const supabase = getSupabaseBrowserClient();

    const redirectTo = (() => {
        const configuredDomain = getConfiguredDomain();
        if (configuredDomain) return `${configuredDomain}/login`;
        if (typeof window !== "undefined") return `${window.location.origin}/login`;
        return undefined;
    })();

    const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
        options: {
            emailRedirectTo: redirectTo,
            data: {
                first_name: payload.name.trim(),
                last_name: payload.lastName.trim(),
            },
        },
    });

    if (error) {
        const normalized = error.message.toLowerCase();
        if (
            normalized.includes("already registered") ||
            normalized.includes("user already exists") ||
            normalized.includes("already exists")
        ) {
            throw new Error("An account with this email already exists.");
        }
        throw new Error(error.message);
    }
    return data;
};

export const verifyEmailCode = async (payload: VerifyEmailCodePayload) => {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    const email = payload.email.trim();
    const code = payload.code.trim();
    if (!email) throw new Error("Email is required.");
    if (!code) throw new Error("Verification code is required.");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
    });
    if (error) throw new Error(error.message);
    return data;
};

export const resendSignUpCode = async (payload: ResendSignUpCodePayload) => {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    const email = payload.email.trim();
    if (!email) throw new Error("Email is required.");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resend({
        type: "signup",
        email,
    });
    if (error) throw new Error(error.message);
    return true;
};

export const continueWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    const supabase = getSupabaseBrowserClient();
    const redirectTo = (() => {
        const configuredDomain = getConfiguredDomain();
        if (configuredDomain) return `${configuredDomain}/bookmarks`;
        if (typeof window !== "undefined") return `${window.location.origin}/bookmarks`;
        return undefined;
    })();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
    });

    if (error) throw new Error(error.message);
    return data;
};

export const getCurrentSession = async () => {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
};

export const logoutUser = async () => {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return true;
};

export const deleteCurrentUserAccount = async (session: Session | null) => {
    if (!session?.access_token) {
        throw new Error("No active session found.");
    }
    const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${session.access_token}`,
        },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete account.");
    }
    return true;
};

export type CurrentUserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    role: "user" | "admin";
};

const mapUserToProfile = (user: User): CurrentUserProfile => {
    const meta = user.user_metadata ?? {};
    const identityData = (user.identities?.[0]?.identity_data ?? {}) as Record<string, unknown>;
    const email = user.email ?? "";
    const firstName =
        String(meta.first_name ?? meta.given_name ?? identityData.given_name ?? "").trim() ||
        String(meta.name ?? "").trim().split(" ")[0] ||
        String(identityData.full_name ?? "").trim().split(" ")[0] ||
        (email ? email.split("@")[0] : "User");
    const lastName =
        String(meta.last_name ?? meta.family_name ?? identityData.family_name ?? "").trim() ||
        String(meta.name ?? "")
            .trim()
            .split(" ")
            .slice(1)
            .join(" ") ||
        String(identityData.full_name ?? "")
            .trim()
            .split(" ")
            .slice(1)
            .join(" ");
    const avatarUrl =
        String(meta.avatar_url ?? meta.picture ?? identityData.avatar_url ?? identityData.picture ?? "").trim();

    return {
        id: user.id,
        email,
        firstName,
        lastName,
        avatarUrl,
        role: "user",
    };
};

export const getCurrentUserProfile = async (): Promise<CurrentUserProfile | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const base = mapUserToProfile(data.user);
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
    return {
        ...base,
        role: profile?.role === "admin" ? "admin" : "user",
    };
};
