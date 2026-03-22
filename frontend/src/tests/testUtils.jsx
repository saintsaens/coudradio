import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import audioPlayerReducer from '../store/features/audioPlayerSlice';
import channelSwitcherReducer from '../store/features/channelSwitcherSlice';
import userReducer from '../store/features/userSlice';
import listenersReducer from '../store/features/listenersSlice';

export const renderWithStore = (ui, { preloadedState = {} } = {}) => {
    const store = configureStore({
        reducer: {
            audioPlayer: audioPlayerReducer,
            channelSwitcher: channelSwitcherReducer,
            user: userReducer,
            listeners: listenersReducer,
        },
        preloadedState,
    });
    return { ...render(<Provider store={store}>{ui}</Provider>), store };
};
