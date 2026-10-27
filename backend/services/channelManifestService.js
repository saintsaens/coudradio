import path from 'path';
import xml2js from 'xml2js';
import * as mpdRepository from '../repositories/mpdRepository.js';
import { getTracks, ALLOWED_EXTENSIONS } from '../repositories/trackRepository.js';
import { createChannelMpdHeader, createChannelMpdFooter } from './channelCreationService/channelMpdService.js';
import {
    createPeriod,
    createInitSegmentRoute,
    createMediaSegmentRoute,
    iso8601DurationToSeconds,
    secondsToIso8601Duration,
} from './mpdService.js';
import { PLAYLIST_START } from './metadataService.js';

export const MANIFEST_VERSION = 1;
const AUDIO_CHANNEL_SCHEME = 'urn:mpeg:dash:23003:3:audio_channel_configuration:2011';
const URL_FIELDS = ['initialization', 'media'];
const COMPARED_FIELDS = ['id', 'timescale', 'segmentDuration', 'audioChannels', 'audioChannelScheme', ...URL_FIELDS];

export const parseChannelMpd = async (xml) => {
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
    const periods = [].concat(result.MPD.Period ?? []);

    return {
        mediaPresentationDuration: result.MPD.mediaPresentationDuration ?? null,
        periods: periods.map((period) => {
            const adaptationSet = [].concat(period.AdaptationSet).find((set) => set.contentType === 'audio');
            const representation = adaptationSet.Representation;
            const template = representation.SegmentTemplate;
            const audioChannelConfiguration = representation.AudioChannelConfiguration;
            return {
                id: period.id,
                duration: iso8601DurationToSeconds(period.duration),
                audioChannels: audioChannelConfiguration?.value ?? null,
                audioChannelScheme: audioChannelConfiguration?.schemeIdUri ?? null,
                timescale: Number(template.timescale),
                segmentDuration: Number(template.duration),
                initialization: template.initialization,
                media: template.media,
            };
        }),
    };
};

export const stripAudioExtension = (name) => {
    const extension = path.extname(name);
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase()) ? name.slice(0, -extension.length) : name;
};

export const titleFromSource = (source) => path.basename(source, path.extname(source)).replace(/_/g, ' ');

// Maps the periods of an existing channel MPD to a manifest. Periods were encoded in source bucket listing
// order, so sources can only be mapped when the bucket still holds exactly as many files as there are periods.
export const bootstrapManifest = ({ channel, periods, sources, trackList }) => {
    const warnings = [];

    const sourcesMatch = Array.isArray(sources) && sources.length === periods.length;
    if (!Array.isArray(sources)) {
        warnings.push(`Could not list the source bucket "${channel}": sources left unmapped`);
    } else if (!sourcesMatch) {
        warnings.push(`The MPD has ${periods.length} tracks but the source bucket has ${sources.length} files: sources left unmapped`);
    }

    const titlesMatch = Array.isArray(trackList) && trackList.length === periods.length;
    if (!trackList) {
        warnings.push('No tracks.json: titles derived from file names');
    } else if (!titlesMatch) {
        warnings.push(`tracks.json has ${trackList.length} titles for ${periods.length} tracks: titles derived from file names instead`);
    }

    const tracks = periods.map((period, index) => {
        const source = sourcesMatch ? sources[index] : null;
        let title = period.id;
        if (titlesMatch) title = stripAudioExtension(trackList[index]);
        else if (source) title = titleFromSource(source);

        return {
            id: period.id,
            source,
            title,
            duration: period.duration,
            audioChannels: period.audioChannels,
            timescale: period.timescale,
            segmentDuration: period.segmentDuration,
            encodedAt: null,
        };
    });

    return { manifest: { version: MANIFEST_VERSION, channel, tracks }, warnings };
};

export const getTotalDuration = (manifest) => manifest.tracks.reduce((total, track) => total + track.duration, 0);

export const buildChannelMpd = (manifest) => {
    const totalDuration = secondsToIso8601Duration(getTotalDuration(manifest));
    const header = createChannelMpdHeader().replace(
        /type="static">/,
        `type="static"
        mediaPresentationDuration="${totalDuration}">`
    );

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

    return [header, ...periods, createChannelMpdFooter()].join('\n');
};

export const buildTrackList = (manifest) => manifest.tracks.map((track) => track.title);

// Lists every period that would change if the MPD were regenerated from the manifest
export const compareManifestWithMpd = async (manifest, mpd) => {
    const generated = await parseChannelMpd(buildChannelMpd(manifest));
    const differences = [];

    if (generated.periods.length !== mpd.periods.length) {
        differences.push({ index: null, field: 'trackCount', before: mpd.periods.length, after: generated.periods.length });
    }

    generated.periods.forEach((after, index) => {
        const before = mpd.periods[index];
        if (!before) return;
        for (const field of COMPARED_FIELDS) {
            if (after[field] !== before[field]) {
                differences.push({ index, field, before: before[field], after: after[field] });
            }
        }
        if (Math.abs(after.duration - before.duration) > 0.0005) {
            differences.push({ index, field: 'duration', before: before.duration, after: after.duration });
        }
    });

    return differences;
};

export const isUrlDifference = (difference) => URL_FIELDS.includes(difference.field);

export const bootstrapChannel = async (channel) => {
    const [mpdXml, trackList, sources] = await Promise.all([
        mpdRepository.getMpdContent(channel),
        mpdRepository.getTrackList(channel),
        getTracks(channel).catch(() => null),
    ]);
    if (!mpdXml) {
        throw new Error(`No MPD found for channel "${channel}"`);
    }

    const mpd = await parseChannelMpd(mpdXml);
    const { manifest, warnings } = bootstrapManifest({ channel, periods: mpd.periods, sources, trackList });
    const differences = await compareManifestWithMpd(manifest, mpd);
    return { manifest, warnings, differences };
};

// Uses the saved manifest when there is one, otherwise derives it from the live MPD without saving it
export const loadChannelManifest = async (channel) => {
    const manifest = await mpdRepository.getChannelManifest(channel);
    if (manifest) {
        return { manifest, persisted: true, warnings: [] };
    }

    const { manifest: bootstrapped, warnings } = await bootstrapChannel(channel);
    return { manifest: bootstrapped, persisted: false, warnings };
};

export const describeTracks = (manifest, nowSeconds = Date.now() / 1000) => {
    let start = 0;
    const rows = manifest.tracks.map((track, index) => {
        const row = { ...track, index, start };
        start += track.duration;
        return row;
    });

    const total = start;
    const position = total > 0 ? (nowSeconds - PLAYLIST_START) % total : 0;
    const current = rows.findLast((row) => row.start <= position) ?? null;

    return { rows, total, current, position };
};

export const compareWithSources = (manifest, sources) => {
    const mapped = manifest.tracks.filter((track) => track.source);
    const mappedSources = new Set(mapped.map((track) => track.source));
    const available = new Set(sources);

    return {
        unmapped: manifest.tracks.length - mapped.length,
        unencoded: mapped.length > 0 ? sources.filter((source) => !mappedSources.has(source)) : [],
        missing: mapped.filter((track) => !available.has(track.source)),
    };
};

export const expectedSegmentCount = (track) =>
    Math.ceil(track.duration / (track.segmentDuration / track.timescale) - 1e-6);

export const findSegmentProblems = (manifest, segmentNames) => {
    const byPrefix = new Map();
    for (const name of segmentNames) {
        const match = name.match(/^(.+?)_(init\.mp4|(\d+)\.m4s)$/);
        if (!match) continue;
        const entry = byPrefix.get(match[1]) ?? { init: false, numbers: new Set() };
        if (match[3]) entry.numbers.add(Number(match[3]));
        else entry.init = true;
        byPrefix.set(match[1], entry);
    }

    const problems = manifest.tracks
        .map((track, index) => {
            const found = byPrefix.get(track.id) ?? { init: false, numbers: new Set() };
            const expected = expectedSegmentCount(track);
            const missing = [];
            for (let number = 1; number <= expected; number++) {
                if (!found.numbers.has(number)) missing.push(number);
            }
            return { index, id: track.id, title: track.title, hasInit: found.init, expected, missing };
        })
        .filter((track) => !track.hasInit || track.missing.length > 0);

    const knownIds = new Set(manifest.tracks.map((track) => track.id));
    const orphanPrefixes = [...byPrefix.keys()]
        .filter((prefix) => !knownIds.has(prefix))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return { problems, orphanPrefixes };
};
