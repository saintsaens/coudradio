import { describe, it, expect, beforeEach } from 'vitest';
import {
    compareManifestWithMpd,
    compareWithSources,
    expectedSegmentCount,
    findSegmentProblems,
    isUrlDifference,
} from '../../manifest/checks.js';
import { bootstrapManifest } from '../../manifest/manifest.js';
import { parseChannelMpd } from '../../mpd/parse.js';
import { liveMpd, mpdXml, period, sources, track } from '../fixtures.js';

beforeEach(() => {
    process.env.BACKEND_URL = 'https://radio.test/api';
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

    it('reports segments past a track duration, but not a single trailing one', () => {
        const manifest = { tracks: [track('track0', 10), track('track1', 10)] };
        const names = [
            'track0_init.mp4', 'track0_1.m4s', 'track0_2.m4s', 'track0_3.m4s', 'track0_4.m4s', 'track0_5.m4s',
            'track1_init.mp4', 'track1_1.m4s', 'track1_2.m4s', 'track1_3.m4s',
        ];

        const { problems, pastDuration } = findSegmentProblems(manifest, names);

        expect(problems).toEqual([]);
        expect(pastDuration).toEqual([{ index: 0, id: 'track0', title: 'track0', expected: 2, extra: [3, 4, 5] }]);
    });
});
