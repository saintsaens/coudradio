import { describe, it, expect, vi, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reducer, { fetchListeners } from '../../store/features/listenersSlice.js';

const makeStore = () => configureStore({ reducer: { listeners: reducer } });

describe('listenersSlice', () => {
    it('has correct initial state', () => {
        const store = makeStore();
        expect(store.getState().listeners).toEqual({ authenticated: 0, anonymous: 0 });
    });

    it('fetchListeners.fulfilled updates authenticated and anonymous counts', () => {
        const store = makeStore();
        store.dispatch({
            type: fetchListeners.fulfilled.type,
            payload: { authenticated: 5, anonymous: 3 },
        });
        expect(store.getState().listeners).toEqual({ authenticated: 5, anonymous: 3 });
    });
});

describe('fetchListeners thunk — behavior', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('rejects on non-200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        const store = makeStore();
        const result = await store.dispatch(fetchListeners());

        expect(fetchListeners.rejected.match(result)).toBe(true);
        expect(result.error.message).toBe('Failed to fetch listener counts');
    });

    it('resolves with json on 200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ authenticated: 2, anonymous: 7 }),
        });

        const store = makeStore();
        const result = await store.dispatch(fetchListeners());

        expect(fetchListeners.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual({ authenticated: 2, anonymous: 7 });
    });
});
