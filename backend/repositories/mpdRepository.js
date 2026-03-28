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
        console.error(`[getTrackList] MinIO error (bucket="${bucket}" path="${objectPath}"):`, error);
        throw new Error(`Failed to retrieve track list for channel: ${channelName}`);
    }
};

export const uploadTrackList = async (channelName, filenames) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const objectPath = `${process.env.MINIO_MPD_PATH}/${channelName}/tracks.json`;
    const content = Buffer.from(JSON.stringify(filenames), 'utf-8');
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
