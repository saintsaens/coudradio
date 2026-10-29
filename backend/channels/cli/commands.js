import fs from 'fs/promises';
import { describeTracks, LOUDNORM_DATE } from '../manifest/manifest.js';
import { compareWithSources } from '../manifest/checks.js';
import {
    addTracks,
    bootstrapChannelManifest,
    getChannelStatus,
    listChannels,
    loadChannelWithSources,
    loadSavedManifest,
    reencodeTracks,
    syncChannel,
    verifyChannel,
} from '../maintenance.js';
import {
    formatClock,
    formatDate,
    formatList,
    printDifferences,
    printFailures,
    printManifestOrigin,
    printTitleChanges,
} from './format.js';

// Thrown when the arguments do not make a valid command: the CLI prints its usage
export class UsageError extends Error {}

const requireChannel = (channel) => {
    if (!channel) throw new UsageError();
};

const status = async (channels) => {
    const targets = channels.length ? channels : await listChannels();
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
    const { manifest, persisted, warnings, sources } = await loadChannelWithSources(channel);
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
    const { manifest, persisted, warnings, segmentCount, problems, pastDuration, orphanPrefixes, differences } = await verifyChannel(channel);
    printManifestOrigin(channel, manifest, persisted, warnings);
    let healthy = true;

    console.log(`\nSegments: checking ${manifest.tracks.length} tracks against ${segmentCount} objects in MinIO`);
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
    for (const track of pastDuration) {
        console.log(`ℹ #${track.index} ${track.id} ${track.title}: ${track.extra.length} segments past the ${track.expected} its duration needs `
            + `(${track.extra[0]}–${track.extra.at(-1)}): the duration may be too short, or they are left over from an older encode`);
    }
    if (orphanPrefixes.length) console.log(`ℹ Segments not used by the channel: ${formatList(orphanPrefixes, 8)}`);

    console.log('\nMPD:');
    if (!differences) {
        healthy = false;
        console.log('✗ No MPD in MinIO');
    } else if (differences.length) {
        healthy = false;
        printDifferences(differences);
    } else {
        console.log('✓ The live MPD matches the channel');
    }

    if (!healthy) process.exitCode = 1;
};

const bootstrap = async (channels, flags) => {
    const targets = flags.all ? await listChannels() : channels;
    requireChannel(targets[0]);

    for (const channel of targets) {
        console.log(`\n${channel}`);
        try {
            const result = await bootstrapChannelManifest({ channel, write: flags.write, force: flags.force });
            if (result.skipped === 'no-mpd') {
                console.log('  No MPD, skipping');
                continue;
            }
            if (result.skipped === 'exists') {
                console.log('  channel.json already exists, skipping (use --force to overwrite)');
                continue;
            }

            const { manifest, warnings, urlDifferences, blocking, objectPath } = result;
            const mappedCount = manifest.tracks.filter((track) => track.source).length;
            console.log(`  ${manifest.tracks.length} tracks, ${mappedCount} mapped to a source file`);
            warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));

            const urlChanges = new Set(urlDifferences.map((difference) => difference.index));
            if (urlChanges.size) {
                console.log(`  ℹ ${urlChanges.size} tracks in the live MPD use another segment URL; regenerating the MPD will point them to ${process.env.BACKEND_URL}`);
            }

            if (blocking.length) {
                printDifferences(blocking, '  ');
                console.log('  ✗ Not saved: the manifest does not reproduce the live MPD');
                process.exitCode = 1;
                continue;
            }

            if (objectPath) {
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

const sync = async (channels, flags) => {
    const targets = flags.all ? await listChannels({ withManifest: true }) : channels;
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
    const manifest = await loadSavedManifest(channel);
    const target = file ?? `${channel}.json`;
    await fs.writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Saved ${manifest.tracks.length} tracks to ${target}`);
    console.log(`Edit titles, sources or the order, remove tracks, then run: npm run channel -- sync ${channel} --file ${target}`);
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
    if (!selection.length && !flags.missing && !flags.outdated && !flags.all) throw new UsageError();

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

export const COMMANDS = { status, tracks, verify, bootstrap, sync, export: exportManifest, add, reencode };
