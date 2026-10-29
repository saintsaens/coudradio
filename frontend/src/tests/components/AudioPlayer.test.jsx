import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { act, waitFor } from '@testing-library/react';
import { renderWithStore } from '../testUtils.jsx';

const mockPlayer = vi.hoisted(() => ({ handlers: {}, manifest: null }));

vi.mock('dashjs', () => {
    const events = {
        PLAYBACK_NOT_ALLOWED: 'playbackNotAllowed',
        FRAGMENT_LOADING_COMPLETED: 'fragmentLoadingCompleted',
        PLAYBACK_PLAYING: 'playbackPlaying',
        ERROR: 'error',
    };
    const create = () => ({
        initialize: vi.fn(),
        updateSettings: vi.fn(),
        attachView: vi.fn(),
        setAutoPlay: vi.fn(),
        attachSource: vi.fn(),
        reset: vi.fn(),
        on: (event, handler) => { mockPlayer.handlers[event] = handler; },
        retrieveManifest: (src, callback) => callback(mockPlayer.manifest, null),
    });
    return { default: { MediaPlayer: Object.assign(() => ({ create }), { events }), Debug: { LOG_LEVEL_ERROR: 1 } } };
});

const { default: AudioPlayer } = await import('../../components/AudioPlayer.jsx');

const fragmentLoaded = (type, error = null) =>
    act(() => mockPlayer.handlers.fragmentLoadingCompleted({ request: { type }, error }));

const renderPlayer = async () => {
    const result = renderWithStore(<AudioPlayer audioRef={createRef()} channelName="test" />);
    const progress = () => result.store.getState().audioPlayer.loadingProgress;
    await waitFor(() => expect(progress()).toBe(50));
    return progress;
};

describe('AudioPlayer loading progress', () => {
    beforeEach(() => {
        mockPlayer.handlers = {};
        mockPlayer.manifest = { mediaPresentationDuration: 3600 };
    });

    it('reaches 50% once the manifest is loaded', async () => {
        await renderPlayer();
    });

    it('advances to 75% on the init segment and 100% on the first media segment', async () => {
        const progress = await renderPlayer();

        fragmentLoaded('InitializationSegment');
        expect(progress()).toBe(75);

        fragmentLoaded('MediaSegment');
        expect(progress()).toBe(100);
    });

    it('never moves backwards when a later init segment loads', async () => {
        const progress = await renderPlayer();

        fragmentLoaded('InitializationSegment');
        fragmentLoaded('MediaSegment');
        fragmentLoaded('InitializationSegment');
        expect(progress()).toBe(100);
    });

    it('ignores failed downloads and unknown request types', async () => {
        const progress = await renderPlayer();

        fragmentLoaded('MediaSegment', { message: 'network error' });
        fragmentLoaded('IndexSegment');
        expect(progress()).toBe(50);
    });
});

describe('AudioPlayer errors', () => {
    const DECODE_ERROR = 3;
    const MEDIA_SEGMENT_DOWNLOAD_ERROR = 27;

    beforeEach(() => {
        mockPlayer.handlers = {};
        mockPlayer.manifest = { mediaPresentationDuration: 3600 };
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => vi.restoreAllMocks());

    const renderLoadedPlayer = async () => {
        const { store } = renderWithStore(<AudioPlayer audioRef={createRef()} channelName="test" />);
        await waitFor(() => expect(store.getState().audioPlayer.loadingProgress).toBe(50));
        return () => store.getState().audioPlayer;
    };

    const playerError = (code) => act(() => mockPlayer.handlers.error({ error: { code, message: 'boom' } }));
    const playbackStarts = () => act(() => mockPlayer.handlers.playbackPlaying());

    it('shows an error for any failure before playback starts', async () => {
        const state = await renderLoadedPlayer();

        playerError(MEDIA_SEGMENT_DOWNLOAD_ERROR);
        expect(state().error).toBe(true);
    });

    it('ignores download errors once playing, since dash.js retries them', async () => {
        const state = await renderLoadedPlayer();
        playbackStarts();

        playerError(MEDIA_SEGMENT_DOWNLOAD_ERROR);
        expect(state().error).toBe(false);
        expect(state().playing).toBe(true);
    });

    it('shows an error and stops playing on a media element error once playing', async () => {
        const state = await renderLoadedPlayer();
        playbackStarts();

        playerError(DECODE_ERROR);
        expect(state().error).toBe(true);
        expect(state().playing).toBe(false);
    });
});
