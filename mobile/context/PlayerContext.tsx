import { createContext, useContext, useRef, useState } from "react";
import Video, { VideoRef } from "react-native-video";
import { StyleSheet } from "react-native";

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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [channelName, setChannelName] = useState<string | null>(null);
    const [muted, setMuted] = useState(false);
    const videoRef = useRef<VideoRef>(null);

    const handleLoad = (data: { duration: number }) => {
        const start = computeStartTime(data.duration);
        videoRef.current?.seek(start);
    };

    return (
        <PlayerContext.Provider value={{ channelName, setChannelName, muted, setMuted }}>
            {channelName && (
                <Video
                    ref={videoRef}
                    source={{ uri: `https://cestunpeu.troal.me/api/${channelName}`, type: "mpd" }}
                    paused={false}
                    audioOnly={true}
                    muted={muted}
                    playInBackground={true}
                    playWhenInactive={true}
                    style={styles.hidden}
                    onLoad={handleLoad}
                    onError={(e) => console.error("Stream error:", JSON.stringify(e))}
                />
            )}
            {children}
        </PlayerContext.Provider>
    );
}

const styles = StyleSheet.create({
    hidden: {
        width: 0,
        height: 0,
    },
});
