import { describe, it, expect } from 'vitest';
import { computeTimeSpent } from '../../utils/durations.js';

describe('computeTimeSpent', () => {
    it('returns 0 when start and current time are equal', () => {
        const time = '2025-01-01T00:00:00Z';
        expect(computeTimeSpent(time, time)).toBe(0);
    });

    it('returns correct elapsed seconds', () => {
        expect(computeTimeSpent('2025-01-01T00:00:00Z', '2025-01-01T00:01:30Z')).toBe(90);
    });

    it('floors partial seconds', () => {
        expect(computeTimeSpent('2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.999Z')).toBe(0);
        expect(computeTimeSpent('2025-01-01T00:00:00.000Z', '2025-01-01T00:00:01.999Z')).toBe(1);
    });

    it('throws if currentTime is before startTime', () => {
        expect(() =>
            computeTimeSpent('2025-01-01T00:01:00Z', '2025-01-01T00:00:00Z')
        ).toThrow('currentTime must be after startTime');
    });

    it('accepts Date objects as well as ISO strings', () => {
        const start = new Date('2025-01-01T00:00:00Z');
        const current = new Date('2025-01-01T00:00:10Z');
        expect(computeTimeSpent(start, current)).toBe(10);
    });
});
