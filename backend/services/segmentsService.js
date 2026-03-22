import * as segmentsRepository from "../repositories/segmentsRepository.js"
import fs from "fs";
import path from "path";

export const uploadSegment = async (segmentPath, channel) => {
    if (!fs.existsSync(segmentPath)) {
        throw new Error(`File not found at path: ${segmentPath}`);
    }

    const segmentName = path.basename(segmentPath);
    const objectName = `${process.env.MINIO_SEGMENTS_PATH}/${channel}/${segmentName}`;
    return segmentsRepository.putSegmentObject(objectName, segmentPath);
};

export const getSegmentStream = async (channelName, segmentName) => {
    const segmentStream = await segmentsRepository.getSegment(channelName, segmentName);
    return segmentStream;
};
