import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import * as player from './player.js';

export default function App({ channels, backendUrl, defaultChannel }) {
  const { exit } = useApp();
  const [channelIndex, setChannelIndex] = useState(
    Math.max(0, channels.indexOf(defaultChannel))
  );
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);

  const channel = channels[channelIndex];

  useEffect(() => {
    setError(null);
    player.start(backendUrl, channel, { muted, onError: setError });
    return () => player.stop();
  }, [channel]);

  useInput((input, key) => {
    if (key.ctrl && input === 'k') {
      setChannelIndex((i) => (i + 1) % channels.length);
    } else if (input === 'k') {
      player.toggleMute().then(setMuted);
    } else if (key.ctrl && input === 'c') {
      player.stop();
      exit();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="cyan">◉ coudradio</Text>
      <Text> </Text>
      <Text>  ♪  <Text bold>{channel}</Text></Text>
      <Text>
        {'     '}
        {error
          ? <Text color="red">{error}</Text>
          : muted
            ? <Text color="yellow">muted</Text>
            : <Text color="green">playing</Text>
        }
      </Text>
      <Text> </Text>
      <Text dimColor>  k  mute/unmute   ^k  next channel   ^c  quit</Text>
    </Box>
  );
}
