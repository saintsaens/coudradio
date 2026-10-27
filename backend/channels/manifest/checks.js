import { buildChannelMpd } from '../mpd/build.js';
import { parseChannelMpd } from '../mpd/parse.js';

const URL_FIELDS = ['initialization', 'media'];
const COMPARED_FIELDS = ['id', 'timescale', 'segmentDuration', 'audioChannels', 'audioChannelScheme', ...URL_FIELDS];

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
