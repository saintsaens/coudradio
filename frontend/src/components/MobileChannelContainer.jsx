import React from 'react';
import Body from "./Body/Body";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';
import Button from "@mui/material/Button";

export default function MobileChannelContainer({ channelName, onShowChannels }) {

    return (
        <Grid container sx={{ height: "100%", padding: 2 }}>
            <Grid size={12} sx={{ height: "20%" }}>
                <Typography variant="body2">Tap: mute</Typography>
            </Grid>
            <Grid size={12} sx={{ height: "60%" }}>
                <Body channelName={channelName} />
            </Grid>
            <Grid size={12} sx={{ height: "20%", display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Button
                    onClick={(e) => { e.stopPropagation(); onShowChannels?.(); }}
                    sx={{
                        color: '#ECB365',
                        bgcolor: '#04293A',
                        borderRadius: 4,
                        px: 3,
                        py: 1.5,
                        mb: 2,
                        '&:hover': { bgcolor: '#064663' },
                    }}
                >
                    ← Channels
                </Button>
            </Grid>
        </Grid>
    );
}
