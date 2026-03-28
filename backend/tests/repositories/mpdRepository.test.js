import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadMpd, getMpd, getTrackList, uploadTrackList } from '../../repositories/mpdRepository.js';
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

describe('getTrackList', () => {
    it('returns parsed filenames from tracks.json', async () => {
        const filenames = ['Artist A - Track 1.flac', 'Artist B - Track 2.mp3'];
        const buffer = Buffer.from(JSON.stringify(filenames));
        const mockStream = {
            on: vi.fn((event, cb) => {
                if (event === 'data') cb(buffer);
                if (event === 'end') cb();
                return mockStream;
            }),
        };
        vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

        const result = await getTrackList('lofi');

        expect(minioClient.getObject).toHaveBeenCalledWith('test-mpd-bucket', 'mpd/lofi/tracks.json');
        expect(result).toEqual(filenames);
    });

    it('throws with channel name on MinIO error', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(new Error('not found'));

        await expect(getTrackList('lofi')).rejects.toThrow('Failed to retrieve track list for channel: lofi');
    });
});

describe('uploadTrackList', () => {
    it('uploads serialized filenames and returns the object path', async () => {
        vi.mocked(minioClient.putObject).mockResolvedValue(undefined);
        const filenames = ['Artist A - Track 1.flac'];

        const result = await uploadTrackList('lofi', filenames);

        expect(minioClient.putObject).toHaveBeenCalledWith(
            'test-mpd-bucket',
            'mpd/lofi/tracks.json',
            expect.any(Buffer),
            expect.any(Number),
            { 'Content-Type': 'application/json' }
        );
        expect(result).toBe('mpd/lofi/tracks.json');
    });

    it('wraps MinIO errors', async () => {
        vi.mocked(minioClient.putObject).mockRejectedValue(new Error('storage full'));

        await expect(uploadTrackList('lofi', [])).rejects.toThrow('Failed to upload track list');
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
