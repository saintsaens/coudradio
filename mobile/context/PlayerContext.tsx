import { createContext, useContext, useEffect, useRef, useState } from "react";
import TrackPlayer, { Capability, Event, useProgress } from "react-native-track-player";

const EPOCH = new Date('2024-05-04T13:37:00+01:00').getTime() / 1000;

const computeStartTime = (playlistDuration: number): number => {
    const nowInSeconds = new Date().getTime() / 1000;
    return (nowInSeconds - EPOCH) % playlistDuration;
};

type PlayerContextType = {
    channelName: string | null;
    setChannelName: (name: string) => void;
    muted: boolean;
    setMuted: (muted: boolean) => void;
};

const PlayerContext = createContext<PlayerContextType>({
    channelName: null,
    setChannelName: () => {},
    muted: false,
    setMuted: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

async function setupPlayer() {
    await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
    await TrackPlayer.updateOptions({
        capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
        compactCapabilities: [Capability.Play, Capability.Pause],
    });
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [channelName, setChannelNameState] = useState<string | null>(null);
    const [muted, setMutedState] = useState(false);
    const hasSeekRef = useRef(false);
    const { duration } = useProgress();

    useEffect(() => {
        setupPlayer().catch(console.error);
    }, []);

    const setChannelName = (name: string) => {
        setChannelNameState(name);
        hasSeekRef.current = false;
        TrackPlayer.reset()
            .then(() => TrackPlayer.add({
                id: name,
                url: `https://cestunpeu.troal.me/api/${name}`,
                title: name,
                artist: 'Coudradio',
                artwork: require('../assets/icons/ios-light.png'),
            }))
            .then(() => TrackPlayer.play())
            .catch(console.error);
    };

    useEffect(() => {
        if (duration > 0 && channelName && !hasSeekRef.current) {
            hasSeekRef.current = true;
            TrackPlayer.seekTo(computeStartTime(duration)).catch(console.error);
        }
    }, [duration, channelName]);

    const setMuted = (value: boolean) => {
        setMutedState(value);
        TrackPlayer.setVolume(value ? 0 : 1).catch(console.error);
    };

    return (
        <PlayerContext.Provider value={{ channelName, setChannelName, muted, setMuted }}>
            {children}
        </PlayerContext.Provider>
    );
}
