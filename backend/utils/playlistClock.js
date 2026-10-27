// Every channel loops from this instant, so the position in a channel is (now - PLAYLIST_START) % its duration
export const PLAYLIST_START = new Date('2024-05-04T13:37:00+01:00').getTime() / 1000;
