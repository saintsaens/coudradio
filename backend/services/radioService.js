import { getTracks } from "../repositories/trackRepository.js";
import { createUnifiedMPD, createMpd, finalizeMpd, createUnifiedMpdPeriod, addContentToMpd } from "./mpdService.js";
import { encodeTrack } from "./trackEncodingService.js";
import { getTracklist } from "./tracklistService.js";

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
    console.log(`Creating MPD file: ${channelName}.mpd…`);
    const mpdPath = createMpd(channelName);

    console.log(`Fetching tracks from channel…`);
    const tracks = await getTracks(channelName);
    let tracksPaths = await getTracklist(channelName);
    tracksPaths = tracksPaths.slice(0, 100); // Limit to 100 tracks
    console.log(`Found ${tracksPaths.length} tracks`);

    const channelPath = `./public/${channelName}`;
    for (let index = 0; index < tracksPaths.length; index++) {

        console.log(`Encoding track${index} (${tracks[index]})…`);
        const singleTrackMpdPath = await encodeTrack(index, tracksPaths, channelPath);

        console.log(`Uploading segments to MiniO… (skipped)`);

        console.log(`Updating channel MPD…`);
        const period = await createUnifiedMpdPeriod(tracksPaths[index], index, singleTrackMpdPath);
        addContentToMpd(mpdPath, period);
    }
    // Add mpd footer
    finalizeMpd(mpdPath);
    // Upload mpd
    console.log(`Done: ${process.env.PUBLIC_MPD_PATH}/${channelName}.mpd`);


    // const tracklist = await getTracklist(channelName);
    // const channel = await createUnifiedMPD(tracklist, channelName);

    // return channel;
};

export const getChannel = (radio, channelName) => {
    if (!radio[channelName]) {
        throw new Error('Channel not found');
    }
    return radio[channelName];
}
