export const computeStartTime = (playlistDuration) => {
    const playlistStartTime = new Date('2024-05-04T13:37:00+01:00').getTime() / 1000;
    const nowInSeconds = new Date().getTime() / 1000;
    const startTime = (nowInSeconds - playlistStartTime) % playlistDuration;

    return startTime;
};

export const parseISODuration = (iso) => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
    if (!match) return null;
    const hours = parseFloat(match[1] || 0);
    const minutes = parseFloat(match[2] || 0);
    const seconds = parseFloat(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
};
