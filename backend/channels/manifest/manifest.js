import path from 'path';
import { ALLOWED_EXTENSIONS } from '../../utils/audioExtensions.js';
import { PLAYLIST_START } from '../../utils/playlistClock.js';

export const MANIFEST_VERSION = 1;
// Tracks encoded before this date were not loudness-normalized
export const LOUDNORM_DATE = new Date('2026-03-29');

export const stripAudioExtension = (name) => {
    const extension = path.extname(name);
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase()) ? name.slice(0, -extension.length) : name;
};

export const titleFromSource = (source) => path.basename(source, path.extname(source)).replace(/_/g, ' ');

// Maps the periods of an existing channel MPD to a manifest. Periods were encoded in source bucket listing
// order, so sources can only be mapped when the bucket still holds exactly as many files as there are periods.
// encodedAt is the MPD's upload date: every track in it was encoded at that date or before.
export const bootstrapManifest = ({ channel, periods, sources, trackList, encodedAt = null }) => {
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
            encodedAt,
        };
    });

    return { manifest: { version: MANIFEST_VERSION, channel, tracks }, warnings };
};

export const getTotalDuration = (manifest) => manifest.tracks.reduce((total, track) => total + track.duration, 0);

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

export const isOutdated = (track) => !track.encodedAt || new Date(track.encodedAt) < LOUDNORM_DATE;

export const nextTrackId = (manifest) => {
    const numbers = manifest.tracks
        .map((track) => track.id.match(/^track(\d+)$/))
        .filter(Boolean)
        .map((match) => Number(match[1]));
    return `track${numbers.length ? Math.max(...numbers) + 1 : 0}`;
};

export const createManifest = (channel) => ({ version: MANIFEST_VERSION, channel, tracks: [] });

// Appends the track, or with sorted inserts it before the first track whose source sorts after its own
export const insertTrack = (manifest, track, { sorted = false } = {}) => {
    const tracks = [...manifest.tracks];
    const position = sorted
        ? tracks.findIndex((other) => other.source && other.source.localeCompare(track.source) > 0)
        : -1;
    tracks.splice(position === -1 ? tracks.length : position, 0, track);
    return { ...manifest, tracks };
};

// Turns arguments like "3" or "52-60" into sorted track indices
export const parseTrackSelection = (args, trackCount) => {
    const indices = new Set();
    for (const arg of args) {
        const match = arg.match(/^(\d+)(?:-(\d+))?$/);
        if (!match) throw new Error(`Invalid track number or range: "${arg}"`);
        const from = Number(match[1]);
        const to = Number(match[2] ?? match[1]);
        if (from > to || to >= trackCount) {
            throw new Error(`Track range "${arg}" is outside the channel (tracks 0 to ${trackCount - 1})`);
        }
        for (let index = from; index <= to; index++) indices.add(index);
    }
    return [...indices].sort((a, b) => a - b);
};

const EDITABLE_FIELDS = ['title', 'source'];

// Applies a hand-edited copy of the manifest: tracks can be reordered, removed, retitled or given a source.
// Everything else comes from the saved manifest, since it describes segments that already exist.
export const applyManifestEdits = (saved, edited) => {
    if (!Array.isArray(edited?.tracks)) throw new Error('The edited manifest has no "tracks" list');
    if (edited.channel !== undefined && edited.channel !== saved.channel) {
        throw new Error(`The edited manifest is for channel "${edited.channel}", not "${saved.channel}"`);
    }

    const savedById = new Map(saved.tracks.map((track) => [track.id, track]));
    const seen = new Set();
    const errors = [];
    const tracks = edited.tracks.map((track, index) => {
        const original = savedById.get(track?.id);
        if (!original) {
            errors.push(`#${index}: unknown track id "${track?.id}" (only tracks with encoded segments can be listed)`);
            return null;
        }
        if (seen.has(track.id)) errors.push(`#${index}: track "${track.id}" is listed twice`);
        seen.add(track.id);
        if (typeof track.title !== 'string' || !track.title.trim()) errors.push(`#${index}: "${track.id}" has no title`);
        if ('source' in track && track.source !== null && typeof track.source !== 'string') errors.push(`#${index}: "${track.id}" has an invalid source`);

        const updated = { ...original };
        for (const field of EDITABLE_FIELDS) {
            if (field in track) updated[field] = track[field];
        }
        return updated;
    });

    if (!tracks.length) errors.push('The edited manifest has no tracks');
    if (errors.length) throw new Error(`Invalid manifest:\n  ${errors.join('\n  ')}`);
    return { ...saved, tracks };
};
