import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
    const response = await fetch(`${baseUrl}/auth/user/profile`, {
        credentials: 'include'
    });

    if (response.ok) {
        const data = await response.json();
        return ({
            userId: data.id,
            username: data.username,
            role: data.role,
            sessionStartTime: data.sessionStartTime,
            lastActivity: data.lastActivity,
            timeSpent: data.timeSpent,
            isSubscriber: data.subscribed,
            email: data.email
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
        role: "user",
        sessionStartTime: '',
        lastActivity: '',
        timeSpent: 0,
        isSubscriber: false,
        email: '',
        channelList: [],
        status: 'idle',
        error: null
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
                state.role = action.payload.role;
                state.sessionStartTime = action.payload.sessionStartTime;
                state.lastActivity = action.payload.lastActivity;
                state.timeSpent = action.payload.timeSpent;
                state.isSubscriber = action.payload.isSubscriber;
                state.email = action.payload.email;

                // Derive channelList directly from username
                const raw = state.username
                    ? import.meta.env.VITE_CHANNELS_LOGGEDIN
                    : import.meta.env.VITE_CHANNELS_DEFAULT || '';
                state.channelList = raw.split(',');
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;

                // Fallback channelList when fetch fails
                const raw = import.meta.env.VITE_CHANNELS_DEFAULT || '';
                state.channelList = raw.split(',');
            });
    },
});

export default userSlice.reducer;
