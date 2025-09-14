import { minioClient } from "../db-media/index.js";

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.m4v', '.flac', '.mkv'];

export const getTrack = async (channel, trackName) => {
    try {
        const stream = await minioClient.getObject(channel, trackName);
        return stream;
    } catch (error) {
        throw new Error(`Invalid channel: ${channel}`);
    }
};

export const getTracks = async (channel) => {
    const tracks = [];
    try {
        const stream = minioClient.listObjects(channel, '', true);
        return new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                if (ALLOWED_EXTENSIONS.some(ext => obj.name.toLowerCase().endsWith(ext))) {
                    tracks.push(obj.name);
                }
            });
            stream.on('error', reject);
            stream.on('end', () => resolve(tracks));
        });
    } catch (error) {
        throw new Error(`Invalid channel: ${channel}`);
    }
};

export const getTrackUrl = async (channel, trackName) => {
    try {
        return await minioClient.presignedUrl('GET', channel, trackName);
    } catch (error) {
        throw new Error(`Invalid track: ${trackName}`);
    }
};
