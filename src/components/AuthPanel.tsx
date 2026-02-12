"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import {
    type LoginPayload,
    type SignUpPayload,
} from "@/lib/auth/supabaseAuth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthError, googleSignInThunk, hydrateAuth, loginThunk, signUpThunk } from "@/store/authSlice";

type AuthPanelProps = {
    mode: "login" | "signup";
};

const AuthPanel: React.FC<AuthPanelProps> = ({ mode }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { session, checked, status, error } = useAppSelector((state) => state.auth);
    const loading = status === "loading";
    const [message, setMessage] = useState("");
    const [awaitingVerification, setAwaitingVerification] = useState(false);

    const [loginForm, setLoginForm] = useState<LoginPayload>({
        email: "",
        password: "",
    });

    const [signUpForm, setSignUpForm] = useState<SignUpPayload>({
        name: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const title = useMemo(() => (mode === "login" ? "Welcome Back" : "Create Your Account"), [mode]);

    const subtitle = useMemo(
        () => (mode === "login" ? "Sign in to continue your productive flow." : "Set up your account to start using Productive Hub."),
        [mode]
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            const currentUrl = new URL(window.location.href);
            const hasOAuthParams =
                currentUrl.searchParams.has("code") ||
                currentUrl.searchParams.has("access_token") ||
                currentUrl.searchParams.has("refresh_token") ||
                currentUrl.searchParams.has("token_type") ||
                currentUrl.searchParams.has("expires_in");
            const hasHashTokens =
                window.location.hash.includes("access_token") ||
                window.location.hash.includes("refresh_token");

            if (hasOAuthParams || hasHashTokens) {
                window.history.replaceState({}, document.title, currentUrl.pathname);
            }
        }

        const checkSession = async () => {
            await dispatch(hydrateAuth());
        };
        void checkSession();
    }, [router, dispatch]);

    useEffect(() => {
        if (checked && session) {
            router.replace("/bookmarks");
        }
    }, [checked, session, router]);

    useEffect(() => {
        if (error) {
            setMessage(error);
        }
    }, [error]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        dispatch(clearAuthError());
        const action = await dispatch(loginThunk(loginForm));
        if (loginThunk.rejected.match(action)) {
            setMessage((action.payload as string) || "Login failed.");
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setAwaitingVerification(false);
        dispatch(clearAuthError());
        const action = await dispatch(signUpThunk(signUpForm));
        if (signUpThunk.rejected.match(action)) {
            setMessage((action.payload as string) || "Signup failed.");
            return;
        }
        if (signUpThunk.fulfilled.match(action) && action.payload.requiresEmailVerification) {
            setMessage("Account created. Please verify your email, then login.");
            setAwaitingVerification(true);
        }
    };

    const handleGoogle = async () => {
        setMessage("");
        dispatch(clearAuthError());
        const action = await dispatch(googleSignInThunk());
        if (googleSignInThunk.rejected.match(action)) {
            setMessage((action.payload as string) || "Google auth failed.");
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1000px_500px_at_15%_-10%,rgba(0,122,255,0.24),transparent_55%),radial-gradient(900px_500px_at_85%_110%,rgba(16,185,129,0.18),transparent_55%),var(--bg-primary)] px-4 py-8 text-[var(--text-primary)] md:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mx-auto mb-4 w-full max-w-xl">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)]/72 px-4 py-2 text-sm font-semibold transition hover:bg-[var(--fill-primary)]"
                    >
                        <FiArrowLeft />
                        Back to Main Page
                    </Link>
                </div>
                <div className="mx-auto flex w-full max-w-xl items-center justify-between rounded-full border border-[var(--fill-primary)]/70 bg-[var(--bg-control)]/72 p-1.5 backdrop-blur-xl">
                    <Link
                        href="/login"
                        className={`w-1/2 rounded-full px-4 py-2 text-center text-sm font-semibold transition ${mode === "login" ? "bg-[var(--accent-blue)] text-white" : "hover:bg-[var(--fill-primary)]"}`}
                    >
                        Login
                    </Link>
                    <Link
                        href="/signup"
                        className={`w-1/2 rounded-full px-4 py-2 text-center text-sm font-semibold transition ${mode === "signup" ? "bg-[var(--accent-blue)] text-white" : "hover:bg-[var(--fill-primary)]"}`}
                    >
                        Sign Up
                    </Link>
                </div>

                <div className="mx-auto mt-8 w-full max-w-xl rounded-3xl border border-[var(--fill-primary)]/60 bg-[var(--bg-control)]/70 p-6 shadow-[0_16px_45px_rgba(0,0,0,0.12)] backdrop-blur-2xl md:p-8">
                    <h1 className="text-center text-3xl font-extrabold">{title}</h1>
                    <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">{subtitle}</p>

                    <button
                        type="button"
                        onClick={handleGoogle}
                        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[var(--fill-primary)] px-4 py-3 font-semibold transition hover:bg-[var(--fill-primary)]"
                        disabled={loading}
                    >
                        <FcGoogle className="text-lg" />
                        Continue with Google
                    </button>

                    <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                        <div className="h-px flex-1 bg-[var(--fill-primary)]" />
                        or use email
                        <div className="h-px flex-1 bg-[var(--fill-primary)]" />
                    </div>

                    {mode === "signup" && awaitingVerification ? (
                        <div className="rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/30 p-4 text-center">
                            <p className="font-semibold">Verify your email</p>
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                We sent a verification link to your email. Open it, then come back and login.
                            </p>
                            <button
                                type="button"
                                onClick={() => setAwaitingVerification(false)}
                                className="mt-4 rounded-full border border-[var(--fill-primary)] px-4 py-2 text-sm font-semibold hover:bg-[var(--fill-primary)] cursor-pointer"
                            >
                                Back to Sign Up Form
                            </button>
                        </div>
                    ) : mode === "login" ? (
                        <form className="space-y-3" onSubmit={handleLogin}>
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="Email"
                                className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                required
                            />
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="Password"
                                className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full rounded-full bg-[var(--accent-blue)] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                            >
                                {loading ? "Please wait..." : "Login"}
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-3" onSubmit={handleSignUp}>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <input
                                    type="text"
                                    value={signUpForm.name}
                                    onChange={(e) => setSignUpForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="First Name"
                                    className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                    required
                                />
                                <input
                                    type="text"
                                    value={signUpForm.lastName}
                                    onChange={(e) => setSignUpForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="Last Name"
                                    className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                    required
                                />
                            </div>
                            <input
                                type="email"
                                value={signUpForm.email}
                                onChange={(e) => setSignUpForm((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="Email"
                                className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                required
                            />
                            <input
                                type="password"
                                value={signUpForm.password}
                                onChange={(e) => setSignUpForm((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="Password"
                                className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                required
                            />
                            <input
                                type="password"
                                value={signUpForm.confirmPassword}
                                onChange={(e) => setSignUpForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Confirm Password"
                                className="w-full rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)] px-4 py-3 outline-none focus:border-[var(--accent-blue)]"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full rounded-full bg-[var(--accent-blue)] px-4 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                            >
                                {loading ? "Please wait..." : "Create Account"}
                            </button>
                        </form>
                    )}

                    <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                        {mode === "login" ? (
                            <>
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-[var(--accent-blue)] font-semibold hover:underline">
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <Link href="/login" className="text-[var(--accent-blue)] font-semibold hover:underline">
                                    Login
                                </Link>
                            </>
                        )}
                    </div>

                    {message && (
                        <p className="mt-4 rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/40 px-4 py-2 text-sm text-[var(--text-secondary)]">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPanel;
