import React from 'react';
import Typography from '@mui/material/Typography';
import FullOverlay from "./FullOverlay";

const Unavailable = () => {
    return (
        <FullOverlay>
            <Typography variant="h2"
            sx={{
                textAlign: "center"
            }}>
                Coudradio not available right now.
            </Typography>
        </FullOverlay>
    );
};

export default Unavailable;
