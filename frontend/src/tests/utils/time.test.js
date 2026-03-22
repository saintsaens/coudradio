import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { parseISODuration, computeStartTime, prefetchMPDDuration } from '../../utils/time.js';

describe('parseISODuration', () => {
    it('parses a full duration with hours, minutes, and seconds', () => {
        expect(parseISODuration('PT2H30M15S')).toBe(9015);
    });

    it('parses duration with only minutes', () => {
        expect(parseISODuration('PT30M')).toBe(1800);
    });

    it('parses duration with only seconds', () => {
        expect(parseISODuration('PT15S')).toBe(15);
    });

    it('parses duration with only hours', () => {
        expect(parseISODuration('PT2H')).toBe(7200);
    });

    it('parses fractional seconds', () => {
        expect(parseISODuration('PT1H2M3.5S')).toBe(3723.5);
    });

    it('returns null for an invalid string', () => {
        expect(parseISODuration('invalid')).toBeNull();
    });
});

describe('computeStartTime', () => {
    const playlistStart = new Date('2024-05-04T13:37:00+01:00').getTime() / 1000;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns elapsed time modulo duration', () => {
        const duration = 3600;
        // Set now to exactly 1 hour and 30 minutes after playlist start
        const now = (playlistStart + 5400) * 1000;
        vi.setSystemTime(now);

        const result = computeStartTime(duration);
        expect(result).toBeCloseTo(1800, 5);
    });

    it('returns a value in [0, duration)', () => {
        const duration = 1000;
        vi.setSystemTime((playlistStart + 2500) * 1000);

        const result = computeStartTime(duration);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(duration);
    });

    it('wraps correctly when elapsed time is an exact multiple of duration', () => {
        const duration = 500;
        vi.setSystemTime((playlistStart + 1000) * 1000);

        const result = computeStartTime(duration);
        expect(result).toBeCloseTo(0, 5);
    });
});

describe('prefetchMPDDuration', () => {
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

    it('does not call fetch when cache key already exists', async () => {
        sessionStorage.setItem(cacheKey, '3600');
        const fetchSpy = vi.spyOn(global, 'fetch');

        await prefetchMPDDuration(src);

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('fetches and caches the duration on success', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: async () => mpdXml,
        });

        await prefetchMPDDuration(src);

        expect(sessionStorage.getItem(cacheKey)).toBe('3600');
    });

    it('does not cache when fetch returns non-200', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

        await prefetchMPDDuration(src);

        expect(sessionStorage.getItem(cacheKey)).toBeNull();
    });

    it('does not cache when MPD has no mediaPresentationDuration', async () => {
        const noAttrXml = `<?xml version="1.0"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011"></MPD>`;
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: async () => noAttrXml,
        });

        await prefetchMPDDuration(src);

        expect(sessionStorage.getItem(cacheKey)).toBeNull();
    });

    it('swallows fetch errors silently', async () => {
        vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failure'));

        await expect(prefetchMPDDuration(src)).resolves.toBeUndefined();
        expect(sessionStorage.getItem(cacheKey)).toBeNull();
    });
});
