import path from 'path';
import fs from 'fs/promises';

const getProgressFilePath = (channelName) => {
    return path.join(process.env.PUBLIC_MPD_PATH, `.${channelName}.progress.json`);
};

export const saveProgress = async (channelName, index) => {
    const filePath = getProgressFilePath(channelName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ lastIndex: index }), 'utf-8');
};

export const loadProgress = async (channelName) => {
    try {
        const filePath = getProgressFilePath(channelName);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data).lastIndex;
    } catch {
        return -1;
    }
};

export const cleanupProgress = async (channelName) => {
    await fs.rm(getProgressFilePath(channelName), { force: true });
};
