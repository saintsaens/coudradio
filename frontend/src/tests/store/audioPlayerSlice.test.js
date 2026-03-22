import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reducer, {
    setMuted,
    setPlaylistDuration,
    setError,
    setPlaying,
    checkStream,
} from '../../store/features/audioPlayerSlice.js';

const initialState = { isMuted: true, playlistDuration: 25000, error: false, playing: false };

const makeStore = (preloadedState) =>
    configureStore({ reducer: { audioPlayer: reducer }, preloadedState });

describe('audioPlayerSlice — reducers', () => {
    it('returns the initial state', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });

    it('setMuted updates isMuted', () => {
        expect(reducer(initialState, setMuted(false)).isMuted).toBe(false);
    });

    it('setPlaylistDuration updates playlistDuration', () => {
        expect(reducer(initialState, setPlaylistDuration(30000)).playlistDuration).toBe(30000);
    });

    it('setError updates error', () => {
        expect(reducer(initialState, setError(true)).error).toBe(true);
    });

    it('setPlaying updates playing', () => {
        expect(reducer(initialState, setPlaying(true)).playing).toBe(true);
    });
});

describe('audioPlayerSlice — checkStream reducer side-effects', () => {
    it('checkStream.rejected sets error to true', () => {
        const store = makeStore({ audioPlayer: initialState });
        store.dispatch({ type: checkStream.rejected.type, error: { message: 'Stream is unavailable' } });
        expect(store.getState().audioPlayer.error).toBe(true);
    });

    it('checkStream.fulfilled sets error to false even if it was true', () => {
        const store = makeStore({ audioPlayer: { ...initialState, error: true } });
        store.dispatch({ type: checkStream.fulfilled.type, payload: 3600 });
        expect(store.getState().audioPlayer.error).toBe(false);
    });
});

describe('checkStream thunk — behavior', () => {
    const src = 'https://example.com/stream.mpd';
    const cacheKey = `mpd_duration:${src}`;
    const mpdXml = `<?xml version="1.0"?>
        <MPD mediaPresentationDuration="PT1H" xmlns="urn:mpeg:dash:schema:mpd:2011"></MPD>`;

    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('cache hit + HEAD ok: resolves with cached float', async () => {
        sessionStorage.setItem(cacheKey, '1800');
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true });

        const store = makeStore({ audioPlayer: initialState });
        const result = await store.dispatch(checkStream(src));

        expect(checkStream.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(1800);
        expect(global.fetch).toHaveBeenCalledWith(src, { method: 'HEAD' });
    });

    it('cache hit + HEAD fails: rejects with unavailable message', async () => {
        sessionStorage.setItem(cacheKey, '1800');
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        const store = makeStore({ audioPlayer: initialState });
        const result = await store.dispatch(checkStream(src));

        expect(checkStream.rejected.match(result)).toBe(true);
        expect(result.payload).toBe('Stream is unavailable');
    });

    it('no cache + GET ok + valid MPD: resolves with duration and caches it', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: async () => mpdXml,
        });

        const store = makeStore({ audioPlayer: initialState });
        const result = await store.dispatch(checkStream(src));

        expect(checkStream.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(3600);
        expect(sessionStorage.getItem(cacheKey)).toBe('3600');
    });

    it('no cache + GET fails: rejects with unavailable message', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        const store = makeStore({ audioPlayer: initialState });
        const result = await store.dispatch(checkStream(src));

        expect(checkStream.rejected.match(result)).toBe(true);
        expect(result.payload).toBe('Stream is unavailable');
    });

    it('no cache + GET ok + no duration in MPD: rejects with parse error', async () => {
        const noAttrXml = `<?xml version="1.0"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011"></MPD>`;
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: async () => noAttrXml,
        });

        const store = makeStore({ audioPlayer: initialState });
        const result = await store.dispatch(checkStream(src));

        expect(checkStream.rejected.match(result)).toBe(true);
        expect(result.payload).toBe('Could not parse MPD duration');
    });

    it('network error: rejects with network error message', async () => {
        vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failure'));

        const store = makeStore({ audioPlayer: initialState });
        const result = await store.dispatch(checkStream(src));

        expect(checkStream.rejected.match(result)).toBe(true);
        expect(result.payload).toBe('Network error');
    });
});
