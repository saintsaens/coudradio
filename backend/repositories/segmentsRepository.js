import { minioClient } from "../db-media/index.js";
import { readFile } from 'fs/promises';
import { createReadStream } from "fs";

const bucket = process.env.MINIO_SEGMENTS_BUCKET;

export const getSegment = async (channelName, segmentName) => {
    const segmentPath = `${process.env.MINIO_SEGMENTS_PATH}/${channelName}/${segmentName}`;
    try {
        const dataStream = await minioClient.getObject(bucket, segmentPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        throw new Error(`Failed to retrieve segment: ${error.message}`);
    }
};


export const putSegmentObject = async (objectName, segmentPath) => {
  const stream = createReadStream(segmentPath);
  return minioClient.putObject(bucket, objectName, stream);
};

export const getSegmentObject = async (objectName) => {
  return minioClient.getObject(bucket, objectName);
};
