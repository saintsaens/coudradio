import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithStore } from '../../testUtils.jsx';
import ListeningTime from '../../../components/Stats/ListeningTime.jsx';

const render = ({ timeSpent = 0, listeningTimes = {}, currentChannel = 'lofi' } = {}) =>
    renderWithStore(<ListeningTime />, {
        preloadedState: {
            user: { timeSpent, listeningTimes },
            channelSwitcher: { currentChannel },
        },
    });

describe('ListeningTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('always shows the active channel even with no history', () => {
        render({ currentChannel: 'lofi' });
        expect(screen.getByText('lofi')).toBeInTheDocument();
    });

    it('shows channel time from listeningTimes', () => {
        render({ listeningTimes: { lofi: 3661 }, currentChannel: 'lofi' });
        expect(screen.getByText('00:01:01:01')).toBeInTheDocument();
    });

    it('shows all channels with time > 0', () => {
        render({ listeningTimes: { lofi: 100, jazz: 200 }, currentChannel: 'lofi' });
        expect(screen.getByText('lofi')).toBeInTheDocument();
        expect(screen.getByText('jazz')).toBeInTheDocument();
    });

    it('shows total from timeSpent', () => {
        render({ timeSpent: 86400 });
        expect(screen.getByText('01:00:00:00')).toBeInTheDocument();
    });

    it('auto-increments active channel and total after 3 seconds', () => {
        render({ listeningTimes: { lofi: 0 }, currentChannel: 'lofi' });
        act(() => vi.advanceTimersByTime(3000));
        const monospaced = screen.getAllByText('00:00:00:03');
        expect(monospaced).toHaveLength(2); // channel row + total
    });

    it('syncs total when timeSpent changes in store', () => {
        const { store } = render({});
        act(() => {
            store.dispatch({ type: 'user/fetchUser/fulfilled', payload: {
                userId: '', username: '', role: 'user',
                sessionStartTime: '', lastActivity: '',
                timeSpent: 120, isSubscriber: false, email: '',
            }});
        });
        expect(screen.getByText('00:00:02:00')).toBeInTheDocument();
    });
});
