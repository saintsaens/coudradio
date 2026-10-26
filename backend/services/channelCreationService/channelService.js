import { initializeChannelMpd, finalizeChannelMpd } from "./channelMpdService.js";
import { getTracklist } from "../tracklistService.js";
import { uploadMpd } from "../mpdService.js";
import { processTracks } from "./trackProcessingService.js";
import { cleanupProgress, loadProgress } from "./progressSavingService.js";
import { uploadTrackList } from "../../repositories/mpdRepository.js";

export const createChannel = async (channelName) => {
    await initializeChannel(channelName);
    const filenames = await populateChannel(channelName);
    await finalizeChannel(channelName, filenames);
};

const initializeChannel = async (channelName) => {
    // Without a progress file this is a fresh run: a leftover local MPD from a previous run must not be reused
    const isResuming = await loadProgress(channelName) >= 0;
    await initializeChannelMpd(channelName, { reset: !isResuming });
};

const populateChannel = async (channelName) => {
    const tracks = await getTracklist(channelName);
    console.log(`Found ${tracks.length} tracks`);

    await processTracks({ tracks, channelName });

    const filenames = tracks.map((url) =>
        decodeURIComponent(new URL(url).pathname.split('/').pop())
    );
    return filenames;
};

const finalizeChannel = async (channelName, filenames) => {
    await finalizeChannelMpd(channelName);
    await cleanupProgress(channelName);
    await uploadMpd(channelName);
    await uploadTrackList(channelName, filenames);
};
