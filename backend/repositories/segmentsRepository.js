import { minioClient } from "../db-media/index.js";
import { createReadStream } from "fs";

export const getSegment = async (channelName, segmentName) => {
    const bucket = process.env.MINIO_SEGMENTS_BUCKET;
    const segmentPath = `${process.env.MINIO_SEGMENTS_PATH}/${channelName}/${segmentName}`;
    try {
        const dataStream = await minioClient.getObject(bucket, segmentPath);
        return dataStream; // This returns the readable stream of the segment
    } catch (error) {
        throw new Error(`Failed to retrieve segment: ${error.message}`);
    }
};


export const putSegmentObject = async (objectName, segmentPath) => {
  const bucket = process.env.MINIO_SEGMENTS_BUCKET;
  const stream = createReadStream(segmentPath);
  return minioClient.putObject(bucket, objectName, stream);
};

export const getSegmentObject = async (objectName) => {
  const bucket = process.env.MINIO_SEGMENTS_BUCKET;
  return minioClient.getObject(bucket, objectName);
};

export const listSegmentNames = async (channelName) => {
  const bucket = process.env.MINIO_SEGMENTS_BUCKET;
  const prefix = `${process.env.MINIO_SEGMENTS_PATH}/${channelName}/`;
  const names = [];
  const stream = minioClient.listObjects(bucket, prefix, true);
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => names.push(obj.name.slice(prefix.length)));
    stream.on('error', reject);
    stream.on('end', () => resolve(names));
  });
};
