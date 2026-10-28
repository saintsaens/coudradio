import { describe, it, expect } from 'vitest';
import {
    applyManifestEdits,
    bootstrapManifest,
    describeTracks,
    insertTrack,
    isOutdated,
    nextTrackId,
    parseTrackSelection,
    stripAudioExtension,
    titleFromSource,
} from '../../manifest/manifest.js';
import { buildTrackList } from '../../mpd/build.js';
import { parseChannelMpd } from '../../mpd/parse.js';
import { PLAYLIST_START } from '../../../utils/playlistClock.js';
import { liveMpd, sources, track } from '../fixtures.js';

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
