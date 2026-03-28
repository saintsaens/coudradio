import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const fetchCurrentTrack = createAsyncThunk('currentTrack/fetchCurrentTrack', async (channel) => {
    const response = await fetch(`${baseUrl}/metadata/${channel}`);
    if (!response.ok) {
        throw new Error('Failed to fetch current track');
    }
    return await response.json();
});

const currentTrackSlice = createSlice({
    name: 'currentTrack',
    initialState: {
        name: null,
        artist: null,
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCurrentTrack.fulfilled, (state, action) => {
            state.name = action.payload.name;
            state.artist = action.payload.artist;
        });
    },
});

export default currentTrackSlice.reducer;
