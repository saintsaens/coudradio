import fs from "fs/promises";
import path from "path";
import { uploadSegment } from "./segmentsService.js";
import { localChannelDirectoryFor } from "./channelCreationService/fileSystemService.js";

export const uploadTrackSegments = async (channelName) => {
    const segmentPaths = getTrackSegments(channelName);
    await Promise.all(segmentPaths.map(segmentPath => uploadSegment(segmentPath, channel)));
};

export const getTrackSegments = async (channelName) => {
  const directory = localChannelDirectoryFor(channelName);

  const files = await fs.readdir(directory);

  return files
    .filter(
      file =>
        file.endsWith(".m4s") ||
        file.endsWith("_init.mp4")
    )
    .map(file => path.join(directory, file));
};
