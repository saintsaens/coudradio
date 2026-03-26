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

export const getMpd = async (channelName) => {
    const bucket = process.env.MINIO_MPD_BUCKET;
    const mpdFileName = `${channelName}.mpd`;
    const mpdPath = `${process.env.MINIO_MPD_PATH}/${channelName}/${mpdFileName}`;
    console.log(`[getMpd] bucket="${bucket}" path="${mpdPath}"`);
    try {
        const dataStream = await minioClient.getObject(bucket, mpdPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        console.error('[getMpd] MinIO error:', {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            resource: error.resource,
            bucket,
            mpdPath,
        });
        throw new Error(`Failed to retrieve mpd`);
    }
};
