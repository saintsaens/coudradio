import { minioClient } from "../db-media/index.js";

const bucket = process.env.MINIO_SEGMENTS_BUCKET;
const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const uploadSegment = async (segmentStream, segmentName, channel) => {
    const objectName = `${process.env.MINIO_SEGMENTS_PATH}/${channel}/${segmentName}`;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Manual timeout (e.g., 15 seconds)
            const uploadPromise = minioClient.putObject(bucket, objectName, segmentStream);
            const result = await Promise.race([
                uploadPromise,
                delay(15000).then(() => {
                    throw new Error("Upload timed out");
                })
            ]);

            return objectName;
        } catch (error) {
            if (attempt < MAX_RETRIES) {
                console.warn(`Upload attempt ${attempt} failed for ${segmentName}, retrying in ${BASE_DELAY * attempt}ms...`);
                await delay(BASE_DELAY * attempt); // Exponential backoff
            } else {
                throw new Error(`Failed to upload segment ${segmentName} after ${MAX_RETRIES} attempts: ${error.message}`);
            }
        }
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
