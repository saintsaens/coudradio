import React from 'react';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import FullOverlay from "./FullOverlay";

const Loading = ({ channelName }) => {
    return (
        <Fade in timeout={300}>
            <FullOverlay>
                <Typography variant="h3">
                    {channelName ? `Connecting to ${channelName}…` : 'Connecting…'}
                </Typography>
            </FullOverlay>
        </Fade>
    );
};

export default Loading;