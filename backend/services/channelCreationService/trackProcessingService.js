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
        await addTrackToChannelMpd({ index, trackMpdPath, channelName });

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

export const uploadTrackSegments = async (channelName, concurrency = 4) => {
    console.log(`Uploading segments…`);
    const segments = await getAllTrackSegments(channelName);
    const results = [];

    const logProgress = createProgressLogger(segments.length, 100);

    let index = 0;

    async function worker() {
        while (index < segments.length) {
            const segmentPath = segments[index++];
            const segmentName = path.basename(segmentPath);

            const result = await uploadSegment(
                segmentPath,
                segmentName,
                channelName
            );

            results.push(result);
            logProgress();
        }
    }

    const workers = Array.from({ length: concurrency }, worker);
    await Promise.all(workers);

    return results;
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

const createProgressLogger = (total, step = 100) => {
    let completed = 0;

    return () => {
        completed++;
        if (completed % step === 0 || completed === total) {
            console.log(`Uploaded ${completed}/${total} segments`);
        }
    };
};
