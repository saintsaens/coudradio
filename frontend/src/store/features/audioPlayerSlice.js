import { createSlice } from "@reduxjs/toolkit";

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
      // The player is torn down on error, so a retry starts from the loading screen
      if (action.payload) state.playing = false;
    },
    setPlaying(state, action) {
      state.playing = action.payload;
    },
    setLoadingProgress(state, action) {
      state.loadingProgress = action.payload;
    },
  },
});

export const { setMuted, setPlaylistDuration, setError, setPlaying, setLoadingProgress } = audioPlayerSlice.actions;
export default audioPlayerSlice.reducer;
