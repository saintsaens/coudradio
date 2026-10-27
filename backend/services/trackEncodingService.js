import ffmpeg from 'fluent-ffmpeg';
import path from "path";
import { ensureDirectoryExists } from "./channelCreationService/fileSystemService.js";

const getTrackDuration = (trackUrl) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(trackUrl, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });

// Encodes the input into DASH segments named after the id (e.g. track12_init.mp4, track12_1.m4s)
// and resolves with the path of the single-track MPD ffmpeg writes next to them
export const encodeTrack = async ({ input, directory, id }) => {
  await ensureDirectoryExists(directory);
  const playlistPath = path.join(directory, `${id}.mpd`);

  const duration = await getTrackDuration(input);
  // loudnorm needs sufficient audio to measure integrated loudness; skip it for very short clips
  const useLoudnorm = duration >= 2;

  return new Promise((resolve, reject) => {
    const stderrLines = [];
    const command = ffmpeg()
      .input(input)
      .output(playlistPath)
      .noVideo()
      .audioCodec('aac')
      .audioBitrate('320k')
      .format('dash');

    if (useLoudnorm) {
      command.audioFilters('loudnorm=I=-14:TP=-1:LRA=11');
    }

    command
      .outputOptions([
        '-y',                           // Overwrite output files without asking
        '-dash_segment_type', 'mp4',     // Use MP4 segments
        '-use_timeline', '0',             // Disable timeline (use sequence numbers)
        '-use_template', '1',             // Enable templates for segment names
        '-init_seg_name', `${id}_init.mp4`,  // Name for the initialization segment
        '-media_seg_name', `${id}_$Number$.m4s`,  // Template for media segments
      ])
      .on('stderr', (line) => stderrLines.push(line))
      .on('error', (err) => {
        console.error(`FFmpeg error on ${id}:`, err.message);
        console.error('FFmpeg stderr:\n' + stderrLines.slice(-20).join('\n'));
        reject(err);
      })
      .on('end', () => {
        resolve(playlistPath);
      });

    command.run();
  });
};
