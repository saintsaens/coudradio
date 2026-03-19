import { FlatList, View, Text, StyleSheet, Pressable } from "react-native";
import { CHANNELS } from "../constants";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
    <FlatList
      data={CHANNELS}
      keyExtractor={(item) => item}
ItemSeparatorComponent={() => <View style={styles.divider} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/channel/${item}`)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <Text style={styles.text}>{item}</Text>
        </Pressable>
      )}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041C32',
  },
  row: {
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  rowPressed: {
    backgroundColor: '#064663',
  },
  text: {
    fontSize: 24,
    fontFamily: 'iAWriterDuospace-Regular',
    color: '#ECB365',
  },
  divider: {
    height: 1,
    backgroundColor: '#064663',
  },
});
