import * as segmentsRepository from "../repositories/segmentsRepository.js"
import fs from "fs";
import path from "path";

export const uploadSegment = async (segmentPath, channel) => {
    if (!fs.existsSync(segmentPath)) {
        console.error(`Segment file not found: ${segmentPath}`);
        return null;
    }

    const segmentName = path.basename(segmentPath);

    try {
        const uploadedSegmentName =
            await segmentsRepository.uploadSegment(segmentPath, segmentName, channel);

        if (!uploadedSegmentName) {
            console.error(`Segment upload failed: ${segmentName}`);
            return null;
        }

        return uploadedSegmentName;
    } catch (error) {
        // defensive: repository *shouldn't* throw anymore, but don't trust it
        console.error(`Unexpected error uploading segment ${segmentName}`, error);
        return null;
    }
};

export const getSegmentStream = async (channelName, segmentName) => {
    const segmentStream = await segmentsRepository.getSegment(channelName, segmentName);
    return segmentStream;
};
