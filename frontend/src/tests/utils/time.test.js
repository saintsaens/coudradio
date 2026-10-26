import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { computeStartTime } from '../../utils/time.js';
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
