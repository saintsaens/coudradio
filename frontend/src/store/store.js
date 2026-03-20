import { configureStore } from '@reduxjs/toolkit';
import audioPlayerReducer from "./features/audioPlayerSlice";
import channelSwitcherReducer from "./features/channelSwitcherSlice"
import userSliceReducer from "./features/userSlice"
import listenersReducer from "./features/listenersSlice"

const store = configureStore({
  reducer: {
    audioPlayer: audioPlayerReducer,
    channelSwitcher: channelSwitcherReducer,
    user: userSliceReducer,
    listeners: listenersReducer,
  },
});

export default store;
