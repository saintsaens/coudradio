import { describe, it, expect } from 'vitest';
import reducer, {
    setCurrentChannel,
    setSelectedIndex,
    closeSwitcher,
    toggleSwitcher,
} from '../../store/features/channelSwitcherSlice.js';

const initialState = { currentChannel: 'lofi', selectedIndex: 0, isSwitcherOpen: false };

describe('channelSwitcherSlice', () => {
    it('returns the initial state', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });

    it('setCurrentChannel updates the channel', () => {
        const state = reducer(initialState, setCurrentChannel('jazz'));
        expect(state.currentChannel).toBe('jazz');
    });

    it('setSelectedIndex updates the index', () => {
        const state = reducer(initialState, setSelectedIndex(3));
        expect(state.selectedIndex).toBe(3);
    });

    it('closeSwitcher sets isSwitcherOpen to false', () => {
        const open = { ...initialState, isSwitcherOpen: true };
        const state = reducer(open, closeSwitcher());
        expect(state.isSwitcherOpen).toBe(false);
    });

    it('toggleSwitcher opens when closed', () => {
        const state = reducer(initialState, toggleSwitcher());
        expect(state.isSwitcherOpen).toBe(true);
    });

    it('toggleSwitcher closes when open', () => {
        const open = { ...initialState, isSwitcherOpen: true };
        const state = reducer(open, toggleSwitcher());
        expect(state.isSwitcherOpen).toBe(false);
    });
});
