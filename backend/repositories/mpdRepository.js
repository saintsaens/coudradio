import { minioClient } from "../db-media/index.js";

export const uploadMpd = async (mpdStream, mpdName, channel) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectName = `${process.env.MINIO_MPD_PATH}/${channel}/${mpdName}`;
    try {
        await minioClient.putObject(bucket, objectName, mpdStream);
        return objectName;
    } catch (error) {
        throw new Error(`Failed to upload mpd: ${error.message}`);
    }
};

export const getTrackList = async (channelName) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/tracks.json`;
    try {
        const stream = await minioClient.getObject(bucket, objectPath);
        const chunks = [];
        await new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', resolve);
        });
        return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    } catch (error) {
        if (error.code === 'NoSuchKey') return null;
        console.error(`[getTrackList] MinIO error (bucket="${bucket}" path="${objectPath}"):`, error);
        throw new Error(`Failed to retrieve track list for channel: ${channelName}`);
    }
};

export const uploadTrackList = async (channelName, filenames) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/tracks.json`;
    const content = Buffer.from(JSON.stringify(filenames, null, 2), 'utf-8');
    try {
        await minioClient.putObject(bucket, objectPath, content, content.length, { 'Content-Type': 'application/json' });
        return objectPath;
    } catch (error) {
        throw new Error(`Failed to upload track list: ${error.message}`);
    }
};

export const getMpd = async (channelName) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const mpdFileName = `${channelName}.mpd`;
    const mpdPath = `${process.env.MINIO_MPD_PATH}/${channelName}/${mpdFileName}`;
    try {
        const dataStream = await minioClient.getObject(bucket, mpdPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        console.error(`[getMpd] MinIO error (bucket="${bucket}" path="${mpdPath}"):`, error);
        throw new Error(`Failed to retrieve mpd`);
    }
};

const readObjectAsString = async (bucket, objectPath) => {
    try {
        const stream = await minioClient.getObject(bucket, objectPath);
        const chunks = [];
        await new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', resolve);
        });
        return Buffer.concat(chunks).toString('utf-8');
    } catch (error) {
        if (error.code === 'NoSuchKey') return null;
        throw error;
    }
};

export const getMpdContent = async (channelName) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/${channelName}.mpd`;
    try {
        return await readObjectAsString(bucket, objectPath);
    } catch (error) {
        throw new Error(`Failed to retrieve mpd for channel ${channelName}: ${error.message}`);
    }
};

export const getMpdStat = async (channelName) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/${channelName}.mpd`;
    try {
        return await minioClient.statObject(bucket, objectPath);
    } catch (error) {
        if (error.code === 'NotFound' || error.code === 'NoSuchKey') return null;
        throw new Error(`Failed to stat mpd for channel ${channelName}: ${error.message}`);
    }
};

export const getChannelManifest = async (channelName) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/channel.json`;
    try {
        const content = await readObjectAsString(bucket, objectPath);
        return content === null ? null : JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to retrieve channel manifest for ${channelName}: ${error.message}`);
    }
};

export const uploadChannelManifest = async (channelName, manifest) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/channel.json`;
    const content = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
    try {
        await minioClient.putObject(bucket, objectPath, content, content.length, { 'Content-Type': 'application/json' });
        return objectPath;
    } catch (error) {
        throw new Error(`Failed to upload channel manifest: ${error.message}`);
    }
};

export const listChannelNames = async () => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const prefix = `${process.env.MINIO_MPD_PATH}/`;
    const channels = new Set();
    const stream = minioClient.listObjects(bucket, prefix, true);
    return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
            // Objects look like: mpd/{channel}/{file}
            const channel = obj.name.slice(prefix.length).split('/')[0];
            if (channel) channels.add(channel);
        });
        stream.on('error', reject);
        stream.on('end', () => resolve([...channels].sort()));
    });
};
