"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";
import {
    continueWithGoogle,
    deleteCurrentUserAccount,
    getCurrentSession,
    getCurrentUserProfile,
    loginWithEmail,
    logoutUser,
    signUpWithEmail,
    type CurrentUserProfile,
    type LoginPayload,
    type SignUpPayload,
} from "@/lib/auth/supabaseAuth";

type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

type AuthState = {
    status: AuthStatus;
    session: Session | null;
    profile: CurrentUserProfile | null;
    checked: boolean;
    error: string | null;
};

const initialState: AuthState = {
    status: "idle",
    session: null,
    profile: null,
    checked: false,
    error: null,
};

export const hydrateAuth = createAsyncThunk(
    "auth/hydrate",
    async (_, { rejectWithValue }) => {
        try {
            const session = await getCurrentSession();
            if (!session) {
                return { session: null, profile: null };
            }
            const profile = await getCurrentUserProfile();
            return { session, profile };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to load session");
        }
    }
);

export const loginThunk = createAsyncThunk(
    "auth/login",
    async (payload: LoginPayload, { rejectWithValue }) => {
        try {
            const result = await loginWithEmail(payload);
            const profile = await getCurrentUserProfile();
            return { session: result.session ?? null, profile };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Login failed");
        }
    }
);

export const signUpThunk = createAsyncThunk(
    "auth/signup",
    async (payload: SignUpPayload, { rejectWithValue }) => {
        try {
            const data = await signUpWithEmail(payload);
            const profile = data.session ? await getCurrentUserProfile() : null;
            return {
                session: data.session ?? null,
                profile,
                requiresEmailVerification: !data.session,
            };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Signup failed");
        }
    }
);

export const googleSignInThunk = createAsyncThunk(
    "auth/google",
    async (_, { rejectWithValue }) => {
        try {
            await continueWithGoogle();
            return true;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Google auth failed");
        }
    }
);

export const logoutThunk = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await logoutUser();
            return true;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Logout failed");
        }
    }
);

export const deleteAccountThunk = createAsyncThunk(
    "auth/deleteAccount",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { auth: AuthState };
            await deleteCurrentUserAccount(state.auth.session);
            await logoutUser();
            return true;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Delete account failed");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(hydrateAuth.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(hydrateAuth.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.session = action.payload.session;
                state.profile = action.payload.profile;
                state.checked = true;
            })
            .addCase(hydrateAuth.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to load session";
                state.checked = true;
            })
            .addCase(loginThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.session = action.payload.session;
                state.profile = action.payload.profile;
                state.checked = true;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Login failed";
            })
            .addCase(signUpThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(signUpThunk.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.session = action.payload.session;
                state.profile = action.payload.profile;
                state.checked = true;
            })
            .addCase(signUpThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Signup failed";
            })
            .addCase(googleSignInThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(googleSignInThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Google auth failed";
            })
            .addCase(logoutThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                state.status = "succeeded";
                state.session = null;
                state.profile = null;
                state.checked = true;
            })
            .addCase(logoutThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Logout failed";
            })
            .addCase(deleteAccountThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(deleteAccountThunk.fulfilled, (state) => {
                state.status = "succeeded";
                state.session = null;
                state.profile = null;
                state.checked = true;
            })
            .addCase(deleteAccountThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Delete account failed";
            });
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
