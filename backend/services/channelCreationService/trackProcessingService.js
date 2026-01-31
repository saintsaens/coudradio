import { loadProgress, cleanupProgress, saveProgress } from "./progressSavingService.js";
import { encodeTrack } from "../trackEncodingService.js";
import { addTrackToChannelMpd } from "./channelMpdService.js";
import {
    localChannelDirectoryFor,
    cleanUpLocalChannelDirectory,
    createLocalChannelDirectory,
    deleteLocalChannelDirectory
} from "./fileSystemService.js";
import { uploadSegment } from "./segmentsUploadingService.js";
import fs from "fs/promises";
import path from "path";

export const processTracks = async ({ tracks, channelName }) => {
    const lastProcessedIndex = await loadProgress(channelName);

    await initializeTrackProcessing(channelName);

    for (let index = lastProcessedIndex + 1; index < tracks.length; index++) {
        console.log(`Processing track ${index + 1} of ${tracks.length}…`);
        await processTrack({ index, tracks, channelName });
    }

    await finalizeAllTracksProcessing(channelName);
};

const processTrack = async ({ index, tracks, channelName }) => {
    try {
        const trackMpdPath = await encodeTrack(index, tracks, channelName);

        await uploadTrackSegments(channelName);
        await addTrackToChannelMpd({ index, channelName });

        await finalizeTrackProcessing({ index, channelName });
    } catch (err) {
        console.error(`Error processing track ${index + 1}:`, err);
        throw err;
    }
};

const initializeTrackProcessing = async (channelName) => {
    await createLocalChannelDirectory(channelName);
};

const finalizeTrackProcessing = async ({ index, channelName }) => {
    await saveProgress(channelName, index);
    await cleanUpLocalChannelDirectory(channelName);
}

const finalizeAllTracksProcessing = async (channelName) => {
    await deleteLocalChannelDirectory(channelName);
    await cleanupProgress(channelName);
};

export const uploadTrackSegments = async (channelName) => {
    const segments = await getAllTrackSegments(channelName);

    console.log(`Uploading segments…`);
    await Promise.all(
        segments.map(segmentPath =>
            uploadSegment(
                segmentPath,
                path.basename(segmentPath),
                channelName
            )
        )
    );
};

export const getAllTrackSegments = async (channelName) => {
    const directory = localChannelDirectoryFor(channelName);

    const files = await fs.readdir(directory);

    return files
        .filter(
            file =>
                file.endsWith(".m4s") ||
                file.endsWith("_init.mp4")
        )
        .map(file => path.join(directory, file));
};
