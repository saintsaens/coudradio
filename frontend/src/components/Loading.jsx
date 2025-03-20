import React from 'react';
import Typography from '@mui/material/Typography';
import FullOverlay from "./FullOverlay";

const Loading = () => {
    return (
        <FullOverlay>
            <Typography variant="h2">
                Loading…
            </Typography>
        </FullOverlay>
    );
};

export default Loading;