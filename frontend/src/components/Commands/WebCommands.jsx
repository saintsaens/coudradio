import React from 'react';
import WebMuteCommand from "./WebMuteCommand";
import WebSwitcherCommand from "./WebSwitcherCommand";
import Stack from "@mui/material/Stack";
import WebStatsCommand from "./WebStatsCommand";

const WebCommands = () => {
  return (
    <Stack spacing={1}>
      <WebMuteCommand />
      <WebSwitcherCommand />
      <WebStatsCommand />
    </Stack>
  );
};

export default WebCommands;
