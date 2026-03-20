import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { channelMpdPathFor } from "./fileSystemService.js";
import { transformMpdIntoPeriod, getTotalPeriodsDurations, addMediaPresentationDuration } from "../mpdService.js";

dotenv.config({ quiet: true });

export const initializeChannelMpd = async (channelName) => {
    const channelMpdPath = channelMpdPathFor(channelName);

    try {
        await fs.access(channelMpdPath);
        console.log(`Reusing ${channelMpdPath}…`);
    } catch {
        console.log(`Creating ${channelMpdPath}…`);
        await createChannelMpd(channelMpdPath);
    }
};

export const addTrackToChannelMpd = async ({ index, trackMpdPath, channelName }) => {
    const channelMpdPath = channelMpdPathFor(channelName);
    const period = await transformMpdIntoPeriod(index, trackMpdPath, channelName);
    await addContentToMpd(channelMpdPath, period);
};

export const finalizeChannelMpd = async (channelName) => {
    const channelMpdPath = channelMpdPathFor(channelName);
    try {
        const mpdFooter = createChannelMpdFooter();
        await fs.appendFile(channelMpdPath, `\n${mpdFooter}`);

        const totalDuration = await getTotalPeriodsDurations(channelMpdPath);
        await addMediaPresentationDuration(channelMpdPath, totalDuration);
    } catch (error) {
        throw new Error(`Failed to finalize MPD file at ${channelMpdPath}: ${error.message}`);
    }
};

const createChannelMpd = async (channelMpdPath) => {
    const mpdHeader = createChannelMpdHeader();
    const directory = path.dirname(channelMpdPath);
    try {
        await fs.access(directory).catch(async () => {
            await fs.mkdir(directory, { recursive: true });
        });
        await fs.writeFile(channelMpdPath, mpdHeader);
    } catch (error) {
        throw new Error(`Failed to create channel MPD file at ${channelMpdPath}: ${error.message}`);
    }
};

const addContentToMpd = async (mpdPath, content) => {
    console.log(`Adding content to MPD…`);
    try {
        await fs.appendFile(mpdPath, `\n${content}`);
    } catch (error) {
        throw new Error(`Failed to update MPD file at ${mpdPath}: ${error.message}`);
    }
};

const createChannelMpdHeader = () => {
    const mpdHeader = `<?xml version="1.0" encoding="UTF-8"?>
    <MPD xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="urn:mpeg:dash:schema:mpd:2011"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
    profiles="urn:mpeg:dash:profile:isoff-live:2011"
    type="static">`;

    return mpdHeader;
};

const createChannelMpdFooter = () => {
    const mpdFooter = `</MPD>`;

    return mpdFooter;
};
