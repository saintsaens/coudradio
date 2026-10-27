import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addTracks, publishChannel, reencodeTracks, syncChannel } from '../channelMaintenanceService.js';
import { buildChannelMpd } from '../channelManifestService.js';
import { processTracks } from '../trackProcessingService.js';
import * as mpdRepository from '../../repositories/mpdRepository.js';
import { listSegmentNames } from '../../repositories/segmentsRepository.js';
import { getTracks } from '../../repositories/trackRepository.js';

vi.mock('../../repositories/mpdRepository.js', () => ({
    getChannelManifest: vi.fn(),
    getMpdContent: vi.fn(),
    getMpdStat: vi.fn(),
    getTrackList: vi.fn(),
    uploadChannelManifest: vi.fn(),
    uploadMpd: vi.fn(),
    uploadTrackList: vi.fn(),
}));

vi.mock('../../repositories/segmentsRepository.js', () => ({
    listSegmentNames: vi.fn(),
}));

vi.mock('../../repositories/trackRepository.js', async (importOriginal) => ({
    ...(await importOriginal()),
    getTracks: vi.fn(),
}));

vi.mock('../trackProcessingService.js', () => ({
    processTracks: vi.fn(),
}));

const track = (id, duration, overrides = {}) => ({
    id, source: `${id}.mp3`, title: id, duration, audioChannels: '2', timescale: 1000000, segmentDuration: 5000000,
    encodedAt: '2026-01-01T00:00:00.000Z', ...overrides,
});

const manifest = (tracks) => ({ version: 1, channel: 'lofi', tracks });

const encoding = (duration) => ({ duration, audioChannels: '2', timescale: 1000000, segmentDuration: 5000000 });

// Runs every job through onTrackDone, as if each track encoded and uploaded fine
const encodeEverything = () => vi.mocked(processTracks).mockImplementation(async ({ jobs, onTrackDone }) => {
    for (const job of jobs) await onTrackDone(job, encoding(42));
    return { failed: [] };
});

const lastUploadedManifest = () => vi.mocked(mpdRepository.uploadChannelManifest).mock.calls.at(-1)[1];

beforeEach(() => {
    process.env.BACKEND_URL = 'https://radio.test/api';
    vi.mocked(mpdRepository.getTrackList).mockResolvedValue(null);
});

describe('publishChannel', () => {
    it('uploads channel.json, the generated MPD and tracks.json', async () => {
        const saved = manifest([track('track0', 10)]);

        await publishChannel(saved);

        expect(mpdRepository.uploadChannelManifest).toHaveBeenCalledWith('lofi', saved);
        expect(vi.mocked(mpdRepository.uploadMpd).mock.calls[0][0].toString()).toBe(buildChannelMpd(saved));
        expect(mpdRepository.uploadMpd.mock.calls[0].slice(1)).toEqual(['lofi.mpd', 'lofi']);
        expect(mpdRepository.uploadTrackList).toHaveBeenCalledWith('lofi', ['track0']);
    });

    it('refuses to publish a channel without tracks', async () => {
        await expect(publishChannel(manifest([]))).rejects.toThrow('has no tracks');
    });
});

describe('syncChannel', () => {
    const saved = manifest([track('track0', 10), track('track1', 20)]);

    beforeEach(() => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(saved);
    });

    it('does nothing when the MPD and tracks.json already match', async () => {
        vi.mocked(mpdRepository.getMpdContent).mockResolvedValue(buildChannelMpd(saved));
        vi.mocked(mpdRepository.getTrackList).mockResolvedValue(['track0', 'track1']);

        const result = await syncChannel({ channel: 'lofi' });

        expect(result.upToDate).toBe(true);
        expect(mpdRepository.uploadMpd).not.toHaveBeenCalled();
    });

    it('republishes when the live MPD points to another host', async () => {
        process.env.BACKEND_URL = 'https://old.test/api';
        vi.mocked(mpdRepository.getMpdContent).mockResolvedValue(buildChannelMpd(saved));
        process.env.BACKEND_URL = 'https://radio.test/api';
        vi.mocked(mpdRepository.getTrackList).mockResolvedValue(['track0', 'track1']);

        const result = await syncChannel({ channel: 'lofi' });

        expect(result.differences.map((d) => d.field)).toContain('media');
        expect(mpdRepository.uploadMpd).toHaveBeenCalledOnce();
    });

    it('applies an edited manifest, and only previews it in a dry run', async () => {
        vi.mocked(mpdRepository.getMpdContent).mockResolvedValue(buildChannelMpd(saved));
        const edited = { tracks: [{ id: 'track1', title: 'Second' }] };

        const preview = await syncChannel({ channel: 'lofi', edited, dryRun: true });
        expect(preview.manifestChanged).toBe(true);
        expect(preview.titleChanges).toEqual([{ index: 0, before: undefined, after: 'Second' }]);
        expect(mpdRepository.uploadChannelManifest).not.toHaveBeenCalled();

        await syncChannel({ channel: 'lofi', edited });
        expect(lastUploadedManifest().tracks.map((t) => [t.id, t.title, t.duration])).toEqual([['track1', 'Second', 20]]);
    });

    it('requires a saved channel.json', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(null);

        await expect(syncChannel({ channel: 'lofi' })).rejects.toThrow('has no channel.json');
    });
});

describe('addTracks', () => {
    it('creates a new channel from every file in the bucket', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(null);
        vi.mocked(mpdRepository.getMpdStat).mockResolvedValue(null);
        vi.mocked(getTracks).mockResolvedValue(['Album/01_First.mp3', 'Album/02_Second.mp3']);
        encodeEverything();

        const { added, failed } = await addTracks({ channel: 'lofi' });

        expect(failed).toEqual([]);
        expect(added.map((t) => [t.id, t.source, t.title, t.duration])).toEqual([
            ['track0', 'Album/01_First.mp3', '01 First', 42],
            ['track1', 'Album/02_Second.mp3', '02 Second', 42],
        ]);
        expect(mpdRepository.uploadMpd).toHaveBeenCalledOnce();
    });

    it('appends only the new files after the last track and saves channel.json after each one', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(manifest([track('track0', 10), track('track5', 10)]));
        vi.mocked(getTracks).mockResolvedValue(['track0.mp3', 'new.mp3', 'track5.mp3']);
        encodeEverything();

        await addTracks({ channel: 'lofi' });

        expect(vi.mocked(processTracks).mock.calls[0][0].jobs).toEqual([{ id: 'track6', source: 'new.mp3' }]);
        expect(mpdRepository.uploadChannelManifest).toHaveBeenCalledTimes(2);
        expect(lastUploadedManifest().tracks.map((t) => t.id)).toEqual(['track0', 'track5', 'track6']);
    });

    it('lists what it would add in a dry run without encoding', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(manifest([track('track0', 10)]));
        vi.mocked(getTracks).mockResolvedValue(['track0.mp3', 'new.mp3']);

        const { jobs } = await addTracks({ channel: 'lofi', dryRun: true });

        expect(jobs).toEqual([{ id: 'track1', source: 'new.mp3' }]);
        expect(processTracks).not.toHaveBeenCalled();
    });

    it('needs explicit files when existing tracks have no source', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(manifest([track('track0', 10, { source: null })]));
        vi.mocked(getTracks).mockResolvedValue(['a.mp3', 'b.mp3']);

        await expect(addTracks({ channel: 'lofi' })).rejects.toThrow('name the files to add');

        const { jobs } = await addTracks({ channel: 'lofi', files: ['b.mp3'], dryRun: true });
        expect(jobs).toEqual([{ id: 'track1', source: 'b.mp3' }]);
    });

    it('rejects files that are not in the bucket and skips those already added', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(manifest([track('track0', 10)]));
        vi.mocked(getTracks).mockResolvedValue(['track0.mp3', 'a.mp3']);

        await expect(addTracks({ channel: 'lofi', files: ['missing.mp3'] })).rejects.toThrow('Not in the "lofi" bucket: missing.mp3');

        const { jobs, skipped } = await addTracks({ channel: 'lofi', files: ['track0.mp3', 'a.mp3'], dryRun: true });
        expect(skipped).toEqual(['track0.mp3']);
        expect(jobs.map((job) => job.source)).toEqual(['a.mp3']);
    });

    it('asks for a bootstrap when an existing channel has no channel.json', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(null);
        vi.mocked(mpdRepository.getMpdStat).mockResolvedValue({ lastModified: new Date() });

        await expect(addTracks({ channel: 'lofi' })).rejects.toThrow('bootstrap lofi --write');
    });
});

describe('reencodeTracks', () => {
    beforeEach(() => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(manifest([
            track('track0', 10),
            track('track1', 20, { encodedAt: '2026-05-01T00:00:00.000Z' }),
            track('track2', 30),
        ]));
    });

    it('re-encodes the selected tracks in place, checking their duration, and republishes', async () => {
        encodeEverything();

        const { reencoded } = await reencodeTracks({ channel: 'lofi', args: ['1-2'] });

        expect(vi.mocked(processTracks).mock.calls[0][0].jobs).toEqual([
            { index: 1, id: 'track1', source: 'track1.mp3', expectedDuration: 20 },
            { index: 2, id: 'track2', source: 'track2.mp3', expectedDuration: 30 },
        ]);
        expect(reencoded).toHaveLength(2);
        const saved = lastUploadedManifest();
        expect(saved.tracks.map((t) => [t.id, t.duration])).toEqual([['track0', 10], ['track1', 42], ['track2', 42]]);
        expect(saved.tracks[2].encodedAt).not.toBe('2026-01-01T00:00:00.000Z');
        expect(mpdRepository.uploadMpd).toHaveBeenCalledOnce();
    });

    it('selects tracks with missing segments and tracks encoded before loudness normalization', async () => {
        vi.mocked(listSegmentNames).mockResolvedValue([
            'track0_init.mp4', 'track0_1.m4s', 'track0_2.m4s',
            'track1_init.mp4', 'track1_1.m4s', 'track1_2.m4s', 'track1_3.m4s', 'track1_4.m4s',
        ]);

        const missing = await reencodeTracks({ channel: 'lofi', missing: true, dryRun: true });
        expect(missing.jobs.map((job) => job.index)).toEqual([2]);

        const outdated = await reencodeTracks({ channel: 'lofi', outdated: true, dryRun: true });
        expect(outdated.jobs.map((job) => job.index)).toEqual([0, 2]);
    });

    it('skips the duration check when forced', async () => {
        const { jobs } = await reencodeTracks({ channel: 'lofi', args: ['0'], force: true, dryRun: true });

        expect(jobs[0].expectedDuration).toBeUndefined();
    });

    it('refuses tracks that have no source file', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(manifest([track('track0', 10, { source: null })]));

        await expect(reencodeTracks({ channel: 'lofi', all: true })).rejects.toThrow('no source file to re-encode from: #0');
    });

    it('does not republish when every track failed', async () => {
        vi.mocked(processTracks).mockResolvedValue({ failed: [{ job: { id: 'track0' }, error: new Error('boom') }] });

        const { failed } = await reencodeTracks({ channel: 'lofi', args: ['0'] });

        expect(failed).toHaveLength(1);
        expect(mpdRepository.uploadMpd).not.toHaveBeenCalled();
    });
});
