import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import TrackPlayer from 'react-native-track-player';
import { PlayerProvider } from '../context/PlayerContext';
import { PlaybackService } from '../services/PlaybackService';

TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  useFonts({
    'iAWriterDuospace-Regular': require('../assets/fonts/iAWriterDuospace-Regular.otf'),
    'iAWriterDuospace-Bold': require('../assets/fonts/iAWriterDuospace-Bold.otf'),
  });

  return (
    <PlayerProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#041C32',
          },
          headerTitleStyle: {
            fontFamily: 'iAWriterDuospace-Regular',
            color: '#ECB365',
          },
          headerTitle: '',
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: '#041C32',
          },
        }}
      />
    </PlayerProvider>
  );
}
