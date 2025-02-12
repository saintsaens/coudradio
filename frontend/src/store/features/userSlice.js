import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
    const response = await fetch(`${baseUrl}/auth/user/profile`, { credentials: 'include' });
    if (response.ok) {
        const data = await response.json();
        return ({
            userId: data.id,
            username: data.username,
            sessionStartTime: data.sessionStartTime,
            lastActivity: data.lastActivity,
            timeSpent: data.timeSpent,
        });
    }
    throw new Error('Not logged in');
});

export const updateLastActivity = createAsyncThunk('user/updateLastActivity', async () => {
    const response = await fetch(`${baseUrl}/users/activity`, {
        method: 'PATCH',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to update last activity');
    }

    return await response.json();
});

export const updateSessionStartTime = createAsyncThunk('user/updateSessionStartTime', async () => {
    const response = await fetch(`${baseUrl}/users/close`, {
        method: 'PATCH',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to update session start time');
    }

    return await response.json();
});

const userSlice = createSlice({
    name: 'user',
    initialState: {
        userId: '',
        username: '',
        isSubscriber: false,
        sessionStartTime: '',
        lastActivity: '',
        timeSpent: 0,
        status: 'idle',
        error: null
    },
    reducers: {
        clearUser: (state) => {
            state.userId = '';
            state.username = '';
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.userId = action.payload.userId;
                state.username = action.payload.username;
                state.sessionStartTime = action.payload.sessionStartTime;
                state.lastActivity = action.payload.lastActivity;
                state.timeSpent = action.payload.timeSpent;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { clearUser } = userSlice.actions;

export default userSlice.reducer;
