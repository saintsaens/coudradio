import { finalizeMpd, addContentToMpd, createLocalMpd, createLocalSegmentsDirectory, transformMpdIntoPeriod, uploadMpd } from "./mpdService.js";
import { deleteSegmentsAndMpd, encodeTrack } from "./trackEncodingService.js";
import { getTracklist } from "./tracklistService.js";
import fs from 'fs/promises';
import path from 'path';
import { uploadTrackSegments } from "./trackService.js";


const getProgressFilePath = (channelName) =>
    path.join('progress', `${channelName}.json`);

const getMpdFilePath = (channelName) =>
    path.join(process.env.PUBLIC_MPD_PATH, `${channelName}.mpd`);

const loadProgress = async (channelName) => {
    try {
        const filePath = getProgressFilePath(channelName);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data).lastIndex ?? -1;
    } catch {
        return -1;
    }
};

const saveProgress = async (channelName, index) => {
    const filePath = getProgressFilePath(channelName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ lastIndex: index }), 'utf-8');
};

export const createChannel = async (channelName) => {
    const mpdPath = getMpdFilePath(channelName);

    try {
        await fs.access(mpdPath);
        console.log(`MPD already exists at ${mpdPath}`);
    } catch {
        console.log(`Creating new MPD for ${channelName}...`);
        createLocalMpd(channelName);
    }

    const tracksPaths = await getTracklist(channelName);
    console.log(`Found ${tracksPaths.length} tracks`);
    console.log(`Using backend URL: ${process.env.BACKEND_URL}`);

    const segmentsDirectory = await createLocalSegmentsDirectory(channelName);
    const lastProcessedIndex = await loadProgress(channelName);

    for (let index = lastProcessedIndex + 1; index < tracksPaths.length; index++) {
        const singleTrackMpdPath = await encodeTrack(index, tracksPaths, segmentsDirectory);

        console.log(`Uploading segments to MiniO for track ${index + 1}...`);
        await uploadTrackSegments(singleTrackMpdPath, channelName);

        await saveProgress(channelName, index);

        console.log(`Updating local channel MPD for track ${index + 1}...`);
        const period = await transformMpdIntoPeriod(index, singleTrackMpdPath, channelName);
        addContentToMpd(mpdPath, period);

        await deleteSegmentsAndMpd(singleTrackMpdPath);
    }

    await finalizeMpd(mpdPath);
    console.log(`Done: ${mpdPath}`);
    await uploadMpd(mpdPath, channelName);
    console.log(`Uploaded MPD to MiniO for channel ${channelName}`);

    // Clean up progress file
    await fs.rm(getProgressFilePath(channelName), { force: true });
};


export const getChannel = (radio, channelName) => {
    if (!radio[channelName]) {
        throw new Error('Channel not found');
    }
    return radio[channelName];
}
