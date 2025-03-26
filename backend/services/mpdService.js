import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import * as mpdRepository from "../repositories/mpdRepository.js"
import { encodeTracks } from "./trackEncodingService.js";

export const extractMediaPresentationDuration = async (mpdPath) => {
    const data = fs.readFileSync(mpdPath, 'utf8');
    const result = await xml2js.parseStringPromise(data);
    const duration = result.MPD.$['mediaPresentationDuration'];
    return duration;
}

export const extractTimescale = async (mpdPath) => {
    const data = fs.readFileSync(mpdPath, 'utf8');
    const options = {
        explicitArray: false,
        mergeAttrs: true,
    };

    try {
        const result = await xml2js.parseStringPromise(data, options);
        const adaptationSet = result['MPD']?.['Period']?.['AdaptationSet'];
        let timescale = "";
        if (Array.isArray(adaptationSet)) {
            timescale = result['MPD']?.['Period']?.['AdaptationSet'][0]?.['Representation']?.['SegmentTemplate'].timescale;
        } else {
            timescale = result['MPD']?.['Period']?.['AdaptationSet']?.['Representation']?.['SegmentTemplate'].timescale;
        }

        if (timescale === "") {
            throw new Error(`timescale not found in ${mpdPath}`);
        }
        return timescale;
    } catch (error) {
        console.error('Error parsing XML:', error.message);
        throw error;
    }
};

export const extractSegmentTemplateDuration = async (mpdPath) => {
    const data = fs.readFileSync(mpdPath, 'utf8');
    const options = {
        explicitArray: false,
        mergeAttrs: true,
    };
    try {
        const result = await xml2js.parseStringPromise(data, options);
        const adaptationSet = result['MPD']?.['Period']?.['AdaptationSet'];
        let duration = "";
        if (Array.isArray(adaptationSet)) {
            duration = result['MPD']?.['Period']?.['AdaptationSet'][0]?.['Representation']?.['SegmentTemplate'].duration;
        } else {
            duration = result['MPD']?.['Period']?.['AdaptationSet']?.['Representation']?.['SegmentTemplate'].duration;
        }

        if (duration === "") {
            throw new Error(`duration not found in ${mpdPath}`);
        }
        return duration;
    } catch (error) {
        console.error('Error parsing XML:', error.message);
        throw error;
    }
};

export const extractAudioChannelConfiguration = async (mpdPath) => {
    const data = fs.readFileSync(mpdPath, 'utf8');
    const options = {
        explicitArray: false,  // Avoid wrapping tags in arrays if there's only one occurrence
        mergeAttrs: true,      // Merge attributes into the tag object
    };
    try {
        const result = await xml2js.parseStringPromise(data, options);
        const adaptationSet = result['MPD']?.['Period']?.['AdaptationSet'];
        let audioChannelConfiguration = "";
        if (Array.isArray(adaptationSet)) {
            audioChannelConfiguration = result['MPD']?.['Period']?.['AdaptationSet'][1]?.['Representation']?.['AudioChannelConfiguration'];
        } else {
            audioChannelConfiguration = result['MPD']?.['Period']?.['AdaptationSet']?.['Representation']?.['AudioChannelConfiguration'];
        }
        if (audioChannelConfiguration === "" || !audioChannelConfiguration) {
            throw new Error(`AudioChannelConfiguration not found in ${mpdPath}`);
        }
        const schemeIdUri = audioChannelConfiguration['schemeIdUri'];
        const value = audioChannelConfiguration['value'];
        if (!schemeIdUri || !value) {
            throw new Error('Required attributes (schemeIdUri, value) missing from AudioChannelConfiguration.');
        }
        return `<AudioChannelConfiguration schemeIdUri="${schemeIdUri}" value="${value}" />`;
    } catch (error) {
        console.error(`Error parsing ${mpdPath}:`, error.message);
        throw error;
    }
};

export const createChannelMpd = (channel) => {
    console.log(`Creating MPD file: ${channel}.mpd…`);
    const mpdPath = createUnifiedMpdPath(channel);
    const mpdHeader = createUnifiedMpdHeader();
    const directory = path.dirname(mpdPath);
    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        fs.writeFileSync(mpdPath, mpdHeader);
        return mpdPath;
    } catch (error) {
        throw new Error(`Failed to create MPD file at ${mpdPath}: ${error.message}`);
    }
};

export const addContentToMpd = (mpdPath, content) => {
    try {
        fs.appendFileSync(mpdPath, `\n${content}`);
    } catch (error) {
        throw new Error(`Failed to update MPD file at ${mpdPath}: ${error.message}`);
    }
};

export const finalizeMpd = async (mpdPath) => {
    console.log(`Finalizing MPD…`);
    try {
        const mpdFooter = createUnifiedMpdFooter();
        fs.appendFileSync(mpdPath, `\n${mpdFooter}`);

        const totalDuration = await getTotalPeriodsDurations(mpdPath);
        addMediaPresentationDuration(mpdPath, totalDuration);
    } catch (error) {
        throw new Error(`Failed to finalize MPD file at ${mpdPath}: ${error.message}`);
    }
};

export const createUnifiedMPD = async (playlist, channel) => {
    const singleMpdPaths = await encodeTracks(playlist, channel);

    const unifiedMPDPath = createUnifiedMpdPath(channel);
    const unifiedMPDHeader = createUnifiedMpdHeader();
    const unifiedMPDFooter = createUnifiedMpdFooter();
    const unifiedMPDPeriods = await createUnifiedMpdPeriods(playlist, singleMpdPaths);

    console.log(`Creating unified MPD…`);
    const unifiedMPD = [
        unifiedMPDHeader,
        unifiedMPDPeriods,
        unifiedMPDFooter
    ].join('\n');
    fs.writeFileSync(unifiedMPDPath, unifiedMPD);

    return unifiedMPDPath;
};

const createUnifiedMpdHeader = () => {
    const mpdHeader = `<?xml version="1.0" encoding="UTF-8"?>
    <MPD xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns="urn:mpeg:dash:schema:mpd:2011"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
        profiles="urn:mpeg:dash:profile:isoff-live:2011"
        type="static">`;

    return mpdHeader;
};

const createUnifiedMpdFooter = () => {
    const mpdFooter = `</MPD>`;

    return mpdFooter;
}

const createUnifiedMpdPath = (channel) => {
    const mpdPath = `${process.env.PUBLIC_MPD_PATH}/${channel}.mpd`;

    return mpdPath;
};

export const transformMpdIntoPeriod = async (index, sourceMpd, channel) => {
    const periodDuration = await extractMediaPresentationDuration(sourceMpd);
    const audioChannelConfiguration = await extractAudioChannelConfiguration(sourceMpd);
    const timescale = await extractTimescale(sourceMpd);
    const segmentTemplateDuration = await extractSegmentTemplateDuration(sourceMpd);
    const initSegmentRoute = createInitSegmentRoute(index, channel);
    const mediaSegmentRoute = createMediaSegmentRoute(index, channel);

    return `
      <Period id="track${index}" duration="${periodDuration}">
        <AdaptationSet id="track${index}" contentType="audio" startWithSAP="1" segmentAlignment="true" bitstreamSwitching="true">
          <Representation id="track${index}" mimeType="audio/mp4" codecs="mp4a.40.2" bandwidth="128000" audioSamplingRate="44100">
            ${audioChannelConfiguration}
            <SegmentTemplate timescale="${timescale}" duration="${segmentTemplateDuration}" initialization="${initSegmentRoute}" media="${mediaSegmentRoute}" startNumber="1">
            </SegmentTemplate>
          </Representation>
        </AdaptationSet>
      </Period>`;
};

const createUnifiedMpdPeriods = async (tracks, singleMpdPaths) => {
    const mpdPeriods = await Promise.all(
        tracks.map((track, index) =>
            createUnifiedMpdPeriod(track, index, singleMpdPaths[index])
        )
    );

    return mpdPeriods.join('\n');
};

const createInitSegmentRoute = (trackIndex, channel) => {
    return `${process.env.BACKEND_URL}/segment/${channel}/track${trackIndex}_init.mp4`;
};

const createMediaSegmentRoute = (trackIndex, channel) => {
    return `${process.env.BACKEND_URL}/segment/${channel}/track${trackIndex}_$Number$.m4s`;
};

export const uploadMpd = async (mpdPath) => {
    if (!fs.existsSync(mpdPath)) {
        throw new Error(`File not found at path: ${mpdPath}`);
    }

    const mpdStream = fs.createReadStream(mpdPath);
    const mpdName = path.basename(mpdPath);

    const uploadedMpdName = await mpdRepository.uploadMpd(mpdStream, mpdName);

    return uploadedMpdName;
};

export const getMpdStream = async (channelName) => {
    const mpdStream = await mpdRepository.getMpd(channelName);
    return mpdStream;
};

export const createSegmentsDirectory = async (channelName) => {
    const directory = `./public/${channelName}`;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    return directory;
}

export const getTotalPeriodsDurations = async (mpdPath) => {
    const data = fs.readFileSync(mpdPath, 'utf8');
    const options = {
        explicitArray: false,
        mergeAttrs: true,
    };
    try {
        const result = await xml2js.parseStringPromise(data, options);
        // Extract all Period durations from the MPD content
        const periods = Array.isArray(result.MPD.Period) ? result.MPD.Period : [result.MPD.Period];
        let totalSeconds = 0;

        // Convert ISO 8601 durations (e.g., PT1H2M53.1S) to total seconds
        periods.forEach((period) => {
            const duration = period.duration;
            totalSeconds += iso8601DurationToSeconds(duration);
        });

        // Convert total seconds back to ISO 8601 duration format
        return secondsToIso8601Duration(totalSeconds);
    } catch (error) {
        console.error('Error parsing XML:', error.message);
        throw error;
    }
};

// Helper function to convert ISO 8601 duration string to total seconds
const iso8601DurationToSeconds = (duration) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(\d+(?:\.\d+)?)S/;
    const match = duration.match(regex);
    let hours = 0, minutes = 0, seconds = 0;
    if (match) {
        if (match[1]) hours = parseInt(match[1], 10) * 3600; // Convert hours to seconds
        if (match[2]) minutes = parseInt(match[2], 10) * 60; // Convert minutes to seconds
        if (match[3]) seconds = parseFloat(match[3]); // Parse seconds (including fractional part)

        return hours + minutes + seconds;
    }
    return 0;
};

// Helper function to convert total seconds back to ISO 8601 duration format
const secondsToIso8601Duration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(1);
    return `PT${hours}H${minutes}M${seconds}S`;
};

export const addMediaPresentationDuration = async (mpdPath, mediaPresentationDuration) => {
    // Read the MPD content from the file
    const mpdContent = fs.readFileSync(mpdPath, 'utf-8');

    // Replace type="static"> with type="static" mediaPresentationDuration="...">
    const updatedMpdContent = mpdContent.replace(
        /type="static">/,
        `type="static"
        mediaPresentationDuration="${mediaPresentationDuration}">`
    );

    // Write the updated MPD content back to the file
    fs.writeFileSync(mpdPath, updatedMpdContent, 'utf-8');

    // Return the updated MPD content
    return updatedMpdContent;
};
