import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Readable } from 'stream';
import { getCurrentTrack } from '../../services/metadataService.js';
import { getMpd, getTrackList } from '../../repositories/mpdRepository.js';

vi.mock('../../repositories/mpdRepository.js', () => ({
    getMpd: vi.fn(),
    getTrackList: vi.fn(),
}));

const mpd = `<MPD type="static" mediaPresentationDuration="PT20S">
  <Period id="track0" duration="PT10S"></Period>
  <Period id="track1" duration="PT10S"></Period>
</MPD>`;

beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getMpd).mockImplementation(async () => Readable.from([Buffer.from(mpd)]));
    vi.mocked(getTrackList).mockResolvedValue(['Track A', 'Track B']);
});

afterEach(() => {
    vi.useRealTimers();
});

// The cache is module-level, so each test uses its own channel name
describe('getCurrentTrack', () => {
    it('reuses the cached channel metadata within the cache lifetime', async () => {
        await getCurrentTrack('cache-hit');
        vi.advanceTimersByTime(60 * 1000);
        await getCurrentTrack('cache-hit');

        expect(getMpd).toHaveBeenCalledTimes(1);
    });

    it('reloads the channel metadata once the cache has expired', async () => {
        await getCurrentTrack('cache-expiry');
        vi.advanceTimersByTime(5 * 60 * 1000);
        vi.mocked(getTrackList).mockResolvedValue(['Track C', 'Track D']);
        const { track } = await getCurrentTrack('cache-expiry');

        expect(getMpd).toHaveBeenCalledTimes(2);
        expect(['Track C', 'Track D']).toContain(track);
    });
});
