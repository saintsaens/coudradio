import { configureStore } from '@reduxjs/toolkit';
import audioPlayerReducer from "./features/audioPlayerSlice";
import channelSwitcherReducer from "./features/channelSwitcherSlice"
import userSliceReducer from "./features/userSlice"

const store = configureStore({
  reducer: {
    audioPlayer: audioPlayerReducer,
    channelSwitcher: channelSwitcherReducer,
    user: userSliceReducer,
  },
});

export default store;
