import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from "react-redux";
import ListeningTime from "./ListeningTime";

const StatsBody = () => {
    const { username, email } = useSelector((state) => state.user);

    return (
        <Box sx={{ width: 360 }}>
            {!username ? (
                <Typography variant="body2" sx={{ opacity: 0.4 }}>
                    log in to track your time.
                </Typography>
            ) : (
                <ListeningTime />
            )}
            {username && (
                <Typography variant="body2" sx={{ opacity: 0.2, mt: 4 }}>
                    {email}
                </Typography>
            )}
        </Box>
    );
};

export default StatsBody;
