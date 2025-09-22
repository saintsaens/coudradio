import { View, Text, StyleSheet, Pressable } from "react-native";
import { CHANNELS } from "../constants";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {CHANNELS.map((channel, index) => (
        <Pressable
          key={channel}
          onPress={() => router.push(`/channel/${channel}`)}
          style={({ pressed }) => [
            styles.section,
            pressed && styles.sectionPressed,
          ]}
        >
          <Text style={styles.text}>{channel}</Text>
          {index < CHANNELS.length - 1 && <View style={styles.divider} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    flex: 1, // take equal vertical space
    justifyContent: "center", // center vertically
    alignItems: "center", // center horizontally
    width: "100%",
  },
  sectionPressed: {
    backgroundColor: "#064663",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#000000",
    position: "absolute",
    bottom: 0,
  },
});