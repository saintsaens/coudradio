#!/usr/bin/env node
// Usage:
//   node backend/scripts/channel-status.js                    # auto-discover channels from MinIO
//   node backend/scripts/channel-status.js lofi japanese-rnb  # check specific channels

import { fileURLToPath } from 'url';
import path from 'path';
import xml2js from 'xml2js';
import * as Minio from 'minio';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

const BUCKET = process.env.MINIO_MPD_BUCKET;
const MPD_PATH = process.env.MINIO_MPD_PATH;

const mpdObjectPath = (channel) => `${MPD_PATH}/${channel}/${channel}.mpd`;

const iso8601ToDecimalHours = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(\d+(?:\.\d+)?)S/);
    if (!match) return duration;
    const h = parseFloat(match[1] ?? 0);
    const m = parseFloat(match[2] ?? 0);
    const s = parseFloat(match[3] ?? 0);
    const total = h + m / 60 + s / 3600;
    return `${Math.round(total * 10) / 10}h`;
};

const formatDate = (date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
});

const getChannelStatus = async (channel) => {
    const objectPath = mpdObjectPath(channel);
    let stat;
    try {
        stat = await client.statObject(BUCKET, objectPath);
    } catch (err) {
        if (err.code === 'NotFound' || err.code === 'NoSuchKey') {
            return { channel, exists: false };
        }
        throw err;
    }

    const stream = await client.getObject(BUCKET, objectPath);
    const buf = await streamToBuffer(stream);
    const parsed = await xml2js.parseStringPromise(buf.toString('utf-8'), { mergeAttrs: true, explicitArray: false });
    const duration = parsed?.MPD?.mediaPresentationDuration ?? null;

    return {
        channel,
        exists: true,
        lastModified: stat.lastModified,
        duration: duration ? iso8601ToDecimalHours(duration) : '—',
    };
};

const discoverChannels = () => new Promise((resolve, reject) => {
    const channels = new Set();
    const stream = client.listObjects(BUCKET, `${MPD_PATH}/`, true);
    stream.on('data', (obj) => {
        // Objects look like: mpd/{channel}/{channel}.mpd
        const parts = obj.name.split('/');
        if (parts.length >= 2) channels.add(parts[1]);
    });
    stream.on('end', () => resolve([...channels].sort()));
    stream.on('error', reject);
});

const pad = (str, len) => str.padEnd(len);

const main = async () => {
    const args = process.argv.slice(2);
    const channels = args.length > 0 ? args : await discoverChannels();

    if (channels.length === 0) {
        console.log('No channels found.');
        return;
    }

    const results = (await Promise.all(channels.map(getChannelStatus)))
        .sort((a, b) => parseFloat(b.duration ?? 0) - parseFloat(a.duration ?? 0));

    const LOUDNORM_DATE = new Date('2026-03-29');
    const COL = { channel: 20, status: 10, updated: 26, duration: 14 };
    const line = '─'.repeat(COL.channel + COL.status + COL.updated + COL.duration + 3);

    console.log('');
    console.log(
        pad('Channel', COL.channel) +
        pad('Status', COL.status) +
        pad('MPD last updated', COL.updated) +
        'Duration'
    );
    console.log(line);

    for (const r of results) {
        const status = r.exists ? '✓ Ready' : '✗ Missing';
        const needsReencode = r.exists && r.lastModified < LOUDNORM_DATE;
        const dateStr = r.exists ? formatDate(r.lastModified) : '—';
        const updated = needsReencode ? `${dateStr} ⚠` : dateStr;
        const duration = r.exists ? r.duration : '—';
        console.log(pad(r.channel, COL.channel) + pad(status, COL.status) + pad(updated, COL.updated) + duration);
    }

    console.log('');
};

main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
