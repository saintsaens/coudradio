import { describe, it, expect, beforeEach } from 'vitest';
import { buildChannelMpd } from '../../mpd/build.js';
import { parseChannelMpd } from '../../mpd/parse.js';
import { bootstrapManifest } from '../../manifest/manifest.js';
import { compareManifestWithMpd } from '../../manifest/checks.js';
import { liveMpd, sources } from '../fixtures.js';

beforeEach(() => {
    process.env.BACKEND_URL = 'https://radio.test/api';
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
