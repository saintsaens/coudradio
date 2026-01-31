import { saveProgress } from "./progressSavingService.js";
import { createLocalSegmentsDirectory } from "../mpdService.js";
import { loadProgress, cleanupProgress, saveProgress } from "./progressSavingService.js";
import { encodeTrack } from "../trackEncodingService.js";
import { deleteSegmentsAndMpd } from "../trackEncodingService.js";
import { addTrackToChannelMpd } from "./channelMpdService.js";
import { channelMpdPathFor, cleanUpLocalChannelDirectory, createLocalChannelDirectory, deleteLocalChannelDirectory, deleteTrackMpd, deleteTrackSegments } from "./fileSystemService.js";
import { uploadTrackSegments } from "./segmentsUploadingService.js";

export const processTracks = async ({ tracks, channelName }) => {
    await initializeTrackProcessing(channelName);
    // process each track
    const lastProcessedIndex = await loadProgress(channelName);

    for (let index = lastProcessedIndex + 1; index < tracks.length; index++) {
        console.log(`Processing track ${index + 1} of ${tracks.length}…`);
        await processTrack({ index, tracks, channelName });
    }

    await finalizeAllTracksProcessing(channelName);
};

const processTrack = async ({ index, tracks, channelName }) => {
    const channelMpdPath = channelMpdPathFor(channelName);
    const localChannelDirectory = localChannelDirectoryFor(channelName);

    try {
        const trackMpdPath = await encodeTrack(index, tracks, localChannelDirectory);

        console.log(`Uploading segments for track ${index + 1}...`);
        await uploadTrackSegments(trackMpdPath, channelName);

        await saveProgress(channelName, index);

        await addTrackToChannelMpd({ index, channelName });

        await finalizeTrackProcessing(channelName);
    } catch (err) {
        console.error(`Error processing track ${index + 1}:`, err);
        throw err;
    }
};

const initializeTrackProcessing = async (channelName) => {
    await createLocalChannelDirectory(channelName);
};

const finalizeTrackProcessing = async (channelName) => {
    await cleanUpLocalChannelDirectory(channelName);
}

const finalizeAllTracksProcessing = async (channelName) => {
    await deleteLocalChannelDirectory(channelName);
};
