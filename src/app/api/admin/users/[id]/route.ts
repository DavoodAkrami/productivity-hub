import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getConfig = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return { supabaseUrl, supabaseAnonKey, serviceRoleKey };
};

const getTokenFromHeader = (request: Request) => {
    const authHeader = request.headers.get("authorization") || "";
    return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
};

const ensureAdmin = async (request: Request) => {
    const { supabaseUrl, supabaseAnonKey, serviceRoleKey } = getConfig();
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        throw new Error("Server is missing Supabase configuration.");
    }

    const token = getTokenFromHeader(request);
    if (!token) throw new Error("Missing access token.");

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
        data: { user },
        error: userError,
    } = await anonClient.auth.getUser(token);

    if (userError || !user) throw new Error("Invalid session.");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
        throw new Error("Admin access required.");
    }

    return { adminClient, user };
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { adminClient, user } = await ensureAdmin(request);
        const { id } = await context.params;
        const payload = (await request.json().catch(() => ({}))) as { role?: string };
        const nextRole = payload.role === "admin" ? "admin" : "user";

        if (id === user.id && nextRole !== "admin") {
            return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 400 });
        }

        const { error } = await adminClient
            .from("profiles")
            .upsert({ id, role: nextRole }, { onConflict: "id" });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        const status = message.includes("Admin") || message.includes("session") || message.includes("token") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { adminClient, user } = await ensureAdmin(request);
        const { id } = await context.params;

        if (id === user.id) {
            return NextResponse.json({ error: "Use regular delete account flow for your own account." }, { status: 400 });
        }

        const { error } = await adminClient.auth.admin.deleteUser(id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        const status = message.includes("Admin") || message.includes("session") || message.includes("token") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
