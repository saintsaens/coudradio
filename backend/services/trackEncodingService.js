import ffmpeg from 'fluent-ffmpeg';
import path from "path";
import fs from "fs";
import util from "util";
import { localTrackDirectoryFor, ensureDirectoryExists } from "./channelCreationService/fileSystemService.js";

const unlink = util.promisify(fs.unlink);

const getTrackDuration = (trackUrl) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(trackUrl, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });

export const encodeTrack = async (index, playlist, channelName) => {
  const trackDirectory = localTrackDirectoryFor(channelName, index);
  await ensureDirectoryExists(trackDirectory);
  const currentTrack = playlist[index];
  const playlistPath = `${trackDirectory}/track${index}.mpd`;

  const duration = await getTrackDuration(currentTrack);
  // loudnorm needs sufficient audio to measure integrated loudness; skip it for very short clips
  const useLoudnorm = duration >= 2;

  return new Promise((resolve, reject) => {
    const stderrLines = [];
    const command = ffmpeg()
      .input(currentTrack)
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
        '-init_seg_name', `track${index}_init.mp4`,  // Name for the initialization segment
        '-media_seg_name', `track${index}_$Number$.m4s`,  // Template for media segments
      ])
      .on('stderr', (line) => stderrLines.push(line))
      .on('error', (err) => {
        console.error(`FFmpeg error on track ${index}:`, err.message);
        console.error('FFmpeg stderr:\n' + stderrLines.slice(-20).join('\n'));
        reject(err);
      })
      .on('end', () => {
        resolve(playlistPath);
      });

    command.run();
  });
};


export const encodeTracks = async (playlist, channel) => {
  const channelPath = `./public/${channel}`;
  if (!fs.existsSync(channelPath)) {
    fs.mkdirSync(channelPath, { recursive: true });
  }
  const mpdPaths = [];

  for (let index = 0; index < playlist.length; index++) {
    // Encode the track
    console.log(`Encoding track${index}…`);
    const singleTrackMpdPath = await encodeTrack(index, playlist, channelPath);

    // Store the MPD path
    mpdPaths.push(singleTrackMpdPath);
  }

  return mpdPaths;
};

export const deleteSegmentsAndMpd = async (mpdPath) => {
  console.log(`Deleting all segments and single track mpd locally…`);
  const directory = path.dirname(mpdPath);
  const baseName = path.basename(mpdPath, '.mpd');
  const segmentFiles = fs.readdirSync(directory)
    .filter(file => file.startsWith(baseName) && (file.endsWith('.m4s') || file.endsWith('_init.mp4') || file.endsWith('.mpd')));
  for (const file of segmentFiles) {
    const filePath = path.join(directory, file);
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
    }
  }
};
