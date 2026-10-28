import * as segmentsRepository from "../repositories/segmentsRepository.js"

export const getSegmentStream = async (channelName, segmentName) => {
    const segmentStream = await segmentsRepository.getSegment(channelName, segmentName);
    return segmentStream;
};
