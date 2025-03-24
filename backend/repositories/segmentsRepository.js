import { minioClient } from "../db-media/index.js";

const bucket = process.env.MINIO_SEGMENTS_BUCKET;

export const uploadSegment = async (segmentStream, segmentName, channel) => {
    const objectName = `${process.env.MINIO_SEGMENTS_PATH}/${channel}/${segmentName}`;
    try {
        await minioClient.putObject(bucket, objectName, segmentStream);
        return objectName;
    } catch (error) {
        throw new Error(`Failed to upload segment ${segmentName}: ${error.message}`);
    }
};

export const getSegment = async (channelName, segmentName) => {
    const segmentPath = `${process.env.MINIO_SEGMENTS_PATH}/${channelName}/${segmentName}`;
    try {
        const dataStream = await minioClient.getObject(bucket, segmentPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        throw new Error(`Failed to retrieve segment: ${error.message}`);
    }
};
