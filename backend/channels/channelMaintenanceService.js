import * as mpdRepository from '../repositories/mpdRepository.js';
import { listSegmentNames } from '../repositories/segmentsRepository.js';
import { getTracks } from '../repositories/trackRepository.js';
import { processTracks } from './trackProcessingService.js';
import {
    applyManifestEdits,
    buildChannelMpd,
    buildTrackList,
    compareManifestWithMpd,
    compareWithSources,
    createManifest,
    findSegmentProblems,
    insertTrack,
    isOutdated,
    nextTrackId,
    parseChannelMpd,
    parseTrackSelection,
    titleFromSource,
} from './channelManifestService.js';

// Uploads channel.json, then the MPD and tracks.json generated from it. Segments must already be uploaded.
export const publishChannel = async (manifest) => {
    if (!manifest.tracks.length) {
        throw new Error(`Channel "${manifest.channel}" has no tracks, nothing to publish`);
    }
    const { channel } = manifest;
    await mpdRepository.uploadChannelManifest(channel, manifest);
    await mpdRepository.uploadMpd(Buffer.from(buildChannelMpd(manifest), 'utf-8'), `${channel}.mpd`, channel);
    await mpdRepository.uploadTrackList(channel, buildTrackList(manifest));
};

const loadSavedManifest = async (channel) => {
    const manifest = await mpdRepository.getChannelManifest(channel);
    if (!manifest) {
        throw new Error(`Channel "${channel}" has no channel.json: run "npm run channel -- bootstrap ${channel} --write" first`);
    }
    return manifest;
};

// A channel that has no MPD yet starts empty; an existing channel needs its channel.json
const loadManifestForWrite = async (channel) => {
    const manifest = await mpdRepository.getChannelManifest(channel);
    if (manifest) return manifest;
    if (await mpdRepository.getMpdStat(channel)) return loadSavedManifest(channel);
    return createManifest(channel);
};

const encodedFields = (encoding) => ({
    duration: encoding.duration,
    audioChannels: encoding.audioChannels,
    timescale: encoding.timescale,
    segmentDuration: encoding.segmentDuration,
    encodedAt: new Date().toISOString(),
});

const listChanges = (before, after) => {
    const changes = [];
    for (let index = 0; index < Math.max(before.length, after.length); index++) {
        if (before[index] !== after[index]) changes.push({ index, before: before[index], after: after[index] });
    }
    return changes;
};

// Regenerates the MPD and tracks.json from channel.json, or from an edited copy of it
export const syncChannel = async ({ channel, edited = null, dryRun = false }) => {
    const saved = await loadSavedManifest(channel);
    const manifest = edited ? applyManifestEdits(saved, edited) : saved;

    const [mpdXml, trackList] = await Promise.all([
        mpdRepository.getMpdContent(channel),
        mpdRepository.getTrackList(channel),
    ]);
    const differences = mpdXml
        ? await compareManifestWithMpd(manifest, await parseChannelMpd(mpdXml))
        : [{ index: null, field: 'mpd', before: null, after: 'generated' }];
    const titleChanges = listChanges(trackList ?? [], buildTrackList(manifest));
    const manifestChanged = JSON.stringify(manifest) !== JSON.stringify(saved);

    const upToDate = !differences.length && !titleChanges.length && !manifestChanged;
    if (!upToDate && !dryRun) await publishChannel(manifest);

    return { manifest, differences, titleChanges, manifestChanged, upToDate };
};

const selectNewSources = (manifest, sources, files) => {
    if (files.length) {
        const available = new Set(sources);
        const unknown = files.filter((file) => !available.has(file));
        if (unknown.length) throw new Error(`Not in the "${manifest.channel}" bucket: ${unknown.join(', ')}`);
        return [...new Set(files)];
    }
    if (!manifest.tracks.length) return sources;

    const { unmapped, unencoded } = compareWithSources(manifest, sources);
    if (unmapped) {
        throw new Error(`${unmapped} tracks of "${manifest.channel}" have no source file, so new files cannot be told apart from them: name the files to add`);
    }
    return unencoded;
};

// Encodes source files that are not in the channel yet and appends them (or inserts them in source order).
// channel.json is saved after each track, so an interrupted run resumes where it stopped.
export const addTracks = async ({ channel, files = [], sorted = false, dryRun = false }) => {
    let manifest = await loadManifestForWrite(channel);
    const sources = await getTracks(channel);

    const alreadyAdded = new Set(manifest.tracks.map((track) => track.source).filter(Boolean));
    const selected = selectNewSources(manifest, sources, files);
    const skipped = selected.filter((source) => alreadyAdded.has(source));
    const firstNumber = Number(nextTrackId(manifest).slice('track'.length));
    const jobs = selected
        .filter((source) => !alreadyAdded.has(source))
        .map((source, index) => ({ id: `track${firstNumber + index}`, source }));

    if (dryRun || !jobs.length) return { jobs, skipped, added: [], failed: [] };

    const added = [];
    const { failed } = await processTracks({
        channelName: channel,
        jobs,
        onTrackDone: async (job, encoding) => {
            const track = { id: job.id, source: job.source, title: titleFromSource(job.source), ...encodedFields(encoding) };
            manifest = insertTrack(manifest, track, { sorted });
            await mpdRepository.uploadChannelManifest(channel, manifest);
            added.push(track);
        },
    });

    if (added.length) await publishChannel(manifest);
    return { jobs, skipped, added, failed };
};

const selectTracksToReencode = async (manifest, { args, missing, outdated, all }) => {
    if (all) return manifest.tracks.map((_, index) => index);

    const indices = new Set(parseTrackSelection(args, manifest.tracks.length));
    if (outdated) {
        manifest.tracks.forEach((track, index) => isOutdated(track) && indices.add(index));
    }
    if (missing) {
        const { problems } = findSegmentProblems(manifest, await listSegmentNames(manifest.channel));
        problems.forEach((problem) => indices.add(problem.index));
    }
    return [...indices].sort((a, b) => a - b);
};

// Re-encodes tracks from their source file in place (same segment names), then republishes the channel.
// Unless forced, a track whose new duration does not match is left untouched.
export const reencodeTracks = async ({ channel, args = [], missing = false, outdated = false, all = false, force = false, dryRun = false }) => {
    let manifest = await loadSavedManifest(channel);
    const indices = await selectTracksToReencode(manifest, { args, missing, outdated, all });

    const withoutSource = indices.filter((index) => !manifest.tracks[index].source);
    if (withoutSource.length) {
        throw new Error(`These tracks have no source file to re-encode from: ${withoutSource.map((index) => `#${index}`).join(', ')}`);
    }

    const jobs = indices.map((index) => {
        const track = manifest.tracks[index];
        return { index, id: track.id, source: track.source, expectedDuration: force ? undefined : track.duration };
    });
    if (dryRun || !jobs.length) return { jobs, reencoded: [], failed: [] };

    const reencoded = [];
    const { failed } = await processTracks({
        channelName: channel,
        jobs,
        onTrackDone: async (job, encoding) => {
            manifest = {
                ...manifest,
                tracks: manifest.tracks.map((track) => (track.id === job.id ? { ...track, ...encodedFields(encoding) } : track)),
            };
            await mpdRepository.uploadChannelManifest(channel, manifest);
            reencoded.push(job);
        },
    });

    if (reencoded.length) await publishChannel(manifest);
    return { jobs, reencoded, failed };
};
