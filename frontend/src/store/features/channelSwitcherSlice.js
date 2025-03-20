import { createSlice } from "@reduxjs/toolkit";

const channelSwitcherSlice = createSlice({
    name: "channelSwitcher",
    initialState: {
        currentChannel: `lofi`,
        selectedIndex: 0,
        isSwitcherOpen: false,
    },
    reducers: {
        setCurrentChannel(state, action) {
            state.currentChannel = action.payload;
        },
        setSelectedIndex(state, action) {
            state.selectedIndex = action.payload;
        },
        closeSwitcher(state) {
            state.isSwitcherOpen = false;
        },
        toggleSwitcher(state) {
            state.isSwitcherOpen = !state.isSwitcherOpen;
        },
    },
});

export const { setCurrentChannel, setSelectedIndex, closeSwitcher, toggleSwitcher } = channelSwitcherSlice.actions;

export default channelSwitcherSlice.reducer;
