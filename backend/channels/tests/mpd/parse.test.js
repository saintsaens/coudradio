import { describe, it, expect } from 'vitest';
import { parseChannelMpd, parseEncodedTrackMpd } from '../../mpd/parse.js';
import { liveMpd } from '../fixtures.js';

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
