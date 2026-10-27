#!/usr/bin/env node
import './loadEnv.js';
import fs from 'fs/promises';
import * as mpdRepository from '../repositories/mpdRepository.js';
import { listSegmentNames } from '../repositories/segmentsRepository.js';
import { getTracks } from '../repositories/trackRepository.js';
import {
    bootstrapChannel,
    compareManifestWithMpd,
    compareWithSources,
    describeTracks,
    findSegmentProblems,
    isOutdated,
    isUrlDifference,
    LOUDNORM_DATE,
    loadChannelManifest,
    parseChannelMpd,
} from './channelManifestService.js';
import { addTracks, reencodeTracks, syncChannel } from './channelMaintenanceService.js';

const USAGE = `Usage: npm run channel -- <command>

  status [channel…]                 Overview of every channel, or of the given ones
  tracks <channel> [--sources]      Tracklist with start times and what is playing now
  verify <channel>                  Checks the segments in MinIO and that the live MPD matches the channel
  bootstrap <channel…|--all> [--write] [--force]
                                    Creates channel.json from the live MPD (dry run unless --write)
  sync <channel…|--all> [--dry-run] Regenerates the MPD and tracks.json from channel.json
  sync <channel> --file <path>      Applies an edited channel.json (reorder, remove, retitle, set sources)
  export <channel> [path]           Saves channel.json locally for editing (default: ./<channel>.json)
  add <channel> [file…] [--sorted] [--dry-run]
                                    Encodes bucket files not in the channel yet and appends them
                                    (--sorted inserts them in source order). Creates the channel if needed
  reencode <channel> [#|from-to…] [--missing] [--outdated] [--all] [--force] [--dry-run]
                                    Re-encodes tracks from their source file: given numbers, tracks with
                                    missing segments, or tracks encoded before loudness normalization`;
const DIFFERENCE_LABELS = {
    initialization: 'init segment URL',
    media: 'media segment URL',
};

const formatClock = (seconds) => {
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
};

const formatDate = (date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

const formatList = (items, max = 10) =>
    items.length > max ? `${items.slice(0, max).join(', ')}, … (${items.length - max} more)` : items.join(', ');

const requireChannel = (channel) => {
    if (!channel) {
        console.error(USAGE);
        process.exit(1);
    }
};

const printManifestOrigin = (channel, manifest, persisted, warnings) => {
    const origin = persisted ? 'channel.json' : 'no channel.json yet, derived from the live MPD';
    console.log(`${channel}: ${manifest.tracks.length} tracks (${origin})`);
    warnings.forEach((warning) => console.log(`⚠ ${warning}`));
};

const printDifferences = (differences, indent = '', marker = '✗') => {
    const byField = new Map();
    for (const difference of differences) {
        byField.set(difference.field, [...(byField.get(difference.field) ?? []), difference]);
    }
    for (const [field, list] of byField) {
        const [first] = list;
        if (field === 'mpd') {
            console.log(`${indent}${marker} No MPD yet`);
            continue;
        }
        if (field === 'trackCount') {
            console.log(`${indent}${marker} The live MPD has ${first.before} tracks, the channel has ${first.after}`);
            continue;
        }
        const label = DIFFERENCE_LABELS[field] ?? field;
        console.log(`${indent}${marker} ${list.length} tracks differ in ${label}, e.g. #${first.index}: ${first.before} → ${first.after}`);
    }
};

const getChannelStatus = async (channel) => {
    const [stat, mpdXml, manifest, trackList, sources] = await Promise.all([
        mpdRepository.getMpdStat(channel),
        mpdRepository.getMpdContent(channel),
        mpdRepository.getChannelManifest(channel),
        mpdRepository.getTrackList(channel),
        getTracks(channel).catch(() => null),
    ]);
    const mpd = mpdXml ? await parseChannelMpd(mpdXml) : null;
    const trackCount = mpd ? mpd.periods.length : null;
    const hours = mpd ? mpd.periods.reduce((total, period) => total + period.duration, 0) / 3600 : null;

    const notes = [];
    if (!sources) notes.push('no source bucket');
    if (mpd && !trackList) notes.push('no tracks.json');
    if (mpd && trackList && trackList.length !== trackCount) notes.push(`tracks.json has ${trackList.length} titles`);
    if (manifest && sources) {
        const { unencoded, missing } = compareWithSources(manifest, sources);
        if (unencoded.length) notes.push(`${unencoded.length} new files`);
        if (missing.length) notes.push(`${missing.length} source files gone`);
    } else if (mpd && sources && sources.length !== trackCount) {
        notes.push(`bucket has ${sources.length} files`);
    }

    // Bootstrapped tracks carry the MPD upload date, so this matches the MPD date check until tracks get re-encoded
    const outdatedTracks = manifest
        ? manifest.tracks.filter(isOutdated).length
        : (stat && stat.lastModified < LOUDNORM_DATE ? trackCount : 0);

    return { channel, stat, trackCount, hours, hasManifest: Boolean(manifest), outdatedTracks, notes };
};

const status = async (channels) => {
    const targets = channels.length ? channels : await mpdRepository.listChannelNames();
    if (!targets.length) {
        console.log('No channels found.');
        return;
    }

    const results = (await Promise.all(targets.map(getChannelStatus)))
        .sort((a, b) => (b.hours ?? -1) - (a.hours ?? -1));

    const COL = { channel: 16, mpd: 11, updated: 13, duration: 10, tracks: 8, manifest: 10 };
    const header = ['Channel', 'MPD', 'Updated', 'Duration', 'Tracks', 'Manifest']
        .map((title, index) => title.padEnd(Object.values(COL)[index])).join('') + 'Notes';
    console.log(`\n${header}`);
    console.log('─'.repeat(header.length + 20));

    let needsReencode = false;
    for (const result of results) {
        const exists = Boolean(result.stat);
        const outdated = result.outdatedTracks > 0;
        needsReencode ||= outdated;
        if (outdated && result.outdatedTracks < result.trackCount) result.notes.push(`${result.outdatedTracks} tracks to re-encode`);
        console.log([
            result.channel.padEnd(COL.channel),
            (exists ? '✓ Ready' : '✗ Missing').padEnd(COL.mpd),
            (exists ? `${formatDate(result.stat.lastModified)}${outdated ? ' ⚠' : ''}` : '—').padEnd(COL.updated),
            (result.hours !== null ? `${result.hours.toFixed(1)}h` : '—').padEnd(COL.duration),
            String(result.trackCount ?? '—').padEnd(COL.tracks),
            (result.hasManifest ? '✓' : '—').padEnd(COL.manifest),
            result.notes.join(', '),
        ].join(''));
    }

    if (needsReencode) {
        console.log(`\n⚠ Tracks encoded before loudness normalization (${formatDate(LOUDNORM_DATE)}): run "reencode <channel> --outdated"`);
    }
    console.log('');
};

const tracks = async ([channel], flags) => {
    requireChannel(channel);
    const [{ manifest, persisted, warnings }, sources] = await Promise.all([
        loadChannelManifest(channel),
        getTracks(channel).catch(() => null),
    ]);
    const { rows, total, current, position } = describeTracks(manifest);

    printManifestOrigin(channel, manifest, persisted, warnings);
    console.log(`Loop length: ${formatClock(total)}\n`);

    const indexWidth = String(rows.length - 1).length;
    for (const row of rows) {
        const columns = [
            row === current ? '▶' : ' ',
            String(row.index).padStart(indexWidth),
            formatClock(row.start).padStart(9),
            formatClock(row.duration).padStart(8),
            row.title,
        ];
        if (flags.sources) columns.push(`[${row.source ?? 'no source'}]`);
        console.log(columns.join('  '));
    }

    console.log('');
    if (current) {
        console.log(`Now playing: #${current.index} ${current.title} (${formatClock(position - current.start)} / ${formatClock(current.duration)})`);
    }
    if (!sources) {
        console.log(`Source bucket "${channel}" could not be listed`);
        return;
    }
    const { unmapped, unencoded, missing } = compareWithSources(manifest, sources);
    if (unmapped === manifest.tracks.length) {
        console.log(`Source files are not mapped to tracks (the bucket has ${sources.length} files)`);
        return;
    }
    if (unmapped) console.log(`${unmapped} tracks have no source file mapped`);
    if (unencoded.length) console.log(`${unencoded.length} files in the bucket are not in the channel yet: ${formatList(unencoded, 5)}`);
    if (missing.length) console.log(`${missing.length} tracks' source files are no longer in the bucket: ${formatList(missing.map((track) => track.id), 5)}`);
};

const verify = async ([channel]) => {
    requireChannel(channel);
    const { manifest, persisted, warnings } = await loadChannelManifest(channel);
    printManifestOrigin(channel, manifest, persisted, warnings);

    const [segmentNames, mpdXml] = await Promise.all([
        listSegmentNames(channel),
        mpdRepository.getMpdContent(channel),
    ]);
    let healthy = true;

    console.log(`\nSegments: checking ${manifest.tracks.length} tracks against ${segmentNames.length} objects in MinIO`);
    const { problems, orphanPrefixes } = findSegmentProblems(manifest, segmentNames);
    if (!problems.length) console.log('✓ Every track has its init segment and all its media segments');
    for (const problem of problems) {
        healthy = false;
        const issues = [];
        if (!problem.hasInit) issues.push('init segment missing');
        if (problem.missing.length) {
            issues.push(`${problem.missing.length} of ${problem.expected} segments missing (${formatList(problem.missing, 8)})`);
        }
        console.log(`✗ #${problem.index} ${problem.id} ${problem.title}: ${issues.join(', ')}`);
    }
    if (orphanPrefixes.length) console.log(`ℹ Segments not used by the channel: ${formatList(orphanPrefixes, 8)}`);

    console.log('\nMPD:');
    if (!mpdXml) {
        healthy = false;
        console.log('✗ No MPD in MinIO');
    } else {
        const differences = await compareManifestWithMpd(manifest, await parseChannelMpd(mpdXml));
        if (differences.length) {
            healthy = false;
            printDifferences(differences);
        } else {
            console.log('✓ The live MPD matches the channel');
        }
    }

    if (!healthy) process.exitCode = 1;
};

const bootstrap = async (channels, flags) => {
    const targets = flags.all ? await mpdRepository.listChannelNames() : channels;
    requireChannel(targets[0]);

    for (const channel of targets) {
        console.log(`\n${channel}`);
        try {
            if (!(await mpdRepository.getMpdStat(channel))) {
                console.log('  No MPD, skipping');
                continue;
            }
            if (!flags.force && await mpdRepository.getChannelManifest(channel)) {
                console.log('  channel.json already exists, skipping (use --force to overwrite)');
                continue;
            }

            const { manifest, warnings, differences } = await bootstrapChannel(channel);
            const mappedCount = manifest.tracks.filter((track) => track.source).length;
            console.log(`  ${manifest.tracks.length} tracks, ${mappedCount} mapped to a source file`);
            warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));

            const urlChanges = new Set(differences.filter(isUrlDifference).map((difference) => difference.index));
            if (urlChanges.size) {
                console.log(`  ℹ ${urlChanges.size} tracks in the live MPD use another segment URL; regenerating the MPD will point them to ${process.env.BACKEND_URL}`);
            }

            const blocking = differences.filter((difference) => !isUrlDifference(difference));
            if (blocking.length) {
                printDifferences(blocking, '  ');
                console.log('  ✗ Not saved: the manifest does not reproduce the live MPD');
                process.exitCode = 1;
                continue;
            }

            if (flags.write) {
                const objectPath = await mpdRepository.uploadChannelManifest(channel, manifest);
                console.log(`  ✓ Saved ${objectPath}`);
            } else {
                console.log('  Dry run: re-run with --write to save channel.json');
            }
        } catch (err) {
            console.log(`  ✗ ${err.message}`);
            process.exitCode = 1;
        }
    }
};

const printTitleChanges = (titleChanges, indent = '') => {
    if (!titleChanges.length) return;
    const [first] = titleChanges;
    console.log(`${indent}~ ${titleChanges.length} titles change in tracks.json, e.g. #${first.index}: ${first.before ?? '(none)'} → ${first.after ?? '(removed)'}`);
};

const sync = async (channels, flags) => {
    const targets = flags.all
        ? (await Promise.all((await mpdRepository.listChannelNames()).map(async (channel) =>
            (await mpdRepository.getChannelManifest(channel)) ? channel : null))).filter(Boolean)
        : channels;
    requireChannel(targets[0]);
    if ('file' in flags && !flags.file) throw new Error('--file needs a path');
    if (flags.file && targets.length > 1) throw new Error('--file applies to a single channel');

    const edited = flags.file ? JSON.parse(await fs.readFile(flags.file, 'utf-8')) : null;
    for (const channel of targets) {
        console.log(`\n${channel}`);
        try {
            const { manifest, differences, titleChanges, manifestChanged, upToDate } = await syncChannel({ channel, edited, dryRun: flags['dry-run'] });
            if (upToDate) {
                console.log('  ✓ Already up to date');
                continue;
            }
            if (manifestChanged) console.log(`  ~ channel.json updated (${manifest.tracks.length} tracks)`);
            printDifferences(differences, '  ', '~');
            printTitleChanges(titleChanges, '  ');
            console.log(flags['dry-run'] ? '  Dry run: nothing uploaded' : '  ✓ Published the MPD and tracks.json');
        } catch (err) {
            console.log(`  ✗ ${err.message}`);
            process.exitCode = 1;
        }
    }
};

const exportManifest = async ([channel, file]) => {
    requireChannel(channel);
    const manifest = await mpdRepository.getChannelManifest(channel);
    if (!manifest) throw new Error(`Channel "${channel}" has no channel.json`);
    const target = file ?? `${channel}.json`;
    await fs.writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Saved ${manifest.tracks.length} tracks to ${target}`);
    console.log(`Edit titles, sources or the order, remove tracks, then run: npm run channel -- sync ${channel} --file ${target}`);
};

const printFailures = (failed) => {
    if (!failed.length) return;
    process.exitCode = 1;
    console.log(`\n✗ ${failed.length} tracks failed:`);
    failed.forEach(({ job, error }) => console.log(`  ${job.id} ${job.source}: ${error.message}`));
};

const add = async ([channel, ...files], flags) => {
    requireChannel(channel);
    const { jobs, skipped, added, failed } = await addTracks({ channel, files, sorted: flags.sorted, dryRun: flags['dry-run'] });

    if (skipped.length) console.log(`Already in the channel: ${formatList(skipped, 5)}`);
    if (!jobs.length) {
        console.log(`No new files to add to ${channel}`);
        return;
    }
    if (flags['dry-run']) {
        console.log(`Would add ${jobs.length} tracks to ${channel}${flags.sorted ? ' in source order' : ' at the end'}:`);
        jobs.forEach((job) => console.log(`  ${job.id}  ${job.source}`));
        return;
    }

    if (added.length) console.log(`\n✓ Added ${added.length} tracks to ${channel} and published the MPD`);
    printFailures(failed);
};

const reencode = async ([channel, ...selection], flags) => {
    requireChannel(channel);
    if (!selection.length && !flags.missing && !flags.outdated && !flags.all) {
        console.error(USAGE);
        process.exit(1);
    }

    const { jobs, reencoded, failed } = await reencodeTracks({
        channel,
        args: selection,
        missing: flags.missing,
        outdated: flags.outdated,
        all: flags.all,
        force: flags.force,
        dryRun: flags['dry-run'],
    });

    if (!jobs.length) {
        console.log(`No tracks to re-encode in ${channel}`);
        return;
    }
    if (flags['dry-run']) {
        console.log(`Would re-encode ${jobs.length} tracks of ${channel}:`);
        jobs.forEach((job) => console.log(`  #${job.index}  ${job.id}  ${job.source}`));
        return;
    }

    if (reencoded.length) console.log(`\n✓ Re-encoded ${reencoded.length} tracks of ${channel} and published the MPD`);
    printFailures(failed);
};

const COMMANDS = { status, tracks, verify, bootstrap, sync, export: exportManifest, add, reencode };

const VALUE_FLAGS = ['file'];
const [command, ...rest] = process.argv.slice(2);
const flags = {};
const args = [];
for (let index = 0; index < rest.length; index++) {
    const arg = rest[index];
    if (!arg.startsWith('--')) {
        args.push(arg);
        continue;
    }
    const name = arg.slice(2);
    flags[name] = VALUE_FLAGS.includes(name) ? rest[++index] : true;
}

if (!COMMANDS[command]) {
    console.error(USAGE);
    process.exit(1);
}

try {
    await COMMANDS[command](args, flags);
} catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
}
process.exit();
