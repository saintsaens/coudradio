import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const fetchListeners = createAsyncThunk('listeners/fetchListeners', async () => {
    const response = await fetch(`${baseUrl}/users/listeners`);
    if (!response.ok) {
        throw new Error('Failed to fetch listener counts');
    }
    return await response.json();
});

const listenersSlice = createSlice({
    name: 'listeners',
    initialState: {
        authenticated: 0,
        anonymous: 0,
    },
    extraReducers: (builder) => {
        builder.addCase(fetchListeners.fulfilled, (state, action) => {
            state.authenticated = action.payload.authenticated;
            state.anonymous = action.payload.anonymous;
        });
    },
});

export default listenersSlice.reducer;
