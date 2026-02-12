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

export async function GET(request: Request) {
    try {
        const { adminClient } = await ensureAdmin(request);
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim();

        const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (usersError) {
            return NextResponse.json({ error: usersError.message }, { status: 500 });
        }

        const mapped = (users.users || []).map((u) => {
            const meta = u.user_metadata ?? {};
            const fullName = String(meta.full_name ?? "").trim();
            const firstName = String(meta.first_name ?? meta.given_name ?? "").trim() || fullName.split(" ")[0] || "";
            const lastName = String(meta.last_name ?? meta.family_name ?? "").trim() || fullName.split(" ").slice(1).join(" ");
            return {
                id: u.id,
                email: u.email ?? "",
                firstName,
                lastName,
                avatarUrl: String(meta.avatar_url ?? meta.picture ?? "").trim(),
                createdAt: u.created_at,
            };
        });

        const { data: profiles, error: profilesError } = await adminClient
            .from("profiles")
            .select("id,role");

        if (profilesError) {
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role]));

        const withRoles = mapped.map((u) => ({ ...u, role: roleById.get(u.id) ?? "user" }));

        const filtered = q
            ? withRoles.filter((u) => {
                  const source = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
                  return source.includes(q.toLowerCase());
              })
            : withRoles;

        return NextResponse.json({ users: filtered });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        const status = message.includes("Admin") || message.includes("session") || message.includes("token") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
