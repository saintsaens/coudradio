import { getTrackName } from "./ffprobeService.js";
import { finalizeMpd, addContentToMpd, createChannelMpd, createSegmentsDirectory, transformMpdIntoPeriod } from "./mpdService.js";
import { deleteSegmentsAndMpd, encodeTrack } from "./trackEncodingService.js";
import { getTracklist } from "./tracklistService.js";
import fs from "fs";

export const createRadio = async () => {
    console.log("Creating radio…");
    // console.log("Creating lofi channel…");
    // const lofiChannel = await createChannel(process.env.LOFI_CHANNEL_NAME);
    // console.log(`Lofi MPD available: ${lofiChannel}`);
    console.log("Creating coudrier channel…");
    const coudrierChannel = await createChannel(process.env.COUDRIER_CHANNEL_NAME);
    console.log(`Coudrier MPD available: ${coudrierChannel}`);

    const radio = {
        // lofi: lofiChannel,
        coudrier: coudrierChannel
    };

    return radio;
};

export const createChannel = async (channelName) => {
    const mpdPath = createChannelMpd(channelName);

    let tracksPaths = await getTracklist(channelName);
    tracksPaths = tracksPaths.slice(0, 3);
    console.log(`Found ${tracksPaths.length} tracks`);

    const trackNames = await Promise.all(tracksPaths.map(trackPath => getTrackName(trackPath)));

    const segmentsDirectory = await createSegmentsDirectory(channelName);
    for (let index = 0; index < tracksPaths.length; index++) {

        const singleTrackMpdPath = await encodeTrack(index, tracksPaths, segmentsDirectory);
        console.log(`Creating segments and mpd for track${index} (${trackNames[index]})…`);

        console.log(`Updating channel MPD…`);
        const period = await transformMpdIntoPeriod(index, singleTrackMpdPath);
        addContentToMpd(mpdPath, period);

        console.log(`Uploading segments to MiniO… (skipped)`);

        await deleteSegmentsAndMpd(singleTrackMpdPath);
    }
    // Add mpd footer
    finalizeMpd(mpdPath);
    console.log(`Done: ${process.env.PUBLIC_MPD_PATH}/${channelName}.mpd`);
    // Upload mpd
};

export const getChannel = (radio, channelName) => {
    if (!radio[channelName]) {
        throw new Error('Channel not found');
    }
    return radio[channelName];
}
