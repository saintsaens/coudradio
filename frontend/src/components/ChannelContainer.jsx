import React from 'react';
import Body from "./Body/Body";
import Footer from "./Footer/Footer";
import Grid from '@mui/material/Grid2';
import WebCommands from "./Commands/WebCommands";

export default function ChannelContainer({ channelName }) {
    return (
        <Grid container
            sx={{
                height: "100%",
                padding: 2,
            }}>
            <Grid
                size={12}
                sx={{ height: "20%" }}
            >
                <WebCommands />
            </Grid>
            <Grid
                size={12}
                sx={{ height: "60%" }}
            >
                <Body channelName={channelName} />
            </Grid>
            <Grid
                size={12}
                sx={{ height: "20%" }}
            >
                <Footer />
            </Grid>
        </Grid>
    );
}
