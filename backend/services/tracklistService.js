import dotenv from 'dotenv';
import { getTracks, getTrackUrl } from "../repositories/trackRepository.js";

dotenv.config();

export const getTracklist = async (channel) => {
    console.log(`Fetching tracks from ${channel}…`);
    const tracks = await getTracks(channel);
    if (tracks.length === 0) {
        throw new Error(`No tracks found for channel: ${channel}`);
    }
    const trackUrls = await Promise.all(
        tracks.map(track => getTrackUrl(channel, track))
    );
    return trackUrls;
};
