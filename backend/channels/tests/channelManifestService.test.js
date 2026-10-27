import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    applyManifestEdits,
    bootstrapManifest,
    buildChannelMpd,
    buildTrackList,
    compareManifestWithMpd,
    compareWithSources,
    describeTracks,
    expectedSegmentCount,
    findSegmentProblems,
    insertTrack,
    isOutdated,
    isUrlDifference,
    loadChannelManifest,
    nextTrackId,
    parseChannelMpd,
    parseEncodedTrackMpd,
    parseTrackSelection,
    stripAudioExtension,
    titleFromSource,
} from '../channelManifestService.js';
import { PLAYLIST_START } from '../../utils/playlistClock.js';
import * as mpdRepository from '../../repositories/mpdRepository.js';
import { getTracks } from '../../repositories/trackRepository.js';

vi.mock('../../repositories/mpdRepository.js', () => ({
    getMpdContent: vi.fn(),
    getMpdStat: vi.fn(),
    getTrackList: vi.fn(),
    getChannelManifest: vi.fn(),
}));

vi.mock('../../repositories/trackRepository.js', async (importOriginal) => ({
    ...(await importOriginal()),
    getTracks: vi.fn(),
}));

const period = (index, duration, { host = 'https://radio.test/api', channels = '2' } = {}) => `
<Period id="track${index}" duration="${duration}">
  <AdaptationSet id="${index}" contentType="audio" startWithSAP="1" segmentAlignment="true" bitstreamSwitching="true">
    <Representation id="track${index}" mimeType="audio/mp4" codecs="mp4a.40.2" bandwidth="128000" audioSamplingRate="44100">
      <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="${channels}" />
      <SegmentTemplate timescale="1000000" duration="5000000" initialization="${host}/segment/lofi/track${index}_init.mp4" media="${host}/segment/lofi/track${index}_$Number$.m4s" startNumber="1" />
    </Representation>
  </AdaptationSet>
</Period>`;

const mpdXml = (periods) => `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-live:2011" type="static" mediaPresentationDuration="PT5M5.5S">
${periods.join('\n')}
</MPD>`;

const liveMpd = mpdXml([period(0, 'PT3M0.5S'), period(1, 'PT2M5.0S', { channels: '6' })]);
const sources = ['Album/01_First.mp3', 'Album/02_Second.flac'];

const track = (id, duration, overrides = {}) => ({
    id, source: `${id}.mp3`, title: id, duration, audioChannels: '2', timescale: 1000000, segmentDuration: 5000000, encodedAt: null, ...overrides,
});

beforeEach(() => {
    process.env.BACKEND_URL = 'https://radio.test/api';
});

describe('parseChannelMpd', () => {
    it('extracts each period with its duration in seconds and segment template', async () => {
        const { periods, mediaPresentationDuration } = await parseChannelMpd(liveMpd);

        expect(mediaPresentationDuration).toBe('PT5M5.5S');
        expect(periods).toHaveLength(2);
        expect(periods[1]).toEqual({
            id: 'track1',
            duration: 125,
            audioChannels: '6',
            audioChannelScheme: 'urn:mpeg:dash:23003:3:audio_channel_configuration:2011',
            timescale: 1000000,
            segmentDuration: 5000000,
            initialization: 'https://radio.test/api/segment/lofi/track1_init.mp4',
            media: 'https://radio.test/api/segment/lofi/track1_$Number$.m4s',
        });
    });
});

describe('stripAudioExtension / titleFromSource', () => {
    it('strips only known audio extensions', () => {
        expect(stripAudioExtension('Session 01 - Asteroid Blues.m4a')).toBe('Session 01 - Asteroid Blues');
        expect(stripAudioExtension('Live @ Vénus Noire (2012) - part 1')).toBe('Live @ Vénus Noire (2012) - part 1');
    });

    it('derives a title from the file name without its folder', () => {
        expect(titleFromSource('Album/01_First.mp3')).toBe('01 First');
    });
});

describe('bootstrapManifest', () => {
    it('maps sources by listing order and keeps the tracks.json titles', async () => {
        const { periods } = await parseChannelMpd(liveMpd);

        const { manifest, warnings } = bootstrapManifest({
            channel: 'lofi', periods, sources, trackList: ['Hand-written title', 'Second.flac'],
        });

        expect(warnings).toEqual([]);
        expect(manifest.channel).toBe('lofi');
        expect(manifest.tracks.map((t) => [t.id, t.source, t.title, t.audioChannels])).toEqual([
            ['track0', 'Album/01_First.mp3', 'Hand-written title', '2'],
            ['track1', 'Album/02_Second.flac', 'Second', '6'],
        ]);
    });

    it('leaves sources unmapped and derives titles when the counts do not match', async () => {
        const { periods } = await parseChannelMpd(liveMpd);

        const { manifest, warnings } = bootstrapManifest({
            channel: 'lofi', periods, sources: sources.slice(0, 1), trackList: ['Only one title'],
        });

        expect(manifest.tracks.map((t) => [t.source, t.title])).toEqual([[null, 'track0'], [null, 'track1']]);
        expect(warnings).toEqual([
            'The MPD has 2 tracks but the source bucket has 1 files: sources left unmapped',
            'tracks.json has 1 titles for 2 tracks: titles derived from file names instead',
        ]);
    });

    it('dates every track with the MPD upload date when given', async () => {
        const { periods } = await parseChannelMpd(liveMpd);

        const { manifest } = bootstrapManifest({ channel: 'lofi', periods, sources, trackList: null, encodedAt: '2026-01-01T00:00:00.000Z' });

        expect(manifest.tracks.map((t) => t.encodedAt)).toEqual(['2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
    });

    it('derives titles from mapped sources when there is no tracks.json', async () => {
        const { periods } = await parseChannelMpd(liveMpd);

        const { manifest, warnings } = bootstrapManifest({ channel: 'lofi', periods, sources, trackList: null });

        expect(buildTrackList(manifest)).toEqual(['01 First', '02 Second']);
        expect(warnings).toEqual(['No tracks.json: titles derived from file names']);
    });
});

describe('buildChannelMpd', () => {
    it('reproduces the periods of the MPD it was bootstrapped from', async () => {
        const mpd = await parseChannelMpd(liveMpd);
        const { manifest } = bootstrapManifest({ channel: 'lofi', periods: mpd.periods, sources, trackList: null });

        const rebuilt = await parseChannelMpd(buildChannelMpd(manifest));

        expect(rebuilt.periods).toEqual(mpd.periods);
        expect(rebuilt.mediaPresentationDuration).toBe('PT0H5M5.5S');
        expect(await compareManifestWithMpd(manifest, mpd)).toEqual([]);
    });
});

describe('compareManifestWithMpd', () => {
    it('reports tracks whose segment URLs point to another host', async () => {
        const mpd = await parseChannelMpd(mpdXml([period(0, 'PT3M0.5S', { host: 'https://old.test/api' }), period(1, 'PT2M5.0S')]));
        const { manifest } = bootstrapManifest({ channel: 'lofi', periods: mpd.periods, sources, trackList: null });

        const differences = await compareManifestWithMpd(manifest, mpd);

        expect(differences.map((d) => [d.index, d.field])).toEqual([[0, 'initialization'], [0, 'media']]);
        expect(differences.every(isUrlDifference)).toBe(true);
    });

    it('reports a different track count and changed durations', async () => {
        const mpd = await parseChannelMpd(liveMpd);
        const manifest = { channel: 'lofi', tracks: [track('track0', 170)] };

        const differences = await compareManifestWithMpd(manifest, mpd);

        expect(differences).toEqual([
            { index: null, field: 'trackCount', before: 2, after: 1 },
            { index: 0, field: 'duration', before: 180.5, after: 170 },
        ]);
    });
});

describe('describeTracks', () => {
    it('computes each start time and the track playing now', () => {
        const manifest = { tracks: [track('track0', 100), track('track1', 50)] };
        // Two full loops plus 120 seconds: 20 seconds into the second track
        const now = PLAYLIST_START + 2 * 150 + 120;

        const { rows, total, current, position } = describeTracks(manifest, now);

        expect(rows.map((r) => r.start)).toEqual([0, 100]);
        expect(total).toBe(150);
        expect(current.id).toBe('track1');
        expect(position).toBe(120);
    });
});

describe('compareWithSources', () => {
    it('lists bucket files not in the channel and tracks whose source is gone', () => {
        const manifest = { tracks: [track('track0', 10), track('track1', 10), track('track2', 10, { source: null })] };

        const result = compareWithSources(manifest, ['track0.mp3', 'new.mp3']);

        expect(result.unmapped).toBe(1);
        expect(result.unencoded).toEqual(['new.mp3']);
        expect(result.missing.map((t) => t.id)).toEqual(['track1']);
    });

    it('does not report every file as new when no source is mapped', () => {
        const manifest = { tracks: [track('track0', 10, { source: null })] };

        expect(compareWithSources(manifest, ['a.mp3']).unencoded).toEqual([]);
    });
});

describe('expectedSegmentCount', () => {
    it('rounds up to whole 5 second segments', () => {
        expect(expectedSegmentCount(track('t', 305))).toBe(61);
        expect(expectedSegmentCount(track('t', 304.9))).toBe(61);
        expect(expectedSegmentCount(track('t', 305.1))).toBe(62);
    });
});

describe('findSegmentProblems', () => {
    it('reports missing init and media segments, and segments no track uses', () => {
        const manifest = { tracks: [track('track0', 12), track('track1', 10), track('track2', 5)] };
        const names = [
            'track0_init.mp4', 'track0_1.m4s', 'track0_3.m4s',
            'track1_init.mp4', 'track1_1.m4s', 'track1_2.m4s', 'track1_3.m4s',
            'track2_1.m4s',
            'track10_init.mp4', 'track9_init.mp4',
        ];

        const { problems, orphanPrefixes } = findSegmentProblems(manifest, names);

        expect(problems).toEqual([
            { index: 0, id: 'track0', title: 'track0', hasInit: true, expected: 3, missing: [2] },
            { index: 2, id: 'track2', title: 'track2', hasInit: false, expected: 1, missing: [] },
        ]);
        expect(orphanPrefixes).toEqual(['track9', 'track10']);
    });
});

describe('loadChannelManifest', () => {
    it('returns the saved manifest when there is one', async () => {
        const saved = { version: 1, channel: 'lofi', tracks: [] };
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(saved);

        const result = await loadChannelManifest('lofi');

        expect(result).toEqual({ manifest: saved, persisted: true, warnings: [] });
        expect(mpdRepository.getMpdContent).not.toHaveBeenCalled();
    });

    it('derives the manifest from the live MPD when none is saved', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(null);
        vi.mocked(mpdRepository.getMpdContent).mockResolvedValue(liveMpd);
        vi.mocked(mpdRepository.getMpdStat).mockResolvedValue({ lastModified: new Date('2026-02-01T10:00:00Z') });
        vi.mocked(mpdRepository.getTrackList).mockResolvedValue(['A', 'B']);
        vi.mocked(getTracks).mockResolvedValue(sources);

        const { manifest, persisted } = await loadChannelManifest('lofi');

        expect(persisted).toBe(false);
        expect(buildTrackList(manifest)).toEqual(['A', 'B']);
        expect(manifest.tracks[0].encodedAt).toBe('2026-02-01T10:00:00.000Z');
    });

    it('fails when the channel has no MPD', async () => {
        vi.mocked(mpdRepository.getChannelManifest).mockResolvedValue(null);
        vi.mocked(mpdRepository.getMpdContent).mockResolvedValue(null);
        vi.mocked(mpdRepository.getTrackList).mockResolvedValue(null);
        vi.mocked(getTracks).mockResolvedValue([]);

        await expect(loadChannelManifest('lofi')).rejects.toThrow('No MPD found for channel "lofi"');
    });
});

describe('parseEncodedTrackMpd', () => {
    it('reads the duration from the MPD and the template from the audio adaptation set', async () => {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT2M12.0S">
  <Period id="0" start="PT0.0S">
    <AdaptationSet id="0" contentType="video">
      <Representation id="0" mimeType="video/mp4">
        <SegmentTemplate timescale="90000" duration="450000" initialization="t_init.mp4" media="t_$Number$.m4s" startNumber="1" />
      </Representation>
    </AdaptationSet>
    <AdaptationSet id="1" contentType="audio">
      <Representation id="1" mimeType="audio/mp4">
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="6" />
        <SegmentTemplate timescale="1000000" duration="5000000" initialization="t_init.mp4" media="t_$Number$.m4s" startNumber="1" />
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;

        expect(await parseEncodedTrackMpd(xml)).toEqual({ duration: 132, audioChannels: '6', timescale: 1000000, segmentDuration: 5000000 });
    });
});

describe('isOutdated', () => {
    it('flags tracks encoded before loudness normalization or with no date', () => {
        expect(isOutdated(track('t', 1, { encodedAt: '2026-03-01T00:00:00.000Z' }))).toBe(true);
        expect(isOutdated(track('t', 1, { encodedAt: null }))).toBe(true);
        expect(isOutdated(track('t', 1, { encodedAt: '2026-04-01T00:00:00.000Z' }))).toBe(false);
    });
});

describe('nextTrackId', () => {
    it('continues after the highest track number, whatever the order', () => {
        expect(nextTrackId({ tracks: [track('track4', 1), track('track11', 1), track('custom', 1)] })).toBe('track12');
        expect(nextTrackId({ tracks: [] })).toBe('track0');
    });
});

describe('insertTrack', () => {
    const manifest = { tracks: [track('track0', 1, { source: 'b.mp3' }), track('track1', 1, { source: 'd.mp3' })] };
    const added = track('track2', 1, { source: 'c.mp3' });

    it('appends by default', () => {
        expect(insertTrack(manifest, added).tracks.map((t) => t.id)).toEqual(['track0', 'track1', 'track2']);
    });

    it('inserts in source order when sorted, without touching the original', () => {
        expect(insertTrack(manifest, added, { sorted: true }).tracks.map((t) => t.id)).toEqual(['track0', 'track2', 'track1']);
        expect(manifest.tracks).toHaveLength(2);
    });
});

describe('parseTrackSelection', () => {
    it('expands numbers and ranges into sorted unique indices', () => {
        expect(parseTrackSelection(['55-57', '3', '56'], 100)).toEqual([3, 55, 56, 57]);
    });

    it('rejects invalid or out of range selections', () => {
        expect(() => parseTrackSelection(['abc'], 10)).toThrow('Invalid track number or range: "abc"');
        expect(() => parseTrackSelection(['8-12'], 10)).toThrow('outside the channel (tracks 0 to 9)');
        expect(() => parseTrackSelection(['5-2'], 10)).toThrow('outside the channel');
    });
});

describe('applyManifestEdits', () => {
    const saved = { version: 1, channel: 'lofi', tracks: [track('track0', 10), track('track1', 20), track('track2', 30)] };

    it('applies reordering, removals, titles and sources but keeps the encoding fields', () => {
        const edited = {
            channel: 'lofi',
            tracks: [
                { ...track('track2', 999), title: 'Renamed', source: 'new.mp3', duration: 999 },
                { id: 'track0', title: 'track0' },
            ],
        };

        const result = applyManifestEdits(saved, edited);

        expect(result.tracks.map((t) => [t.id, t.title, t.source, t.duration])).toEqual([
            ['track2', 'Renamed', 'new.mp3', 30],
            ['track0', 'track0', 'track0.mp3', 10],
        ]);
    });

    it('rejects unknown, duplicated or untitled tracks and another channel', () => {
        const edited = { tracks: [{ id: 'track9', title: 'x' }, { id: 'track0', title: '' }, { id: 'track0', title: 'y' }] };

        expect(() => applyManifestEdits(saved, edited)).toThrow(/unknown track id "track9"[\s\S]*"track0" has no title[\s\S]*"track0" is listed twice/);
        expect(() => applyManifestEdits(saved, { channel: 'opera', tracks: [] })).toThrow('is for channel "opera"');
        expect(() => applyManifestEdits(saved, { tracks: [] })).toThrow('has no tracks');
    });
});
