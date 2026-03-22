import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithStore } from '../../testUtils.jsx';
import ListeningTime from '../../../components/Stats/ListeningTime.jsx';

const render = (timeSpent = 0) =>
    renderWithStore(<ListeningTime />, {
        preloadedState: { user: { timeSpent } },
    });

describe('ListeningTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('displays 00:00:00:00 when timeSpent is 0', () => {
        render(0);
        expect(screen.getByText('00:00:00:00')).toBeInTheDocument();
    });

    it('formats 3661 seconds as 00:01:01:01', () => {
        render(3661);
        expect(screen.getByText('00:01:01:01')).toBeInTheDocument();
    });

    it('formats 86400 seconds as 01:00:00:00', () => {
        render(86400);
        expect(screen.getByText('01:00:00:00')).toBeInTheDocument();
    });

    it('auto-increments by 3 after 3 seconds', () => {
        render(0);
        act(() => vi.advanceTimersByTime(3000));
        expect(screen.getByText('00:00:00:03')).toBeInTheDocument();
    });

    it('syncs elapsedTime when timeSpent changes in store', () => {
        const { store } = render(0);
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
