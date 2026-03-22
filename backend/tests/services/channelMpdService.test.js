import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeChannelMpd, addTrackToChannelMpd, finalizeChannelMpd } from '../../services/channelCreationService/channelMpdService.js';
import fs from 'fs/promises';
import * as fileSystemService from '../../services/channelCreationService/fileSystemService.js';
import * as mpdService from '../../services/mpdService.js';

vi.mock('fs/promises', () => ({
    default: {
        access: vi.fn(),
        mkdir: vi.fn(),
        writeFile: vi.fn(),
        appendFile: vi.fn(),
    },
}));

vi.mock('../../services/channelCreationService/fileSystemService.js', () => ({
    channelMpdPathFor: vi.fn(),
}));

vi.mock('../../services/mpdService.js', () => ({
    transformMpdIntoPeriod: vi.fn(),
    getTotalPeriodsDurations: vi.fn(),
    addMediaPresentationDuration: vi.fn(),
}));

beforeEach(() => {
    vi.mocked(fileSystemService.channelMpdPathFor).mockReturnValue('/tmp/mpd/lofi.mpd');
});

describe('initializeChannelMpd', () => {
    it('does nothing if the MPD file already exists', async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined);

        await initializeChannelMpd('lofi');

        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('creates the MPD file with the XML header when the file does not exist', async () => {
        // First call: file check → reject (file missing)
        // Second call: directory check → resolve (directory exists)
        vi.mocked(fs.access)
            .mockRejectedValueOnce(new Error('ENOENT'))
            .mockResolvedValueOnce(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);

        await initializeChannelMpd('lofi');

        expect(fs.writeFile).toHaveBeenCalledWith(
            '/tmp/mpd/lofi.mpd',
            expect.stringContaining('<?xml version="1.0"')
        );
    });
});

describe('addTrackToChannelMpd', () => {
    it('transforms the track MPD into a period and appends it to the channel MPD', async () => {
        vi.mocked(mpdService.transformMpdIntoPeriod).mockResolvedValue('<Period id="0">content</Period>');
        vi.mocked(fs.appendFile).mockResolvedValue(undefined);

        await addTrackToChannelMpd({ index: 0, trackMpdPath: '/tmp/mpd/lofi/track0.mpd', channelName: 'lofi' });

        expect(mpdService.transformMpdIntoPeriod).toHaveBeenCalledWith(0, '/tmp/mpd/lofi/track0.mpd', 'lofi');
        expect(fs.appendFile).toHaveBeenCalledWith(
            '/tmp/mpd/lofi.mpd',
            '\n<Period id="0">content</Period>'
        );
    });
});

describe('finalizeChannelMpd', () => {
    it('appends the closing tag, computes total duration, and writes it to the MPD', async () => {
        vi.mocked(fs.appendFile).mockResolvedValue(undefined);
        vi.mocked(mpdService.getTotalPeriodsDurations).mockResolvedValue(300);
        vi.mocked(mpdService.addMediaPresentationDuration).mockResolvedValue(undefined);

        await finalizeChannelMpd('lofi');

        expect(fs.appendFile).toHaveBeenCalledWith('/tmp/mpd/lofi.mpd', '\n</MPD>');
        expect(mpdService.getTotalPeriodsDurations).toHaveBeenCalledWith('/tmp/mpd/lofi.mpd');
        expect(mpdService.addMediaPresentationDuration).toHaveBeenCalledWith('/tmp/mpd/lofi.mpd', 300);
    });

    it('wraps errors with a descriptive message including the file path', async () => {
        vi.mocked(fs.appendFile).mockRejectedValue(new Error('disk full'));

        await expect(finalizeChannelMpd('lofi')).rejects.toThrow(
            'Failed to finalize MPD file at /tmp/mpd/lofi.mpd: disk full'
        );
    });
});
