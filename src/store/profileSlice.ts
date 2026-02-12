"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchBookmarksForCurrentUser, fetchNotesForCurrentUser, fetchTodosForCurrentUser } from "@/lib/supabase/userData";

type DailyTaskPoint = {
    day: string;
    done: number;
};

export type AnalyticsRange = "last1" | "last7" | "last30";

type ProfileAnalytics = {
    bookmarksCount: number;
    notesCount: number;
    avgDonePerDay: number;
    dailyTaskDone: DailyTaskPoint[];
};

type ProfileState = {
    status: "idle" | "loading" | "succeeded" | "failed";
    analytics: ProfileAnalytics;
    error: string | null;
};

const initialState: ProfileState = {
    status: "idle",
    analytics: {
        bookmarksCount: 0,
        notesCount: 0,
        avgDonePerDay: 0,
        dailyTaskDone: [],
    },
    error: null,
};

type TodoTask = {
    completed?: boolean;
    date?: string;
    completedAt?: string;
};

const shortDayLabel = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatDayKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toDayKey = (value: string): string | null => {
    if (!value) return null;
    if (DATE_ONLY_REGEX.test(value)) return value;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatDayKey(parsed);
};

const dateFromDayKey = (dayKey: string) => {
    const [year, month, day] = dayKey.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

export const loadProfileAnalyticsThunk = createAsyncThunk(
    "profile/loadAnalytics",
    async (range: AnalyticsRange = "last7", { rejectWithValue }) => {
        try {
            const bookmarks = await fetchBookmarksForCurrentUser();
            const notes = await fetchNotesForCurrentUser();
            const remoteTodos = await fetchTodosForCurrentUser();
            const todos: TodoTask[] = remoteTodos.map((row) => ({
                completed: row.completed,
                date: row.due_date || undefined,
                completedAt: row.completed_at || undefined,
            }));

            const completedDayKeys = todos
                .filter((task) => Boolean(task.completed))
                .map((task) => {
                    const source = task.completedAt || task.date;
                    return source ? toDayKey(source) : null;
                })
                .filter((value): value is string => value !== null);

            const grouped = new Map<string, number>();
            for (const dayKey of completedDayKeys) {
                grouped.set(dayKey, (grouped.get(dayKey) ?? 0) + 1);
            }

            const daysCount = range === "last1" ? 1 : range === "last30" ? 30 : 7;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const start = new Date(today);
            start.setDate(today.getDate() - (daysCount - 1));

            const inRangeKeys: string[] = [];
            for (let i = 0; i < daysCount; i += 1) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                inRangeKeys.push(formatDayKey(d));
            }

            if (grouped.size === 0) {
                const fallback = inRangeKeys.map((key) => ({
                    day: shortDayLabel(dateFromDayKey(key)),
                    done: 0,
                }));
                return {
                    bookmarksCount: bookmarks.length,
                    notesCount: notes.length,
                    avgDonePerDay: 0,
                    dailyTaskDone: fallback,
                };
            }

            const rangedSeries = inRangeKeys.map((dayKey) => {
                const date = dateFromDayKey(dayKey);
                return {
                    day: shortDayLabel(date),
                    done: grouped.get(dayKey) ?? 0,
                };
            });

            const totalDone = rangedSeries.reduce((acc, point) => acc + point.done, 0);
            const avgDonePerDay = Number((totalDone / daysCount).toFixed(2));

            return {
                bookmarksCount: bookmarks.length,
                notesCount: notes.length,
                avgDonePerDay,
                dailyTaskDone: rangedSeries,
            };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to load analytics");
        }
    }
);

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadProfileAnalyticsThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(loadProfileAnalyticsThunk.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.analytics = action.payload;
            })
            .addCase(loadProfileAnalyticsThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to load analytics";
            });
    },
});

export default profileSlice.reducer;
