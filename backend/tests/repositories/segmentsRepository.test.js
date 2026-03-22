import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSegment, putSegmentObject, getSegmentObject } from '../../repositories/segmentsRepository.js';
import { minioClient } from '../../db-media/index.js';
import { createReadStream } from 'fs';

vi.mock('../../db-media/index.js', () => ({
    minioClient: {
        getObject: vi.fn(),
        putObject: vi.fn(),
    },
}));

vi.mock('fs', () => ({
    createReadStream: vi.fn(),
}));

beforeEach(() => {
    process.env.MINIO_SEGMENTS_BUCKET = 'test-segments-bucket';
    process.env.MINIO_SEGMENTS_PATH = 'segments';
});

describe('getSegment', () => {
    it('returns the segment stream from MinIO', async () => {
        const mockStream = { pipe: vi.fn() };
        vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

        const result = await getSegment('lofi', 'track0_1.m4s');

        expect(minioClient.getObject).toHaveBeenCalledWith(
            'test-segments-bucket',
            'segments/lofi/track0_1.m4s'
        );
        expect(result).toBe(mockStream);
    });

    it('wraps MinIO errors', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(new Error('MinIO down'));

        await expect(getSegment('lofi', 'track0_1.m4s')).rejects.toThrow('Failed to retrieve segment');
    });
});

describe('putSegmentObject', () => {
    it('creates a read stream and uploads it to MinIO', async () => {
        const mockStream = { readable: true };
        vi.mocked(createReadStream).mockReturnValue(mockStream);
        vi.mocked(minioClient.putObject).mockResolvedValue(undefined);

        await putSegmentObject('segments/lofi/track0_1.m4s', './public/lofi/track0_1.m4s');

        expect(createReadStream).toHaveBeenCalledWith('./public/lofi/track0_1.m4s');
        expect(minioClient.putObject).toHaveBeenCalledWith(
            'test-segments-bucket',
            'segments/lofi/track0_1.m4s',
            mockStream
        );
    });
});

describe('getSegmentObject', () => {
    it('returns the object stream from MinIO', async () => {
        const mockStream = { pipe: vi.fn() };
        vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

        const result = await getSegmentObject('segments/lofi/track0_init.mp4');

        expect(minioClient.getObject).toHaveBeenCalledWith(
            'test-segments-bucket',
            'segments/lofi/track0_init.mp4'
        );
        expect(result).toBe(mockStream);
    });
});
