import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        return NextResponse.json(
            { error: "Server is missing Supabase configuration. Add SUPABASE_SERVICE_ROLE_KEY." },
            { status: 500 }
        );
    }

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!accessToken) {
        return NextResponse.json({ error: "Missing access token." }, { status: 401 });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
        data: { user },
        error: userError,
    } = await anonClient.auth.getUser(accessToken);

    if (userError || !user) {
        return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
