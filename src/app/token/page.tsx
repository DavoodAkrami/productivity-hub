"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const TokenCallbackPage = () => {
    const router = useRouter();

    useEffect(() => {
        const completeAuth = async () => {
            try {
                const supabase = getSupabaseBrowserClient();
                await supabase.auth.getSession();
                const { data } = await supabase.auth.getUser();

                if (data.user) {
                    router.replace("/bookmarks");
                    return;
                }

                router.replace("/login");
            } catch {
                router.replace("/login");
            }
        };

        void completeAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="rounded-2xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/70 px-6 py-4 backdrop-blur-xl">
                <p className="text-sm text-[var(--text-secondary)]">Completing sign-in...</p>
            </div>
        </div>
    );
};

export default TokenCallbackPage;
