import { loadProgress, saveProgress } from "./progressSavingService.js";
import { encodeTrack } from "../trackEncodingService.js";
import { addTrackToChannelMpd } from "./channelMpdService.js";
import {
    localTrackDirectoryFor,
    cleanUpLocalTrackDirectory,
    deleteLocalChannelDirectory
} from "./fileSystemService.js";
import { uploadSegment } from "./segmentsUploadingService.js";
import fs from "fs/promises";
import path from "path";

export const processTracks = async ({ tracks, channelName }) => {
    const lastProcessedIndex = await loadProgress(channelName);
    const startIndex = lastProcessedIndex + 1;

    if (startIndex >= tracks.length) return;

    // Start encoding the first track
    let encodePromise = encodeTrack(startIndex, tracks, channelName);

    for (let index = startIndex; index < tracks.length; index++) {
        console.log(`[${new Date().toLocaleTimeString('en-GB')}] Processing track ${index + 1} of ${tracks.length}…`);

        // Wait for current track's encoding to finish
        const trackMpdPath = await encodePromise;

        // Immediately start encoding the next track (overlaps with upload below)
        if (index + 1 < tracks.length) {
            encodePromise = encodeTrack(index + 1, tracks, channelName);
        }

        try {
            await uploadTrackSegments(channelName, index);
            await addTrackToChannelMpd({ index, trackMpdPath, channelName });
            await saveProgress(channelName, index);
            await cleanUpLocalTrackDirectory(channelName, index);
        } catch (err) {
            console.error(`Error processing track ${index + 1}:`, err);
            throw err;
        }
    }

    await deleteLocalChannelDirectory(channelName);
};

export const uploadTrackSegments = async (channelName, trackIndex, concurrency = 4) => {
    console.log(`[${new Date().toLocaleTimeString('en-GB')}] Uploading segments for track ${trackIndex + 1}…`);
    const segments = await getAllTrackSegments(channelName, trackIndex);
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

export const getAllTrackSegments = async (channelName, trackIndex) => {
    const directory = localTrackDirectoryFor(channelName, trackIndex);

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
            console.log(`[${new Date().toLocaleTimeString('en-GB')}] Uploaded ${completed}/${total} segments`);
        }
    };
};
