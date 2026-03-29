import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { parseISODuration } from "../../utils/time.js";

export const checkStream = createAsyncThunk(
  "audioPlayer/checkStream",
  async (src, { rejectWithValue }) => {
    try {
      const cacheKey = `mpd_duration:${src}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const response = await fetch(src, { method: "HEAD" });
        if (!response.ok) return rejectWithValue("Stream is unavailable");
        return parseFloat(cached);
      }

      const response = await fetch(src);
      if (!response.ok) return rejectWithValue("Stream is unavailable");
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, "application/xml");
      const iso = doc.querySelector("MPD")?.getAttribute("mediaPresentationDuration");
      const duration = iso ? parseISODuration(iso) : null;
      if (!duration) return rejectWithValue("Could not parse MPD duration");
      sessionStorage.setItem(cacheKey, duration.toString());
      return duration;
    } catch (error) {
      console.error("Error fetching stream:", error);
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
    loadingProgress: 0,
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
    setLoadingProgress(state, action) {
      state.loadingProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkStream.pending, (state) => {
        state.loadingProgress = 0;
      })
      .addCase(checkStream.rejected, (state, _action) => {
        state.error = true;
      })
      .addCase(checkStream.fulfilled, (state) => {
        state.error = false;
        state.loadingProgress = 50;
      });
  },
});

export const { setMuted, setPlaylistDuration, setError, setPlaying, setLoadingProgress } = audioPlayerSlice.actions;
export default audioPlayerSlice.reducer;
