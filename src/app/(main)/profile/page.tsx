"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatePresence, motion } from "motion/react";
import Modal from "@/components/Modal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteAccountThunk, hydrateAuth, logoutThunk } from "@/store/authSlice";
import { loadProfileAnalyticsThunk, type AnalyticsRange } from "@/store/profileSlice";

type ProfileTab = "account" | "insights" | "admin";

type AdminUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
    role: "user" | "admin";
};

const ProfilePage = () => {
    const FEEDBACK_CACHE_VERSION = "v2";
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<ProfileTab>("account");
    const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>("last7");
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [adminQuery, setAdminQuery] = useState<string>("");
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminLoading, setAdminLoading] = useState<boolean>(false);
    const [hasAdminAccess, setHasAdminAccess] = useState<boolean>(false);
    const [dailyFeedback, setDailyFeedback] = useState<string>("");
    const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);

    const auth = useAppSelector((state) => state.auth);
    const analyticsState = useAppSelector((state) => state.profile);
    const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const userNameForFeedback = useMemo(() => auth.profile?.firstName?.trim() || "there", [auth.profile?.firstName]);

    useEffect(() => {
        void dispatch(hydrateAuth());
    }, [dispatch]);

    useEffect(() => {
        void dispatch(loadProfileAnalyticsThunk(analyticsRange));
    }, [dispatch, analyticsRange]);

    useEffect(() => {
        const detectAdminAccess = async () => {
            if (!auth.session?.access_token) {
                setHasAdminAccess(false);
                return;
            }

            try {
                const response = await fetch("/api/admin/users?q=", {
                    headers: {
                        Authorization: `Bearer ${auth.session.access_token}`,
                    },
                });
                setHasAdminAccess(response.ok);
            } catch {
                setHasAdminAccess(false);
            }
        };

        void detectAdminAccess();
    }, [auth.session?.access_token]);

    useEffect(() => {
        if (!auth.checked || activeTab !== "insights" || analyticsState.status !== "succeeded") return;

        const cacheKey = `daily-feedback-${FEEDBACK_CACHE_VERSION}-${auth.profile?.id ?? "anonymous"}-${todayKey}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setDailyFeedback(cached);
            return;
        }

        const generateFeedback = async () => {
            setFeedbackLoading(true);
            try {
                const response = await fetch("/api/profile/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: userNameForFeedback,
                        stats: {
                            bookmarksCount: analyticsState.analytics.bookmarksCount,
                            notesCount: analyticsState.analytics.notesCount,
                            avgDonePerDay: analyticsState.analytics.avgDonePerDay,
                            recentSeries: analyticsState.analytics.dailyTaskDone,
                        },
                        activeGoals: [],
                    }),
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload?.error || "Failed to generate feedback.");
                }
                const text = String(payload.feedback || "").trim();
                if (text) {
                    setDailyFeedback(text);
                    localStorage.setItem(cacheKey, text);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "AI feedback failed.";
                setDailyFeedback(`AI feedback unavailable: ${message}`);
            } finally {
                setFeedbackLoading(false);
            }
        };

        void generateFeedback();
    }, [
        activeTab,
        analyticsState.analytics.avgDonePerDay,
        analyticsState.analytics.bookmarksCount,
        analyticsState.analytics.dailyTaskDone,
        analyticsState.analytics.notesCount,
        analyticsState.status,
        auth.checked,
        auth.profile?.id,
        todayKey,
        userNameForFeedback,
    ]);

    const fullName = useMemo(() => {
        const name = `${auth.profile?.firstName ?? ""} ${auth.profile?.lastName ?? ""}`.trim();
        return name || "User";
    }, [auth.profile?.firstName, auth.profile?.lastName]);

    const firstLetter = useMemo(() => {
        const source = auth.profile?.firstName?.trim() || auth.profile?.email?.trim() || "U";
        return source.charAt(0).toUpperCase();
    }, [auth.profile?.firstName, auth.profile?.email]);

    const handleLogout = async () => {
        const action = await dispatch(logoutThunk());
        if (logoutThunk.fulfilled.match(action)) {
            router.replace("/login");
        }
        setIsLogoutModalOpen(false);
    };

    const handleDeleteAccount = async () => {
        const action = await dispatch(deleteAccountThunk());
        if (deleteAccountThunk.fulfilled.match(action)) {
            router.replace("/signup");
        } else if (deleteAccountThunk.rejected.match(action)) {
            const message = (action.payload as string) || "Failed to delete account.";
            alert(message);
        }
        setIsDeleteModalOpen(false);
    };

    const tabs: { key: ProfileTab; label: string }[] = [
        { key: "account", label: "Account" },
        { key: "insights", label: "Insights" },
        ...((auth.profile?.role === "admin" || hasAdminAccess) ? [{ key: "admin" as const, label: "Admin" }] : []),
    ];

    useEffect(() => {
        const rawTab = searchParams.get("tab");
        if (!rawTab) return;

        if (rawTab === "account" || rawTab === "insights") {
            setActiveTab(rawTab);
            return;
        }

        if (rawTab === "admin" && (auth.profile?.role === "admin" || hasAdminAccess)) {
            setActiveTab("admin");
        }
    }, [searchParams, auth.profile?.role, hasAdminAccess]);

    const loadAdminUsers = useCallback(async (query = "") => {
        if (!auth.session?.access_token) return;
        setAdminLoading(true);
        try {
            const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
                headers: {
                    Authorization: `Bearer ${auth.session.access_token}`,
                },
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to load users.");
            }
            setAdminUsers(payload.users ?? []);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to load users.");
        } finally {
            setAdminLoading(false);
        }
    }, [auth.session?.access_token]);

    useEffect(() => {
        if (activeTab === "admin" && (auth.profile?.role === "admin" || hasAdminAccess)) {
            void loadAdminUsers(adminQuery);
        }
    }, [activeTab, auth.profile?.role, hasAdminAccess, adminQuery, loadAdminUsers]);

    const handleAdminSearch = async () => {
        await loadAdminUsers(adminQuery);
    };

    const handleMakeAdmin = async (userId: string, role: "admin" | "user") => {
        if (!auth.session?.access_token) return;
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.session.access_token}`,
            },
            body: JSON.stringify({ role }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            alert(payload?.error || "Failed to update role.");
            return;
        }
        await loadAdminUsers(adminQuery);
    };

    const handleAdminDelete = async (userId: string) => {
        if (!auth.session?.access_token) return;
        const confirmed = window.confirm("Delete this user account?");
        if (!confirmed) return;
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${auth.session.access_token}`,
            },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            alert(payload?.error || "Failed to delete user.");
            return;
        }
        await loadAdminUsers(adminQuery);
    };

    const profileSummary = (
        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/35 p-4">
            {!auth.checked ? (
                <>
                    <span className="h-16 w-16 rounded-full bg-[var(--fill-primary)]/80 animate-pulse" />
                    <div className="min-w-0 w-full space-y-2">
                        <span className="block h-5 w-40 rounded-full bg-[var(--fill-primary)]/80 animate-pulse" />
                        <span className="block h-4 w-56 rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                    </div>
                </>
            ) : (
                <>
                    {auth.profile?.avatarUrl ? (
                        <img
                            src={auth.profile.avatarUrl}
                            alt="Profile Avatar"
                            className="h-16 w-16 rounded-full object-cover border-2 border-[var(--accent-blue)]/65"
                        />
                    ) : (
                        <span className="h-16 w-16 rounded-full bg-[var(--accent-blue)]/18 border-2 border-[var(--accent-blue)]/65 flex items-center justify-center text-2xl font-bold text-[var(--accent-blue)] shrink-0">
                            {firstLetter}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="text-lg font-bold truncate">{fullName}</p>
                        <p className="text-sm text-[var(--text-secondary)] truncate">{auth.profile?.email || "No email found"}</p>
                    </div>
                </>
            )}
        </div>
    );

    const rangeOptions: { key: AnalyticsRange; label: string }[] = [
        { key: "last1", label: "Last Day" },
        { key: "last7", label: "Last 7 Days" },
        { key: "last30", label: "Last Month" },
    ];
    const isAnalyticsLoading = analyticsState.status === "loading";

    return (
        <div className="h-screen px-[6vw] py-[5vh] overflow-hidden">
            <div className="mx-auto max-w-5xl h-full flex flex-col">
                <div className="sticky top-4 z-20">
                    <div className="w-full p-1 rounded-full border-2 border-[var(--fill-primary)] bg-[var(--bg-control)]/90 backdrop-blur-md shadow-lg flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={clsx(
                                    "flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer text-center",
                                    activeTab === tab.key
                                        ? "bg-[var(--accent-blue)] text-[var(--text-selected)]"
                                        : "hover:bg-[var(--fill-primary)]"
                                )}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex-1 min-h-0 rounded-3xl border border-[var(--fill-primary)] bg-[var(--bg-control)]/70 backdrop-blur-xl overflow-hidden">
                    <div className="h-full overflow-y-auto p-6 md:p-8 [scrollbar-gutter:stable]">
                    {activeTab === "insights" && (
                        <>
                            <h2 className="text-3xl font-extrabold">Insights</h2>
                            <p className="mt-2 text-[var(--text-secondary)]">Your daily feedback and productivity snapshot.</p>

                            <div className="mt-5 rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/25 p-4">
                                <p className="text-sm text-[var(--text-secondary)]">AI Feedback for Today</p>
                                <AnimatePresence mode="wait">
                                    {feedbackLoading ? (
                                        <motion.div
                                            key="feedback-loading"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="mt-3 space-y-2"
                                        >
                                            <span className="block h-3 w-full rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                            <span className="block h-3 w-[92%] rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                            <span className="block h-3 w-[78%] rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            key={dailyFeedback || "feedback-ready"}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.35, ease: "easeOut" }}
                                            className="mt-3 text-sm leading-6 text-[var(--text-primary)]"
                                        >
                                            {dailyFeedback || "Feedback will appear here as soon as your data is ready."}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-4 flex gap-2 flex-wrap">
                                {rangeOptions.map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setAnalyticsRange(option.key)}
                                        className={clsx(
                                            "px-3 py-2 rounded-full border-2 text-sm font-semibold cursor-pointer transition-colors",
                                            analyticsRange === option.key
                                                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/20"
                                                : "border-[var(--fill-primary)] hover:bg-[var(--fill-primary)]"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/30 p-4">
                                        {isAnalyticsLoading ? (
                                            <>
                                                <span className="block h-4 w-24 rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                                <span className="mt-3 block h-8 w-16 rounded-full bg-[var(--fill-primary)]/80 animate-pulse" />
                                            </>
                                        ) : item === 1 ? (
                                            <>
                                                <p className="text-sm text-[var(--text-secondary)]">Bookmarks</p>
                                                <p className="text-3xl font-extrabold mt-1">{analyticsState.analytics.bookmarksCount}</p>
                                            </>
                                        ) : item === 2 ? (
                                            <>
                                                <p className="text-sm text-[var(--text-secondary)]">Notes</p>
                                                <p className="text-3xl font-extrabold mt-1">{analyticsState.analytics.notesCount}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-[var(--text-secondary)]">Avg Tasks Done / Day</p>
                                                <p className="text-3xl font-extrabold mt-1">{analyticsState.analytics.avgDonePerDay}</p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/20 p-4 h-[320px]">
                                <p className="text-sm text-[var(--text-secondary)] mb-2">Tasks done by day</p>
                                {isAnalyticsLoading ? (
                                    <div className="h-[260px] rounded-xl bg-[var(--fill-primary)]/30 animate-pulse" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsState.analytics.dailyTaskDone}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--fill-primary)" />
                                            <XAxis dataKey="day" stroke="var(--text-secondary)" />
                                            <YAxis allowDecimals={false} stroke="var(--text-secondary)" />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    border: "1px solid var(--fill-primary)",
                                                    background: "var(--bg-control)",
                                                }}
                                            />
                                            <Bar dataKey="done" fill="var(--accent-blue)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "account" && (
                        <>
                            <h2 className="text-3xl font-extrabold">Account Settings</h2>
                            <p className="mt-2 text-[var(--text-secondary)]">Manage your account access and safety options.</p>

                            {profileSummary}

                            <div className="mt-6 flex flex-col gap-3 max-w-md">
                                <button
                                    type="button"
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="cursor-pointer rounded-full border border-[var(--fill-primary)] px-5 py-3 font-semibold hover:bg-[var(--fill-primary)] transition-colors"
                                >
                                    Logout
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="cursor-pointer rounded-full border border-[var(--accent-red)] text-[var(--accent-red)] px-5 py-3 font-semibold hover:bg-[var(--accent-red)]/12 transition-colors"
                                >
                                    Delete Account
                                </button>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Delete account removes your account in this app. It does not delete your Google account.
                                </p>
                            </div>
                        </>
                    )}

                    {activeTab === "admin" && (auth.profile?.role === "admin" || hasAdminAccess) && (
                        <>
                            <h2 className="text-3xl font-extrabold">Admin Panel</h2>
                            <p className="mt-2 text-[var(--text-secondary)]">
                                Search users, grant admin access, and delete accounts.
                            </p>

                            <div className="mt-4 flex gap-2">
                                <input
                                    type="text"
                                    value={adminQuery}
                                    onChange={(e) => setAdminQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            void handleAdminSearch();
                                        }
                                    }}
                                    placeholder="Search by name or email"
                                    className="flex-1 rounded-full border border-[var(--fill-primary)] px-4 py-2 bg-[var(--bg-control)] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAdminSearch}
                                    className="rounded-full border border-[var(--fill-primary)] px-4 py-2 font-semibold cursor-pointer hover:bg-[var(--fill-primary)]"
                                >
                                    Search
                                </button>
                            </div>

                            <div className="mt-5 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {adminLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <div
                                            key={`admin-skeleton-${index}`}
                                            className="rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/20 p-3 flex items-center gap-3"
                                        >
                                            <span className="h-10 w-10 rounded-full bg-[var(--fill-primary)]/70 animate-pulse shrink-0" />
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <span className="block h-4 w-32 rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                                <span className="block h-3 w-48 rounded-full bg-[var(--fill-primary)]/60 animate-pulse" />
                                                <span className="block h-3 w-20 rounded-full bg-[var(--fill-primary)]/60 animate-pulse" />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="h-8 w-24 rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                                <span className="h-8 w-16 rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                                            </div>
                                        </div>
                                    ))
                                ) : adminUsers.length === 0 ? (
                                    <p className="text-sm text-[var(--text-secondary)]">No users found.</p>
                                ) : (
                                    adminUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="rounded-2xl border border-[var(--fill-primary)] bg-[var(--fill-primary)]/20 p-3 flex items-center gap-3"
                                        >
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.email} className="h-10 w-10 rounded-full object-cover" />
                                            ) : (
                                                <span className="h-10 w-10 rounded-full bg-[var(--accent-blue)]/18 border border-[var(--accent-blue)]/30 flex items-center justify-center font-bold">
                                                    {(user.firstName || user.email || "U").charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold truncate">{`${user.firstName} ${user.lastName}`.trim() || "User"}</p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                                                <p className="text-xs mt-1">
                                                    Role: <span className="font-semibold">{user.role}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMakeAdmin(user.id, user.role === "admin" ? "user" : "admin")}
                                                    className="rounded-full border border-[var(--fill-primary)] px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-[var(--fill-primary)]"
                                                >
                                                    {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdminDelete(user.id)}
                                                    className="rounded-full border border-[var(--accent-red)] text-[var(--accent-red)] px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-[var(--accent-red)]/10"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
                <h3 className="text-2xl font-bold">Confirm Logout</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Are you sure you want to logout?</p>
                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setIsLogoutModalOpen(false)}
                        className="flex-1 rounded-full border border-[var(--fill-primary)] px-4 py-2 font-semibold cursor-pointer hover:bg-[var(--fill-primary)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex-1 rounded-full bg-[var(--accent-blue)] text-white px-4 py-2 font-semibold cursor-pointer hover:brightness-110"
                    >
                        Logout
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <h3 className="text-2xl font-bold text-[var(--accent-red)]">Delete Account</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">This action is permanent. Are you sure?</p>
                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 rounded-full border border-[var(--fill-primary)] px-4 py-2 font-semibold cursor-pointer hover:bg-[var(--fill-primary)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="flex-1 rounded-full bg-[var(--accent-red)] text-white px-4 py-2 font-semibold cursor-pointer hover:brightness-110"
                    >
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;
