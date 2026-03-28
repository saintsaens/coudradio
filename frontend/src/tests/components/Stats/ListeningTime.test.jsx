import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithStore } from '../../testUtils.jsx';
import ListeningTime from '../../../components/Stats/ListeningTime.jsx';

const render = (timeSpent = 0, channelTimeSpent = 0) =>
    renderWithStore(<ListeningTime />, {
        preloadedState: {
            user: { timeSpent, channelTimeSpent },
            channelSwitcher: { currentChannel: 'lofi' },
        },
    });

describe('ListeningTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('displays 00:00:00:00 for channel and total when both are 0', () => {
        render(0, 0);
        expect(screen.getByRole('heading')).toHaveTextContent('00:00:00:00');
        expect(screen.getByText('total: 00:00:00:00')).toBeInTheDocument();
    });

    it('formats 3661 channel seconds as 00:01:01:01', () => {
        render(0, 3661);
        expect(screen.getByRole('heading')).toHaveTextContent('00:01:01:01');
    });

    it('formats 86400 total seconds as 01:00:00:00', () => {
        render(86400, 0);
        expect(screen.getByText('total: 01:00:00:00')).toBeInTheDocument();
    });

    it('auto-increments channel and total by 3 after 3 seconds', () => {
        render(0, 0);
        act(() => vi.advanceTimersByTime(3000));
        expect(screen.getByRole('heading')).toHaveTextContent('00:00:00:03');
        expect(screen.getByText('total: 00:00:00:03')).toBeInTheDocument();
    });

    it('syncs total when timeSpent changes in store', () => {
        const { store } = render(0, 0);
        act(() => {
            store.dispatch({ type: 'user/fetchUser/fulfilled', payload: {
                userId: '', username: '', role: 'user',
                sessionStartTime: '', lastActivity: '',
                timeSpent: 120, isSubscriber: false, email: '',
            }});
        });
        expect(screen.getByText('total: 00:00:02:00')).toBeInTheDocument();
    });
});
