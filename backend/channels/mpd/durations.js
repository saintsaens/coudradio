// Helper function to convert ISO 8601 duration string to total seconds
export const iso8601DurationToSeconds = (duration) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(\d+(?:\.\d+)?)S/;
    const match = duration.match(regex);
    let hours = 0, minutes = 0, seconds = 0;
    if (match) {
        if (match[1]) hours = parseInt(match[1], 10) * 3600; // Convert hours to seconds
        if (match[2]) minutes = parseInt(match[2], 10) * 60; // Convert minutes to seconds
        if (match[3]) seconds = parseFloat(match[3]); // Parse seconds (including fractional part)

        return hours + minutes + seconds;
    }
    return 0;
};

// Helper function to convert total seconds back to ISO 8601 duration format
export const secondsToIso8601Duration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = parseFloat((totalSeconds % 60).toFixed(3));
    return `PT${hours}H${minutes}M${seconds}S`;
};
