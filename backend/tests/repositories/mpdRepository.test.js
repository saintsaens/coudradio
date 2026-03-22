import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadMpd, getMpd } from '../../repositories/mpdRepository.js';
import { minioClient } from '../../db-media/index.js';

vi.mock('../../db-media/index.js', () => ({
    minioClient: {
        putObject: vi.fn(),
        getObject: vi.fn(),
    },
}));

beforeEach(() => {
    process.env.MINIO_MPD_BUCKET = 'test-mpd-bucket';
    process.env.MINIO_MPD_PATH = 'mpd';
});

describe('uploadMpd', () => {
    it('uploads the MPD stream to MinIO and returns the object name', async () => {
        const mockStream = { readable: true };
        vi.mocked(minioClient.putObject).mockResolvedValue(undefined);

        const result = await uploadMpd(mockStream, 'lofi.mpd', 'lofi');

        expect(minioClient.putObject).toHaveBeenCalledWith(
            'test-mpd-bucket',
            'mpd/lofi/lofi.mpd',
            mockStream
        );
        expect(result).toBe('mpd/lofi/lofi.mpd');
    });

    it('wraps MinIO errors', async () => {
        vi.mocked(minioClient.putObject).mockRejectedValue(new Error('storage full'));

        await expect(uploadMpd({}, 'lofi.mpd', 'lofi')).rejects.toThrow('Failed to upload mpd');
    });
});

describe('getMpd', () => {
    it('returns the MPD stream from MinIO', async () => {
        const mockStream = { pipe: vi.fn() };
        vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

        const result = await getMpd('lofi');

        expect(minioClient.getObject).toHaveBeenCalledWith(
            'test-mpd-bucket',
            'mpd/lofi/lofi.mpd'
        );
        expect(result).toBe(mockStream);
    });

    it('wraps MinIO errors as a generic message', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(new Error('not found'));

        await expect(getMpd('lofi')).rejects.toThrow('Failed to retrieve mpd');
    });
});
