"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaRobot } from "react-icons/fa";
import { FiBookOpen, FiCheckCircle, FiList, FiShield, FiZap } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateAuth } from "@/store/authSlice";

const LandingPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { session, checked } = useAppSelector((state) => state.auth);

    useEffect(() => {
        void dispatch(hydrateAuth());
    }, [dispatch]);

    useEffect(() => {
        if (checked && session) {
            router.replace("/bookmarks");
        }
    }, [checked, session, router]);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(0,122,255,0.28),transparent_60%),radial-gradient(1000px_600px_at_80%_110%,rgba(16,185,129,0.20),transparent_60%),var(--bg-primary)] text-[var(--text-primary)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-[var(--accent-blue)]/20 blur-3xl" />
                <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-[var(--accent-green)]/20 blur-3xl" />
            </div>

            <header className="fixed inset-x-0 top-4 z-30">
                <div className="mx-auto flex w-[92%] max-w-6xl items-center justify-between rounded-full border border-[var(--fill-primary)]/75 bg-[var(--bg-control)]/72 px-4 py-3 shadow-[0_10px_32px_rgba(0,0,0,0.14)] backdrop-blur-2xl md:px-6">
                    <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">Productive Hub</h2>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/signup"
                            className="rounded-full border border-[var(--fill-primary)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--fill-primary)]"
                        >
                            Start Now
                        </Link>
                        <Link
                            href="/login"
                            className="cursor-pointer rounded-full bg-[var(--accent-blue)] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,122,255,0.3)] transition hover:brightness-110"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </header>

            <section className="relative mx-auto flex w-[92%] max-w-6xl flex-col items-center px-4 pb-14 pt-32 md:pt-36">
                <span className="rounded-full border border-[var(--fill-primary)] bg-[var(--bg-control)]/70 px-4 py-2 text-sm backdrop-blur-xl">Productive Hub</span>

                <h1 className="mt-6 max-w-4xl text-center text-4xl font-extrabold leading-tight md:text-6xl">
                    Plan Better.
                    <span className="bg-gradient-to-r from-[var(--accent-blue)] to-cyan-300 bg-clip-text text-transparent"> Execute Faster.</span>
                </h1>

                <p className="mt-5 max-w-2xl text-center text-base text-[var(--text-secondary)] md:text-lg">
                    Save bookmarks, manage tasks and notes, and use AI assistance in one clean workspace built for daily flow.
                </p>

                <div className="mt-8 flex w-full max-w-md items-center justify-center gap-3">
                    <Link
                        href="/signup"
                        className="w-full rounded-full bg-[var(--accent-blue)] px-6 py-3 text-center text-base font-bold text-white shadow-[0_10px_30px_rgba(0,122,255,0.35)] transition hover:brightness-110"
                    >
                        Start Now
                    </Link>
                </div>
            </section>

            <section className="relative mx-auto w-[92%] max-w-6xl px-4 pb-14">
                <div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/65 p-5 backdrop-blur-xl">
                        <div className="mb-3 inline-flex rounded-xl bg-[var(--fill-primary)] p-2 text-[var(--accent-blue)]">
                            <FiBookOpen className="text-xl" />
                        </div>
                        <h3 className="text-xl font-bold">Smart Bookmarks</h3>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">Organize links with clean cards, quick edits, and lightweight controls.</p>
                    </div>

                    <div className="rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/65 p-5 backdrop-blur-xl">
                        <div className="mb-3 inline-flex rounded-xl bg-[var(--fill-primary)] p-2 text-[var(--accent-green)]">
                            <FiList className="text-xl" />
                        </div>
                        <h3 className="text-xl font-bold">Tasks & Notes</h3>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">Track priorities, labels, and dates with a focused interface.</p>
                    </div>

                    <div className="rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/65 p-5 backdrop-blur-xl">
                        <div className="mb-3 inline-flex rounded-xl bg-[var(--fill-primary)] p-2 text-cyan-300">
                            <FaRobot className="text-xl" />
                        </div>
                        <h3 className="text-xl font-bold">AI Assistant</h3>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">Chat, take action, and manage your workspace faster.</p>
                    </div>
                </div>
            </section>

            <section className="relative mx-auto w-[92%] max-w-6xl px-4 pb-14">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/65 p-6 backdrop-blur-xl">
                        <h3 className="text-2xl font-bold">Why teams use it daily</h3>
                        <ul className="mt-5 space-y-3 text-[var(--text-secondary)]">
                            <li className="flex items-center gap-2"><FiCheckCircle className="text-[var(--accent-green)]" /> Fast task capture and clear priorities</li>
                            <li className="flex items-center gap-2"><FiCheckCircle className="text-[var(--accent-green)]" /> Notes connected to your real workflow</li>
                            <li className="flex items-center gap-2"><FiCheckCircle className="text-[var(--accent-green)]" /> AI actions where you already work</li>
                        </ul>
                    </div>
                    <div className="rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/65 p-6 backdrop-blur-xl">
                        <h3 className="text-2xl font-bold">Built for reliability</h3>
                        <div className="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
                            <p className="flex items-center gap-2"><FiShield className="text-[var(--accent-blue)]" /> Predictable UX with undo support</p>
                            <p className="flex items-center gap-2"><FiZap className="text-[var(--accent-blue)]" /> Lightweight interactions with smooth performance</p>
                            <p className="flex items-center gap-2"><FiBookOpen className="text-[var(--accent-blue)]" /> One hub for links, notes, and planning</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative mx-auto w-[92%] max-w-6xl px-4 pb-24">
                <div className="rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/65 p-8 text-center backdrop-blur-xl">
                    <h3 className="text-3xl font-extrabold">Ready to start?</h3>
                    <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
                        Open your workspace and start organizing your tasks, notes, bookmarks, and AI workflows.
                    </p>
                    <div className="mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-3">
                        <Link
                            href="/signup"
                            className="w-full rounded-full bg-[var(--accent-blue)] px-6 py-3 text-center text-base font-bold text-white shadow-[0_10px_30px_rgba(0,122,255,0.35)] transition hover:brightness-110"
                        >
                            Start Now
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="border-t border-[var(--fill-primary)]/60 bg-[var(--bg-control)]/50 py-5 backdrop-blur-xl">
                <div className="mx-auto flex w-[92%] max-w-6xl items-center justify-between text-xs text-[var(--text-secondary)]">
                    <p>© {new Date().getFullYear()} Productive Hub</p>
                    <p>Built for focused daily workflows.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
