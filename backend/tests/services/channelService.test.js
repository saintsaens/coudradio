import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChannel } from '../../services/channelCreationService/channelService.js';
import { initializeChannelMpd } from '../../services/channelCreationService/channelMpdService.js';
import { loadProgress } from '../../services/channelCreationService/progressSavingService.js';
import { getTracklist } from '../../services/tracklistService.js';

vi.mock('../../services/channelCreationService/channelMpdService.js', () => ({
    initializeChannelMpd: vi.fn(),
    finalizeChannelMpd: vi.fn(),
}));

vi.mock('../../services/channelCreationService/progressSavingService.js', () => ({
    loadProgress: vi.fn(),
    cleanupProgress: vi.fn(),
}));

vi.mock('../../services/channelCreationService/trackProcessingService.js', () => ({
    processTracks: vi.fn(),
}));

vi.mock('../../services/tracklistService.js', () => ({
    getTracklist: vi.fn(),
}));

vi.mock('../../services/mpdService.js', () => ({
    uploadMpd: vi.fn(),
}));

vi.mock('../../repositories/mpdRepository.js', () => ({
    uploadTrackList: vi.fn(),
}));

beforeEach(() => {
    vi.mocked(getTracklist).mockResolvedValue(['https://minio/lofi/track.mp3']);
});

describe('createChannel', () => {
    it('resets the local channel MPD on a fresh run', async () => {
        vi.mocked(loadProgress).mockResolvedValue(-1);

        await createChannel('lofi');

        expect(initializeChannelMpd).toHaveBeenCalledWith('lofi', { reset: true });
    });

    it('keeps the local channel MPD when resuming a previous run', async () => {
        vi.mocked(loadProgress).mockResolvedValue(3);

        await createChannel('lofi');

        expect(initializeChannelMpd).toHaveBeenCalledWith('lofi', { reset: false });
    });
});
