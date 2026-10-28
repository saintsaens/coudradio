import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { processTracks, uploadTrackSegments } from '../../encoding/processTracks.js';
import { localChannelDirectoryFor, localTrackDirectoryFor, removeLocalDirectory } from '../../encoding/workdir.js';
import { uploadSegment } from '../../encoding/uploadSegment.js';
import { encodeTrack } from '../../encoding/encodeTrack.js';
import { getTrackUrl } from '../../../repositories/trackRepository.js';

vi.mock('fs/promises', () => ({
    default: {
        readdir: vi.fn(),
        readFile: vi.fn(),
    },
}));

vi.mock('../../encoding/workdir.js', () => ({
    localChannelDirectoryFor: vi.fn(),
    localTrackDirectoryFor: vi.fn(),
    removeLocalDirectory: vi.fn(),
}));

vi.mock('../../encoding/uploadSegment.js', () => ({
    uploadSegment: vi.fn(),
}));

vi.mock('../../encoding/encodeTrack.js', () => ({
    encodeTrack: vi.fn(),
}));

vi.mock('../../../repositories/trackRepository.js', () => ({
    getTrackUrl: vi.fn(),
}));

// What ffmpeg writes for a single track: the period has no duration, the MPD does
const encodedMpd = (duration) => `<?xml version="1.0" encoding="utf-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="${duration}">
  <Period id="0" start="PT0.0S">
    <AdaptationSet id="0" contentType="audio">
      <Representation id="0" mimeType="audio/mp4">
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2" />
        <SegmentTemplate timescale="1000000" duration="5000000" initialization="t_init.mp4" media="t_$Number$.m4s" startNumber="1" />
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Set here rather than in the vi.mock factories: tests/setup.js resets every mock before each test
    vi.mocked(localChannelDirectoryFor).mockImplementation((channel) => `/tmp/${channel}`);
    vi.mocked(localTrackDirectoryFor).mockImplementation((channel, id) => `/tmp/${channel}/${id}`);
    vi.mocked(getTrackUrl).mockImplementation(async (channel, source) => `https://minio.test/${channel}/${source}`);
    vi.mocked(fs.readdir).mockResolvedValue(['track0_init.mp4', 'track0_1.m4s', 'track0_2.m4s', 'track0.mpd']);
    vi.mocked(uploadSegment).mockImplementation(async (_, segmentName, channel) => `segments/${channel}/${segmentName}`);
    vi.mocked(encodeTrack).mockImplementation(async ({ directory, id }) => `${directory}/${id}.mpd`);
    vi.mocked(fs.readFile).mockResolvedValue(encodedMpd('PT1M30.5S'));
});

describe('processTracks', () => {
    it('encodes each source under its id, uploads it and reports what ffmpeg produced', async () => {
        const onTrackDone = vi.fn();

        const { failed } = await processTracks({
            channelName: 'lofi',
            jobs: [{ id: 'track7', source: 'a.mp3' }, { id: 'track8', source: 'b.mp3' }],
            onTrackDone,
        });

        expect(failed).toEqual([]);
        expect(encodeTrack).toHaveBeenCalledWith({ input: 'https://minio.test/lofi/a.mp3', directory: '/tmp/lofi/track7', id: 'track7' });
        expect(onTrackDone).toHaveBeenCalledTimes(2);
        expect(onTrackDone).toHaveBeenCalledWith(
            { id: 'track8', source: 'b.mp3' },
            { duration: 90.5, audioChannels: '2', timescale: 1000000, segmentDuration: 5000000 }
        );
        expect(removeLocalDirectory).toHaveBeenCalledWith('/tmp/lofi');
    });

    it('skips a track that fails to encode and carries on with the next one', async () => {
        vi.mocked(encodeTrack).mockRejectedValueOnce(new Error('Invalid data found when processing input'));
        const onTrackDone = vi.fn();

        const { failed } = await processTracks({
            channelName: 'lofi',
            jobs: [{ id: 'track7', source: 'broken.mp3' }, { id: 'track8', source: 'b.mp3' }],
            onTrackDone,
        });

        expect(failed.map(({ job, error }) => [job.id, error.message])).toEqual([['track7', 'Invalid data found when processing input']]);
        expect(onTrackDone).toHaveBeenCalledTimes(1);
        expect(onTrackDone.mock.calls[0][0].id).toBe('track8');
    });

    it('does not upload a re-encoding whose duration does not match the track', async () => {
        const onTrackDone = vi.fn();

        const { failed } = await processTracks({
            channelName: 'lofi',
            jobs: [{ id: 'track3', source: 'a.mp3', expectedDuration: 200 }],
            onTrackDone,
        });

        expect(failed[0].error.message).toMatch('The new encoding lasts 90.5s instead of 200.0s');
        expect(uploadSegment).not.toHaveBeenCalled();
        expect(onTrackDone).not.toHaveBeenCalled();
    });

    it('accepts a re-encoding within a second of the expected duration', async () => {
        const onTrackDone = vi.fn();

        const { failed } = await processTracks({
            channelName: 'lofi',
            jobs: [{ id: 'track3', source: 'a.mp3', expectedDuration: 90.1 }],
            onTrackDone,
        });

        expect(failed).toEqual([]);
        expect(onTrackDone).toHaveBeenCalledTimes(1);
    });
});

describe('uploadTrackSegments', () => {
    it('uploads the init and media segments and returns their object names', async () => {
        const results = await uploadTrackSegments('lofi', 'track0');

        expect(localTrackDirectoryFor).toHaveBeenCalledWith('lofi', 'track0');
        expect(uploadSegment).toHaveBeenCalledTimes(3);
        expect(results).toHaveLength(3);
    });

    it('throws when a segment fails to upload', async () => {
        vi.mocked(uploadSegment).mockImplementation(async (_, segmentName, channel) =>
            segmentName === 'track0_2.m4s' ? null : `segments/${channel}/${segmentName}`
        );

        await expect(uploadTrackSegments('lofi', 'track0')).rejects.toThrow(
            'Failed to upload 1 of 3 segments for track0'
        );
    });
});
