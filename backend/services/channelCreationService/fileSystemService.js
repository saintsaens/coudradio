import { promises as fsPromises } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const localChannelDirectoryFor = (channelName) => {
    validateEnv();
    return path.join(process.env.PUBLIC_DIR, channelName);
};

export const ensureDirectoryExists = async (dirPath) => {
    try {
        await fsPromises.mkdir(dirPath, { recursive: true });
    } catch (err) {
        if (err.code !== "EEXIST") {
            throw err;
        }
    }
};

export const createLocalChannelDirectory = async (channelName) => {
    const dir = localChannelDirectoryFor(channelName);
    ensureDirectoryExists(dir);
};

export const deleteLocalChannelDirectory = async (channelName) => {
    const dir = localChannelDirectoryFor(channelName);
    try {
        await fsPromises.rmdir(dir, { recursive: true });
    } catch (error) {
        console.error(`Failed to delete directory at ${dir}: ${error.message}`);
    }
};

export const channelMpdPathFor = (channelName) => {
    validateEnv();
    return path.join(process.env.PUBLIC_MPD_PATH, `${channelName}.mpd`);
};

export const deleteTrackMpd = async (mpdPath) => {
    try {
        await fsPromises.unlink(filePath);
    } catch (error) {
        console.error(`Failed to delete file at ${filePath}: ${error.message}`);
    }
}

export const cleanUpLocalChannelDirectory = async (channelName) => {
    const dir = localChannelDirectoryFor(channelName);

    try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await fsPromises.rm(entryPath, { recursive: true, force: true });
            } else {
                await fsPromises.unlink(entryPath);
            }
        }
    } catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
    }
};

const validateEnv = () => {
    if (!process.env.PUBLIC_MPD_PATH || !process.env.PUBLIC_DIR) {
        throw new Error('PUBLIC_MPD_PATH is not set');
    }
};
