import { initializeChannelMpd, finalizeChannelMpd } from "./channelMpdService.js";
import { getTracklist } from "../tracklistService.js";
import { uploadMpd } from "../mpdService.js";
import { processTracks } from "./trackProcessingService.js";
import { cleanupProgress } from "./progressSavingService.js";

export const createChannel = async (channelName) => {
    await initializeChannel(channelName);
    await populateChannel(channelName);
    await finalizeChannel(channelName);
};

const initializeChannel = async (channelName) => {
    await initializeChannelMpd(channelName);
};

const populateChannel = async (channelName) => {
    const tracks = await getTracklist(channelName);
    console.log(`Found ${tracks.length} tracks`);

    await processTracks({ tracks, channelName });
};

const finalizeChannel = async (channelName) => {
    await finalizeChannelMpd(channelName);
    await cleanupProgress(channelName);
    await uploadMpd(channelName);
};
