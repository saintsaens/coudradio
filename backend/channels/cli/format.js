const DIFFERENCE_LABELS = {
    initialization: 'init segment URL',
    media: 'media segment URL',
};

export const formatClock = (seconds) => {
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
};

export const formatDate = (date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

export const formatList = (items, max = 10) =>
    items.length > max ? `${items.slice(0, max).join(', ')}, … (${items.length - max} more)` : items.join(', ');

export const printManifestOrigin = (channel, manifest, persisted, warnings) => {
    const origin = persisted ? 'channel.json' : 'no channel.json yet, derived from the live MPD';
    console.log(`${channel}: ${manifest.tracks.length} tracks (${origin})`);
    warnings.forEach((warning) => console.log(`⚠ ${warning}`));
};

export const printDifferences = (differences, indent = '', marker = '✗') => {
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

export const printTitleChanges = (titleChanges, indent = '') => {
    if (!titleChanges.length) return;
    const [first] = titleChanges;
    console.log(`${indent}~ ${titleChanges.length} titles change in tracks.json, e.g. #${first.index}: ${first.before ?? '(none)'} → ${first.after ?? '(removed)'}`);
};

export const printFailures = (failed) => {
    if (!failed.length) return;
    process.exitCode = 1;
    console.log(`\n✗ ${failed.length} tracks failed:`);
    failed.forEach(({ job, error }) => console.log(`  ${job.id} ${job.source}: ${error.message}`));
};
