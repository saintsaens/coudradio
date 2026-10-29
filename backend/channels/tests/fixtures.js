// MPD and track fixtures shared by the channel tests
export const period = (index, duration, { host = 'https://radio.test/api', channels = '2' } = {}) => `
<Period id="track${index}" duration="${duration}">
  <AdaptationSet id="${index}" contentType="audio" startWithSAP="1" segmentAlignment="true" bitstreamSwitching="true">
    <Representation id="track${index}" mimeType="audio/mp4" codecs="mp4a.40.2" bandwidth="128000" audioSamplingRate="44100">
      <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="${channels}" />
      <SegmentTemplate timescale="1000000" duration="5000000" initialization="${host}/segment/lofi/track${index}_init.mp4" media="${host}/segment/lofi/track${index}_$Number$.m4s" startNumber="1" />
    </Representation>
  </AdaptationSet>
</Period>`;

export const mpdXml = (periods) => `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-live:2011" type="static" mediaPresentationDuration="PT5M5.5S">
${periods.join('\n')}
</MPD>`;

export const liveMpd = mpdXml([period(0, 'PT3M0.5S'), period(1, 'PT2M5.0S', { channels: '6' })]);
export const sources = ['Album/01_First.mp3', 'Album/02_Second.flac'];

export const track = (id, duration, overrides = {}) => ({
    id, source: `${id}.mp3`, title: id, duration, audioChannels: '2', timescale: 1000000, segmentDuration: 5000000, encodedAt: null, ...overrides,
});
