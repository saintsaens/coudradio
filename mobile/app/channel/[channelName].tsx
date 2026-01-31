import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Video from "react-native-video";

export default function ChannelScreen() {
    const router = useRouter();
    const { channelName } = useLocalSearchParams<{ channelName: string }>();

    const streamUrl = `https://cestunpeu.troal.me/api/${channelName}.mpd`;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{channelName}</Text>
            <Video
                source={{ uri: streamUrl }}
                controls={true}
                resizeMode="cover"
                paused={false}
            />

            {/* Bottom-right back button */}
            <Pressable
                style={styles.backButton}
                onPress={() => router.back()} // goes back to previous screen
            >
                <Text style={styles.backText}>← Channels</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
    },
    backButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#041c32",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
    },
    backText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
