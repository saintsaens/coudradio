import React from 'react';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import FullOverlay from "./FullOverlay";

const Loading = () => {
    return (
        <Fade in timeout={300}>
            <FullOverlay>
                <Typography variant="h2">
                    Loading…
                </Typography>
            </FullOverlay>
        </Fade>
    );
};

export default Loading;