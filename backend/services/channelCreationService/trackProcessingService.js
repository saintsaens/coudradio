import { encodeTrack } from "../trackEncodingService.js";
import { getTrackUrl } from "../../repositories/trackRepository.js";
import { parseEncodedTrackMpd } from "../channelManifestService.js";
import {
    localChannelDirectoryFor,
    localTrackDirectoryFor,
    removeLocalDirectory
} from "./fileSystemService.js";
import { uploadSegment } from "./segmentsUploadingService.js";
import fs from "fs/promises";
import path from "path";

// A re-encoded track whose length changes by more than this is probably not the same recording
export const DURATION_TOLERANCE_SECONDS = 1;

const timestamp = () => new Date().toLocaleTimeString('en-GB');

const encodeJob = async (channelName, job) => {
    const directory = localTrackDirectoryFor(channelName, job.id);
    // Leftovers from an interrupted run would otherwise be uploaded with the new segments
    await removeLocalDirectory(directory);
    const input = await getTrackUrl(channelName, job.source);
    const mpdPath = await encodeTrack({ input, directory, id: job.id });
    return parseEncodedTrackMpd(await fs.readFile(mpdPath, 'utf-8'));
};

// Encodes each job ({ id, source, expectedDuration? }) and uploads its segments, encoding the next track
// while the current one uploads. onTrackDone(job, encoding) runs after each successful upload.
// A failed track is reported and skipped; the others still go through.
export const processTracks = async ({ channelName, jobs, onTrackDone }) => {
    const failed = [];
    const start = (job) => encodeJob(channelName, job).then(
        (encoding) => ({ encoding }),
        (error) => ({ error })
    );

    let next = jobs.length ? start(jobs[0]) : null;
    for (let index = 0; index < jobs.length; index++) {
        const job = jobs[index];
        console.log(`[${timestamp()}] Encoding track ${index + 1} of ${jobs.length}: ${job.id} ${job.source}`);

        const { encoding, error } = await next;
        if (index + 1 < jobs.length) {
            next = start(jobs[index + 1]);
        }

        try {
            if (error) throw error;
            checkDuration(job, encoding);
            await uploadTrackSegments(channelName, job.id);
            await onTrackDone(job, encoding);
        } catch (err) {
            console.error(`[${timestamp()}] ✗ ${job.id} ${job.source}: ${err.message}`);
            failed.push({ job, error: err });
        } finally {
            await removeLocalDirectory(localTrackDirectoryFor(channelName, job.id));
        }
    }

    await removeLocalDirectory(localChannelDirectoryFor(channelName));
    return { failed };
};

const checkDuration = (job, encoding) => {
    if (job.expectedDuration === undefined) return;
    const difference = Math.abs(encoding.duration - job.expectedDuration);
    if (difference > DURATION_TOLERANCE_SECONDS) {
        throw new Error(`The new encoding lasts ${encoding.duration.toFixed(1)}s instead of ${job.expectedDuration.toFixed(1)}s: is the source file the right one? Nothing was uploaded`);
    }
};

export const uploadTrackSegments = async (channelName, trackId, concurrency = 4) => {
    console.log(`[${timestamp()}] Uploading segments for ${trackId}…`);
    const segments = await getAllTrackSegments(channelName, trackId);
    const results = [];

    const logProgress = createProgressLogger(segments.length, 100);

    let index = 0;

    async function worker() {
        while (index < segments.length) {
            const segmentPath = segments[index++];
            const segmentName = path.basename(segmentPath);

            const result = await uploadSegment(
                segmentPath,
                segmentName,
                channelName
            );

            results.push(result);
            logProgress();
        }
    }

    const workers = Array.from({ length: concurrency }, worker);
    await Promise.all(workers);

    const failedCount = results.filter(result => result === null).length;
    if (failedCount > 0) {
        throw new Error(`Failed to upload ${failedCount} of ${segments.length} segments for ${trackId}`);
    }

    return results;
};

export const getAllTrackSegments = async (channelName, trackId) => {
    const directory = localTrackDirectoryFor(channelName, trackId);

    const files = await fs.readdir(directory);

    return files
        .filter(
            file =>
                file.endsWith(".m4s") ||
                file.endsWith("_init.mp4")
        )
        .map(file => path.join(directory, file));
};

const createProgressLogger = (total, step = 100) => {
    let completed = 0;

    return () => {
        completed++;
        if (completed % step === 0 || completed === total) {
            console.log(`[${timestamp()}] Uploaded ${completed}/${total} segments`);
        }
    };
};
