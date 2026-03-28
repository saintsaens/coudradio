import { configureStore } from '@reduxjs/toolkit';
import audioPlayerReducer from "./features/audioPlayerSlice";
import channelSwitcherReducer from "./features/channelSwitcherSlice"
import userSliceReducer from "./features/userSlice"
import listenersReducer from "./features/listenersSlice"
import currentTrackReducer from "./features/currentTrackSlice"

const store = configureStore({
  reducer: {
    audioPlayer: audioPlayerReducer,
    channelSwitcher: channelSwitcherReducer,
    user: userSliceReducer,
    listeners: listenersReducer,
    currentTrack: currentTrackReducer,
  },
});

export default store;
