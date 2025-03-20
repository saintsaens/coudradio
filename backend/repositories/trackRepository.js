import { getBucketByChannel, minioClient } from "../db-media/index.js";

export const getTrack = async (channel, trackName) => {
    const bucket = getBucketByChannel(channel);
    if (!bucket) {
        throw new Error(`Invalid channel: ${channel}`);
    }
    const stream = await minioClient.getObject(bucket, trackName);
    return stream;
};

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

export const getTracks = async (channel) => {
    const bucket = getBucketByChannel(channel);
    if (!bucket) {
        throw new Error(`Invalid channel: ${channel}`);
    }
    const tracks = [];
    const stream = minioClient.listObjects(bucket, '', true);
    return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
            if (AUDIO_EXTENSIONS.some(ext => obj.name.toLowerCase().endsWith(ext))) {
                tracks.push(obj.name);
            }
        });
        stream.on('error', reject);
        stream.on('end', () => resolve(tracks));
    });
};

export const getTrackUrl = async (channel, trackName) => {
    const bucket = getBucketByChannel(channel);
    if (!bucket) {
        throw new Error(`Invalid channel: ${channel}`);
    }
    return await minioClient.presignedUrl('GET', bucket, trackName);
};
