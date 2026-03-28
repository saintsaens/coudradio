import xml2js from 'xml2js';
import { getMpd } from '../repositories/mpdRepository.js';
import { getTracks } from '../repositories/trackRepository.js';

const cache = new Map();

const streamToString = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
});

const iso8601ToSeconds = (duration) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(\d+(?:\.\d+)?)S/;
    const match = duration.match(regex);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1], 10) * 3600 : 0;
    const minutes = match[2] ? parseInt(match[2], 10) * 60 : 0;
    const seconds = parseFloat(match[3]);
    return hours + minutes + seconds;
};

const parseTrackName = (filename) => {
    const base = filename.replace(/\.[^.]+$/, '');
    const sep = ' - ';
    const idx = base.indexOf(sep);
    if (idx === -1) return { artist: null, name: base };
    return { artist: base.slice(0, idx), name: base.slice(idx + sep.length) };
};

const buildCache = async (channel) => {
    const stream = await getMpd(channel);
    const xml = await streamToString(stream);
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
    const periods = Array.isArray(result.MPD.Period) ? result.MPD.Period : [result.MPD.Period];
    const durations = periods.map((p) => iso8601ToSeconds(p.duration));
    const total = durations.reduce((sum, d) => sum + d, 0);

    const filenames = await getTracks(channel);
    filenames.sort();
    const tracks = filenames.map(parseTrackName);

    cache.set(channel, { tracks, durations, total });
};

export const getCurrentTrack = async (channel) => {
    if (!cache.has(channel)) {
        await buildCache(channel);
    }
    const { tracks, durations, total } = cache.get(channel);
    let position = (Date.now() / 1000) % total;
    for (let i = 0; i < durations.length; i++) {
        if (position < durations[i]) return tracks[i];
        position -= durations[i];
    }
    return tracks[tracks.length - 1];
};
