import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reducer, { fetchUser, updateLastActivity, updateSessionStartTime } from '../../store/features/userSlice.js';

const makeStore = () => configureStore({ reducer: { user: reducer } });

const mockUserData = {
    id: 'user-1',
    username: 'alice',
    role: 'admin',
    sessionStartTime: '2024-01-01T00:00:00Z',
    lastActivity: '2024-01-01T01:00:00Z',
    timeSpent: 3600,
    subscribed: true,
    email: 'alice@example.com',
};

describe('userSlice — fetchUser reducer handlers', () => {
    beforeEach(() => {
        import.meta.env.VITE_CHANNELS_DEFAULT = 'ch-a,ch-b';
        import.meta.env.VITE_CHANNELS_LOGGEDIN = 'ch-a,ch-b,ch-c';
    });

    it('fetchUser.pending sets status to loading', () => {
        const store = makeStore();
        store.dispatch({ type: fetchUser.pending.type });
        expect(store.getState().user.status).toBe('loading');
    });

    it('fetchUser.fulfilled with username populates state and uses LOGGEDIN channels', () => {
        const store = makeStore();
        store.dispatch({
            type: fetchUser.fulfilled.type,
            payload: {
                userId: 'user-1',
                username: 'alice',
                role: 'admin',
                sessionStartTime: '2024-01-01T00:00:00Z',
                lastActivity: '2024-01-01T01:00:00Z',
                timeSpent: 3600,
                isSubscriber: true,
                email: 'alice@example.com',
            },
        });
        const { user } = store.getState();
        expect(user.status).toBe('succeeded');
        expect(user.userId).toBe('user-1');
        expect(user.username).toBe('alice');
        expect(user.channelList).toEqual(['ch-a', 'ch-b', 'ch-c']);
    });

    it('fetchUser.fulfilled with no username uses DEFAULT channels', () => {
        const store = makeStore();
        store.dispatch({
            type: fetchUser.fulfilled.type,
            payload: {
                userId: '',
                username: '',
                role: 'user',
                sessionStartTime: '',
                lastActivity: '',
                timeSpent: 0,
                isSubscriber: false,
                email: '',
            },
        });
        expect(store.getState().user.channelList).toEqual(['ch-a', 'ch-b']);
    });

    it('fetchUser.rejected sets status to failed and uses DEFAULT channels', () => {
        const store = makeStore();
        store.dispatch({
            type: fetchUser.rejected.type,
            error: { message: 'Not logged in' },
        });
        const { user } = store.getState();
        expect(user.status).toBe('failed');
        expect(user.error).toBe('Not logged in');
        expect(user.channelList).toEqual(['ch-a', 'ch-b']);
    });
});

describe('fetchUser thunk — behavior', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('resolves with shaped user object on 200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => mockUserData,
        });

        const store = makeStore();
        const result = await store.dispatch(fetchUser());

        expect(fetchUser.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual({
            userId: 'user-1',
            username: 'alice',
            role: 'admin',
            sessionStartTime: '2024-01-01T00:00:00Z',
            lastActivity: '2024-01-01T01:00:00Z',
            timeSpent: 3600,
            isSubscriber: true,
            email: 'alice@example.com',
        });
    });

    it('rejects with Not logged in on non-200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        const store = makeStore();
        const result = await store.dispatch(fetchUser());

        expect(fetchUser.rejected.match(result)).toBe(true);
        expect(result.error.message).toBe('Not logged in');
    });
});

describe('updateLastActivity thunk', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('rejects on non-200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        const store = makeStore();
        const result = await store.dispatch(updateLastActivity());

        expect(updateLastActivity.rejected.match(result)).toBe(true);
        expect(result.error.message).toBe('Failed to update last activity');
    });

    it('resolves with json on 200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ updated: true }),
        });

        const store = makeStore();
        const result = await store.dispatch(updateLastActivity());

        expect(updateLastActivity.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual({ updated: true });
    });
});

describe('updateSessionStartTime thunk', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('rejects on non-200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        const store = makeStore();
        const result = await store.dispatch(updateSessionStartTime());

        expect(updateSessionStartTime.rejected.match(result)).toBe(true);
        expect(result.error.message).toBe('Failed to update session start time');
    });

    it('resolves with json on 200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ started: true }),
        });

        const store = makeStore();
        const result = await store.dispatch(updateSessionStartTime());

        expect(updateSessionStartTime.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual({ started: true });
    });
});
