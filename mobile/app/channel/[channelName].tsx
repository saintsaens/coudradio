import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePlayer } from "../../context/PlayerContext";

export default function ChannelScreen() {
    const router = useRouter();
    const { channelName } = useLocalSearchParams<{ channelName: string }>();
    const { setChannelName, muted, setMuted } = usePlayer();

    useEffect(() => {
        setChannelName(channelName);
    }, [channelName]);

    return (
        <Pressable style={styles.container} onPress={() => setMuted(!muted)}>
            {muted ? (
                <Text style={styles.unmute}>tap to unmute</Text>
            ) : (
                <Text style={styles.title}>{channelName}</Text>
            )}

            <Pressable
                style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                onPress={() => router.back()}
            >
                <Text style={styles.backText}>← Channels</Text>
            </Pressable>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#041C32',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: 'iAWriterDuospace-Regular',
        color: '#ECB365',
    },
    unmute: {
        fontSize: 48,
        fontFamily: 'iAWriterDuospace-Regular',
        color: '#ECB365',
    },
    backButton: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        backgroundColor: '#04293A',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    backButtonPressed: {
        backgroundColor: '#064663',
    },
    backText: {
        color: '#ECB365',
        fontSize: 18,
        fontFamily: 'iAWriterDuospace-Regular',
    },
});
