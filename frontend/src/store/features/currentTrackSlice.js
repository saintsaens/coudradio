import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setCurrentChannel } from './channelSwitcherSlice';

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
        track: null,
        nextTrackIn: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchCurrentTrack.fulfilled, (state, action) => {
            state.track = action.payload.track;
            state.nextTrackIn = action.payload.nextTrackIn;
        });
        builder.addCase(setCurrentChannel, (state) => {
            state.track = null;
            state.nextTrackIn = null;
        });
    },
});

export default currentTrackSlice.reducer;
