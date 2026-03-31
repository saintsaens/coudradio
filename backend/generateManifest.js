/**
 * Generates a tracks.json manifest for an existing channel.
 *
 * Usage:
 *   node generateManifest.js <channelName>
 *
 * Fetches the list of audio files directly from MinIO (sorted alphabetically),
 * strips extensions, replaces underscores with spaces, and uploads tracks.json.
 */
import path from 'path';
import dotenv from 'dotenv';
import { getTracks } from './repositories/trackRepository.js';
import { uploadTrackList } from './repositories/mpdRepository.js';

dotenv.config();

const channelName = process.argv[2];

if (!channelName) {
    console.error('Usage: node generateManifest.js <channelName>');
    process.exit(1);
}

console.log(`Fetching tracks for "${channelName}" from MinIO…`);
const rawFilenames = await getTracks(channelName);
const tracks = rawFilenames
    .sort()
    .map((f) => {
        const folder = path.dirname(f).replace(/_/g, ' ');
        const name = path.basename(f, path.extname(f)).replace(/_/g, ' ');
        return folder === '.' ? name : `${folder} - ${name}`;
    });

if (tracks.length === 0) {
    console.error('No audio files found for this channel.');
    process.exit(1);
}

console.log(`Uploading manifest with ${tracks.length} tracks…`);
await uploadTrackList(channelName, tracks);
console.log(`Done. tracks.json written to mpd/${channelName}/tracks.json`);
