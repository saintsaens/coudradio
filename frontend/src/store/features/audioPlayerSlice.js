import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const checkStream = createAsyncThunk(
  "audioPlayer/checkStream",
  async (src, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(src, { method: "HEAD" });
      if (!response.ok) {
        return rejectWithValue("Stream is unavailable");
      }
    } catch (error) {
      console.error("Error fetching the audio source:", error);
      return rejectWithValue("Network error");
    }
  }
);

const audioPlayerSlice = createSlice({
  name: "audioPlayer",
  initialState: {
    isMuted: true,
    playlistDuration: 25000,
    error: false,
    playing: false,
  },
  reducers: {
    setMuted(state, action) {
      state.isMuted = action.payload;
    },
    setPlaylistDuration(state, action) {
      state.playlistDuration = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setPlaying(state, action) {
      state.playing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkStream.rejected, (state, action) => {
        state.error = true;
      })
      .addCase(checkStream.fulfilled, (state) => {
        state.error = false;
      });
  },
});

export const { setMuted, setPlaylistDuration, setError, setPlaying } = audioPlayerSlice.actions;
export default audioPlayerSlice.reducer;
