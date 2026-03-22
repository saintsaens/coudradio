import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import { getTrack, getTracks, getTrackUrl } from '../../repositories/trackRepository.js';
import { minioClient } from '../../db-media/index.js';

vi.mock('../../db-media/index.js', () => ({
    minioClient: {
        getObject: vi.fn(),
        listObjects: vi.fn(),
        presignedUrl: vi.fn(),
    },
}));

describe('getTrack', () => {
    it('returns the track stream from MinIO', async () => {
        const mockStream = { pipe: vi.fn() };
        vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

        const result = await getTrack('lofi', 'track1.mp3');

        expect(minioClient.getObject).toHaveBeenCalledWith('lofi', 'track1.mp3');
        expect(result).toBe(mockStream);
    });

    it('throws with channel name on MinIO error', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(new Error('not found'));

        await expect(getTrack('lofi', 'track1.mp3')).rejects.toThrow('Invalid channel: lofi');
    });
});

describe('getTracks', () => {
    it('resolves with only audio files filtered by allowed extensions', async () => {
        const mockStream = new EventEmitter();
        vi.mocked(minioClient.listObjects).mockReturnValue(mockStream);

        const promise = getTracks('lofi');

        mockStream.emit('data', { name: 'track1.mp3' });
        mockStream.emit('data', { name: 'track2.WAV' });   // uppercase extension
        mockStream.emit('data', { name: 'cover.jpg' });    // not allowed
        mockStream.emit('data', { name: 'track3.flac' });
        mockStream.emit('data', { name: 'notes.txt' });    // not allowed
        mockStream.emit('end');

        const result = await promise;
        expect(result).toEqual(['track1.mp3', 'track2.WAV', 'track3.flac']);
    });

    it('rejects when the stream emits an error', async () => {
        const mockStream = new EventEmitter();
        vi.mocked(minioClient.listObjects).mockReturnValue(mockStream);

        const promise = getTracks('lofi');
        mockStream.emit('error', new Error('bucket not found'));

        await expect(promise).rejects.toThrow('bucket not found');
    });
});

describe('getTrackUrl', () => {
    it('returns the presigned URL for a track', async () => {
        const mockUrl = 'https://minio.example.com/lofi/track1.mp3?sig=abc';
        vi.mocked(minioClient.presignedUrl).mockResolvedValue(mockUrl);

        const result = await getTrackUrl('lofi', 'track1.mp3');

        expect(minioClient.presignedUrl).toHaveBeenCalledWith('GET', 'lofi', 'track1.mp3');
        expect(result).toBe(mockUrl);
    });

    it('throws with track name on MinIO error', async () => {
        vi.mocked(minioClient.presignedUrl).mockRejectedValue(new Error('expired'));

        await expect(getTrackUrl('lofi', 'track1.mp3')).rejects.toThrow('Invalid track: track1.mp3');
    });
});
