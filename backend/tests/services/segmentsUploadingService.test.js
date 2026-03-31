import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadSegment } from '../../services/channelCreationService/segmentsUploadingService.js';
import { putSegmentObject } from '../../repositories/segmentsRepository.js';

vi.mock('../../repositories/segmentsRepository.js', () => ({
    putSegmentObject: vi.fn(),
}));

beforeEach(() => {
    vi.useFakeTimers();
    process.env.MINIO_SEGMENTS_PATH = 'segments';
});

afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
});

describe('uploadSegment', () => {
    it('returns the object name on the first successful attempt', async () => {
        vi.mocked(putSegmentObject).mockResolvedValue(undefined);

        const result = await uploadSegment('/path/track0_1.m4s', 'track0_1.m4s', 'lofi');

        expect(result).toBe('segments/lofi/track0_1.m4s');
        expect(putSegmentObject).toHaveBeenCalledTimes(1);
        expect(putSegmentObject).toHaveBeenCalledWith('segments/lofi/track0_1.m4s', '/path/track0_1.m4s');
    });

    it('retries once on failure and returns the object name on second attempt', async () => {
        vi.mocked(putSegmentObject)
            .mockRejectedValueOnce(new Error('network error'))
            .mockResolvedValueOnce(undefined);

        const promise = uploadSegment('/path/track0_1.m4s', 'track0_1.m4s', 'lofi');
        // Advance past the first retry delay (BASE_DELAY * 1 = 1000ms)
        await vi.advanceTimersByTimeAsync(1000);
        const result = await promise;

        expect(result).toBe('segments/lofi/track0_1.m4s');
        expect(putSegmentObject).toHaveBeenCalledTimes(2);
    });

    it('returns null after all 5 attempts fail', async () => {
        vi.mocked(putSegmentObject).mockRejectedValue(new Error('storage error'));

        const promise = uploadSegment('/path/track0_1.m4s', 'track0_1.m4s', 'lofi');
        // Advance past all retry delays: 1000 + 2000 + 3000 + 4000 = 10000ms
        await vi.advanceTimersByTimeAsync(10000);
        const result = await promise;

        expect(result).toBeNull();
        expect(putSegmentObject).toHaveBeenCalledTimes(5);
    });
});
