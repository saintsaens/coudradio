import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

const ffprobe = promisify(ffmpeg.ffprobe);

export const getTrackDuration = async (trackPath) => {
    const metadata = await ffprobe(trackPath);
    return metadata.format.duration * 1000; // duration in milliseconds
}

export const getTrackName = async (trackPath) => {
    try {
        const metadata = await ffprobe(trackPath);
        const tags = metadata.format.tags || {};
        
        // Try different tag variations
        const title = tags.TITLE || tags.title || tags.Title;
        
        if (title) return title;
        
        // Fallback to filename without extension
        return path.basename(trackPath, path.extname(trackPath));
    } catch (err) {
        console.error('Error getting track name:', err);
        return 'Unknown Title';
    }
}

export const getTrackArtist = async (trackPath) => {
    try {
        const metadata = await ffprobe(trackPath);
        const tags = metadata.format.tags || {};
        
        // Try different tag variations
        const artist = tags.ARTIST || tags.artist || tags.Artist;
        
        if (artist) return artist;
        
        // Fallback to 'Unknown Artist'
        return 'Unknown Artist';
    } catch (err) {
        console.error('Error getting track artist:', err);
        return 'Unknown Artist';
    }
}
