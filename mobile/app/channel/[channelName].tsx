import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ChannelScreen() {
    const router = useRouter();
    const { channelName } = useLocalSearchParams<{ channelName: string }>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{channelName}</Text>
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
