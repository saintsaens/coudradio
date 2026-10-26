import { describe, it, expect } from 'vitest';
import reducer, {
    setMuted,
    setPlaylistDuration,
    setError,
    setPlaying,
} from '../../store/features/audioPlayerSlice.js';

const initialState = { isMuted: true, playlistDuration: 25000, error: false, playing: false, loadingProgress: 0 };

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
