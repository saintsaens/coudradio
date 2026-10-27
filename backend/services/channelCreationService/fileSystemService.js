import { promises as fsPromises } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const localChannelDirectoryFor = (channelName) => {
    validateEnv();
    return path.join(process.env.PUBLIC_DIR, channelName);
};

export const localTrackDirectoryFor = (channelName, trackId) => {
    validateEnv();
    return path.join(process.env.PUBLIC_DIR, channelName, trackId);
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

export const removeLocalDirectory = async (dir) => {
    try {
        await fsPromises.rm(dir, { recursive: true, force: true });
    } catch (error) {
        console.error(`Failed to delete directory at ${dir}: ${error.message}`);
    }
};

const validateEnv = () => {
    if (!process.env.PUBLIC_DIR) {
        throw new Error('PUBLIC_DIR is not set');
    }
};
