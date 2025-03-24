import fs from "fs";
import path from "path";
import { uploadSegment } from "./segmentsService.js";

export const uploadTrackSegments = async (trackPath, channel) => {
    const segmentPaths = getTrackSegments(trackPath);
    await Promise.all(segmentPaths.map(segmentPath => uploadSegment(segmentPath, channel)));
};

export const getTrackSegments = (trackPath) => {
    if (!trackPath || typeof trackPath !== "string" || !trackPath.endsWith(".mpd")) {
        throw new Error("Invalid trackPath. Must be a valid MPD file path.");
    }

    const directory = path.dirname(trackPath); // Extract the directory path
    const baseName = path.basename(trackPath, ".mpd"); // Remove the .mpd extension

    try {
        const files = fs.readdirSync(directory); // Read all files in the directory

        // Filter files that match the pattern "<baseName>_<number>.m4s" or "<baseName>_init.mp4"
        const segmentPaths = files
            .filter(
                file =>
                    (file.startsWith(baseName) && file.endsWith(".m4s")) || // Match media segments
                    file === `${baseName}_init.mp4` // Match the initialization segment
            )
            .map(file => path.join(directory, file)); // Construct full paths

        return segmentPaths;
    } catch (error) {
        throw new Error(`Error reading directory: ${error.message}`);
    }
};
