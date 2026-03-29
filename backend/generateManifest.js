/**
 * Generates a tracks.json manifest for an existing channel.
 *
 * Usage:
 *   node generateManifest.js <channelName> <filenames-file>
 *
 * <filenames-file> must be a newline-separated list of audio filenames
 * in the correct alphabetical order (matching MPD Period order).
 *
 * For channels with 1000+ files (where listObjects fails), produce the
 * file using the MinIO CLI (use --json to handle filenames with spaces):
 *   mc ls alias/<channelName> --recursive --json | jq -r '.key' | sort > filenames.txt
 *   node generateManifest.js <channelName> filenames.txt
 */
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { uploadTrackList } from './repositories/mpdRepository.js';

dotenv.config();

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.m4v', '.flac', '.mkv', '.mp4', '.webm'];

const channelName = process.argv[2];
const filenamesFile = process.argv[3];

if (!channelName || !filenamesFile) {
    console.error('Usage: node generateManifest.js <channelName> <filenames-file>');
    process.exit(1);
}

import path from 'path';

const raw = await fs.readFile(filenamesFile, 'utf-8');
const filenames = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && ALLOWED_EXTENSIONS.some((ext) => line.toLowerCase().endsWith(ext)))
    .map((line) => path.basename(line, path.extname(line)).replace(/_/g, ' '));

if (filenames.length === 0) {
    console.error('No valid audio filenames found in the file.');
    process.exit(1);
}

console.log(`Uploading manifest for "${channelName}" with ${filenames.length} tracks…`);
await uploadTrackList(channelName, filenames);
console.log(`Done. tracks.json written to mpd/${channelName}/tracks.json`);
