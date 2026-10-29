import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { act, waitFor } from '@testing-library/react';
import { renderWithStore } from '../testUtils.jsx';

const mockPlayer = vi.hoisted(() => ({ handlers: {}, manifest: null }));

vi.mock('dashjs', () => {
    const events = {
        PLAYBACK_NOT_ALLOWED: 'playbackNotAllowed',
        FRAGMENT_LOADING_COMPLETED: 'fragmentLoadingCompleted',
        PLAYBACK_PLAYING: 'playbackPlaying',
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
