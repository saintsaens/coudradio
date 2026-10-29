export const computeStartTime = (playlistDuration) => {
    const playlistStartTime = new Date('2024-05-04T13:37:00+01:00').getTime() / 1000;
    const nowInSeconds = new Date().getTime() / 1000;
    const startTime = (nowInSeconds - playlistStartTime) % playlistDuration;

    return startTime;
};
