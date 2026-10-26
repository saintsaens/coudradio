import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { uploadTrackSegments } from '../../services/channelCreationService/trackProcessingService.js';
import { localTrackDirectoryFor } from '../../services/channelCreationService/fileSystemService.js';
import { uploadSegment } from '../../services/channelCreationService/segmentsUploadingService.js';

vi.mock('fs/promises', () => ({
    default: {
        readdir: vi.fn(),
    },
}));

vi.mock('../../services/channelCreationService/fileSystemService.js', () => ({
    localTrackDirectoryFor: vi.fn(),
    cleanUpLocalTrackDirectory: vi.fn(),
    deleteLocalChannelDirectory: vi.fn(),
}));

vi.mock('../../services/channelCreationService/segmentsUploadingService.js', () => ({
    uploadSegment: vi.fn(),
}));

vi.mock('../../services/channelCreationService/progressSavingService.js', () => ({
    loadProgress: vi.fn(),
    saveProgress: vi.fn(),
}));

vi.mock('../../services/trackEncodingService.js', () => ({
    encodeTrack: vi.fn(),
}));

vi.mock('../../services/channelCreationService/channelMpdService.js', () => ({
    addTrackToChannelMpd: vi.fn(),
}));

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(localTrackDirectoryFor).mockReturnValue('/tmp/lofi/track0');
    vi.mocked(fs.readdir).mockResolvedValue(['track0_init.mp4', 'track0_1.m4s', 'track0_2.m4s', 'track0.mpd']);
});

describe('uploadTrackSegments', () => {
    it('uploads the init and media segments and returns their object names', async () => {
        vi.mocked(uploadSegment).mockImplementation(async (_, segmentName, channel) => `segments/${channel}/${segmentName}`);

        const results = await uploadTrackSegments('lofi', 0);

        expect(uploadSegment).toHaveBeenCalledTimes(3);
        expect(results).toHaveLength(3);
    });

    it('throws when a segment fails to upload', async () => {
        vi.mocked(uploadSegment).mockImplementation(async (_, segmentName, channel) =>
            segmentName === 'track0_2.m4s' ? null : `segments/${channel}/${segmentName}`
        );

        await expect(uploadTrackSegments('lofi', 0)).rejects.toThrow(
            'Failed to upload 1 of 3 segments for track 1'
        );
    });
});
