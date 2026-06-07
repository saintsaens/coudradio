
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

// The frontend pings activity roughly every ACTIVITY_PING_INTERVAL_SECONDS while
// audio is playing. A single delta should therefore never be much larger than
// that interval. We allow ~one missed ping of slack and clamp anything beyond it,
// so that sleep / throttled-background-tab / inter-session gaps can't be booked
// as continuous listening time.
export const ACTIVITY_PING_INTERVAL_SECONDS = 59;
export const MAX_ACTIVITY_DELTA_SECONDS = 2 * ACTIVITY_PING_INTERVAL_SECONDS; // 118

export const clampActivityDelta = (seconds) => Math.min(seconds, MAX_ACTIVITY_DELTA_SECONDS);
