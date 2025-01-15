import { minioClient } from "../db/index.js";

const bucket = process.env.MINIO_SEGMENTS_BUCKET;

export const uploadSegment = async (segmentStream, segmentName) => {
    const objectName = `${process.env.MINIO_LOFI_SEGMENTS_PATH}/${segmentName}`;
    try {
        await minioClient.putObject(bucket, objectName, segmentStream);
        return objectName;
    } catch (error) {
        throw new Error(`Failed to upload segment: ${error.message}`);
    }
};

export const getSegment = async (segmentName) => {
    const segmentPath = `${process.env.MINIO_LOFI_SEGMENTS_PATH}/${segmentName}`;
    try {
        const dataStream = await minioClient.getObject(bucket, segmentPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        throw new Error(`Failed to retrieve segment: ${error.message}`);
    }
};
