import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import {
    uploadMpd, getMpd, getTrackList, uploadTrackList,
    getMpdContent, getMpdStat, getChannelManifest, uploadChannelManifest, listChannelNames,
} from '../../repositories/mpdRepository.js';
import { minioClient } from '../../db-media/index.js';

vi.mock('../../db-media/index.js', () => ({
    minioClient: {
        putObject: vi.fn(),
        getObject: vi.fn(),
        statObject: vi.fn(),
        listObjects: vi.fn(),
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

const streamOf = (content) => {
    const stream = new EventEmitter();
    process.nextTick(() => {
        stream.emit('data', Buffer.from(content));
        stream.emit('end');
    });
    return stream;
};

const listingOf = (names) => {
    const stream = new EventEmitter();
    process.nextTick(() => {
        names.forEach((name) => stream.emit('data', { name }));
        stream.emit('end');
    });
    return stream;
};

const noSuchKey = () => Object.assign(new Error('missing'), { code: 'NoSuchKey' });

describe('getMpdContent', () => {
    it('returns the MPD as a string', async () => {
        vi.mocked(minioClient.getObject).mockResolvedValue(streamOf('<MPD/>'));

        const result = await getMpdContent('lofi');

        expect(minioClient.getObject).toHaveBeenCalledWith('test-mpd-bucket', 'mpd/lofi/lofi.mpd');
        expect(result).toBe('<MPD/>');
    });

    it('returns null when the channel has no MPD', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(noSuchKey());

        expect(await getMpdContent('lofi')).toBeNull();
    });

    it('wraps other MinIO errors', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(new Error('timeout'));

        await expect(getMpdContent('lofi')).rejects.toThrow('Failed to retrieve mpd for channel lofi: timeout');
    });
});

describe('getMpdStat', () => {
    it('returns the MPD object stats', async () => {
        const stat = { lastModified: new Date('2026-04-01') };
        vi.mocked(minioClient.statObject).mockResolvedValue(stat);

        expect(await getMpdStat('lofi')).toBe(stat);
        expect(minioClient.statObject).toHaveBeenCalledWith('test-mpd-bucket', 'mpd/lofi/lofi.mpd');
    });

    it('returns null when the channel has no MPD', async () => {
        vi.mocked(minioClient.statObject).mockRejectedValue(Object.assign(new Error('missing'), { code: 'NotFound' }));

        expect(await getMpdStat('lofi')).toBeNull();
    });
});

describe('getChannelManifest', () => {
    it('returns the parsed channel.json', async () => {
        const manifest = { version: 1, channel: 'lofi', tracks: [] };
        vi.mocked(minioClient.getObject).mockResolvedValue(streamOf(JSON.stringify(manifest)));

        const result = await getChannelManifest('lofi');

        expect(minioClient.getObject).toHaveBeenCalledWith('test-mpd-bucket', 'mpd/lofi/channel.json');
        expect(result).toEqual(manifest);
    });

    it('returns null when the channel has no channel.json', async () => {
        vi.mocked(minioClient.getObject).mockRejectedValue(noSuchKey());

        expect(await getChannelManifest('lofi')).toBeNull();
    });
});

describe('uploadChannelManifest', () => {
    it('uploads the serialized manifest and returns the object path', async () => {
        vi.mocked(minioClient.putObject).mockResolvedValue(undefined);

        const result = await uploadChannelManifest('lofi', { version: 1, channel: 'lofi', tracks: [] });

        expect(minioClient.putObject).toHaveBeenCalledWith(
            'test-mpd-bucket',
            'mpd/lofi/channel.json',
            expect.any(Buffer),
            expect.any(Number),
            { 'Content-Type': 'application/json' }
        );
        expect(result).toBe('mpd/lofi/channel.json');
    });

    it('wraps MinIO errors', async () => {
        vi.mocked(minioClient.putObject).mockRejectedValue(new Error('storage full'));

        await expect(uploadChannelManifest('lofi', {})).rejects.toThrow('Failed to upload channel manifest');
    });
});

describe('listChannelNames', () => {
    it('returns the sorted, de-duplicated channel folders', async () => {
        vi.mocked(minioClient.listObjects).mockReturnValue(
            listingOf(['mpd/lofi/lofi.mpd', 'mpd/lofi/tracks.json', 'mpd/chillhop/tracks.json'])
        );

        const result = await listChannelNames();

        expect(minioClient.listObjects).toHaveBeenCalledWith('test-mpd-bucket', 'mpd/', true);
        expect(result).toEqual(['chillhop', 'lofi']);
    });
});
