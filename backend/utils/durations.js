import { fetchTracks } from "../services/trackLoader.js";

export const generateStartTime = async () => {
    // const startTime = new Date('2024-05-04T13:37:00Z').getTime();
    const now = Date.now();
    // const { totalDuration } = await fetchTracks();
    // const elapsed = (now - startTime) % totalDuration;

    // return elapsed;
    return now;
};

export const computeTimeSpent = (startTime, currentTime) => {
    const start = new Date(startTime);
    const current = new Date(currentTime);
    const diffSeconds = Math.floor((current - start) / 1000);

    if (diffSeconds < 0) {
        throw new Error("currentTime must be after startTime");
    }

    return diffSeconds;
};
