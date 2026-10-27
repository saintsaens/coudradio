import { secondsToIso8601Duration } from './durations.js';
import { getTotalDuration } from '../manifest/manifest.js';

const AUDIO_CHANNEL_SCHEME = 'urn:mpeg:dash:23003:3:audio_channel_configuration:2011';

const MPD_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
    <MPD xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="urn:mpeg:dash:schema:mpd:2011"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
    profiles="urn:mpeg:dash:profile:isoff-live:2011"
    type="static"`;

const createPeriod = ({ id, adaptationSetId, duration, audioChannelConfiguration, timescale, segmentTemplateDuration, initialization, media }) => {
    return `<Period id="${id}" duration="${duration}">
  <AdaptationSet id="${adaptationSetId}" contentType="audio" startWithSAP="1" segmentAlignment="true" bitstreamSwitching="true">
    <Representation id="${id}" mimeType="audio/mp4" codecs="mp4a.40.2" bandwidth="128000" audioSamplingRate="44100">
      ${audioChannelConfiguration}
      <SegmentTemplate
        timescale="${timescale}"
        duration="${segmentTemplateDuration}"
        initialization="${initialization}"
        media="${media}"
        startNumber="1" />
    </Representation>
  </AdaptationSet>
</Period>`;
};

const createInitSegmentRoute = (segmentPrefix, channel) => {
    return `${process.env.BACKEND_URL}/segment/${channel}/${segmentPrefix}_init.mp4`;
};

const createMediaSegmentRoute = (segmentPrefix, channel) => {
    return `${process.env.BACKEND_URL}/segment/${channel}/${segmentPrefix}_$Number$.m4s`;
};

export const buildChannelMpd = (manifest) => {
    const totalDuration = secondsToIso8601Duration(getTotalDuration(manifest));
    const header = `${MPD_HEADER}
        mediaPresentationDuration="${totalDuration}">`;

    const periods = manifest.tracks.map((track, index) => createPeriod({
        id: track.id,
        adaptationSetId: index,
        duration: secondsToIso8601Duration(track.duration),
        audioChannelConfiguration: `<AudioChannelConfiguration schemeIdUri="${AUDIO_CHANNEL_SCHEME}" value="${track.audioChannels}" />`,
        timescale: track.timescale,
        segmentTemplateDuration: track.segmentDuration,
        initialization: createInitSegmentRoute(track.id, manifest.channel),
        media: createMediaSegmentRoute(track.id, manifest.channel),
    }));

    return [header, ...periods, '</MPD>'].join('\n');
};

export const buildTrackList = (manifest) => manifest.tracks.map((track) => track.title);
