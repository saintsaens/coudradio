import xml2js from 'xml2js';
import { iso8601DurationToSeconds } from './durations.js';

const parseMpd = async (xml) => {
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
    return result.MPD;
};

const parseAudioRepresentation = (period) => {
    const adaptationSet = [].concat(period.AdaptationSet).find((set) => set.contentType === 'audio');
    const representation = [].concat(adaptationSet.Representation)[0];
    const template = representation.SegmentTemplate;
    const audioChannelConfiguration = representation.AudioChannelConfiguration;
    return {
        audioChannels: audioChannelConfiguration?.value ?? null,
        audioChannelScheme: audioChannelConfiguration?.schemeIdUri ?? null,
        timescale: Number(template.timescale),
        segmentDuration: Number(template.duration),
        initialization: template.initialization,
        media: template.media,
    };
};

export const parseChannelMpd = async (xml) => {
    const mpd = await parseMpd(xml);
    const periods = [].concat(mpd.Period ?? []);

    return {
        mediaPresentationDuration: mpd.mediaPresentationDuration ?? null,
        periods: periods.map((period) => ({
            id: period.id,
            duration: iso8601DurationToSeconds(period.duration),
            ...parseAudioRepresentation(period),
        })),
    };
};

// Reads the single-track MPD written by ffmpeg, whose period has no duration of its own
export const parseEncodedTrackMpd = async (xml) => {
    const mpd = await parseMpd(xml);
    const { audioChannels, timescale, segmentDuration } = parseAudioRepresentation([].concat(mpd.Period)[0]);
    return {
        duration: iso8601DurationToSeconds(mpd.mediaPresentationDuration),
        audioChannels,
        timescale,
        segmentDuration,
    };
};
