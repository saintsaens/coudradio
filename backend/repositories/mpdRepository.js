import { minioClient } from "../db/index.js";

const bucket = process.env.MINIO_MPD_BUCKET;

export const uploadMpd = async (mpdStream, mpdName) => {
    const objectName = `${process.env.MINIO_LOFI_MPD_PATH}/${mpdName}`;
    try {
        await minioClient.putObject(bucket, objectName, mpdStream);
        return objectName;
    } catch (error) {
        throw new Error(`Failed to upload mpd: ${error.message}`);
    }
};

export const getMpd = async (mpdName) => {
    const mpdPath = `${process.env.MINIO_LOFI_MPD_PATH}/${mpdName}`;
    try {
        const dataStream = await minioClient.getObject(bucket, mpdPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        throw new Error(`Failed to retrieve mpd: ${error.message}`);
    }
};
