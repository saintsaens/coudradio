import React from 'react';
import Body from "./Body/Body";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';

export default function MobileChannelContainer({ channelName }) {
    return (
        <Grid container sx={{ height: "100%", padding: 2 }}>
            <Grid size={12} sx={{ height: "20%" }}>
                <Typography variant="body2">Tap: mute</Typography>
            </Grid>
            <Grid size={12} sx={{ height: "60%" }}>
                <Body channelName={channelName} />
            </Grid>
            <Grid size={12} sx={{ height: "20%" }}>
            </Grid>
        </Grid>
    );
}
