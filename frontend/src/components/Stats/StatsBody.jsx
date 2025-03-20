import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useSelector } from "react-redux";
import ListeningTime from "./ListeningTime";

const StatsBody = () => {
    const { username, isSubscriber, email } = useSelector((state) => state.user);

    return (
        <Stack spacing={2} alignItems="center">
            {username ? (
                <Typography variant="body1">{`Recording listening time as ${username} (${email}).`}</Typography>
            ) : (
                <Typography variant="body1">Log in to record your listening time.</Typography>
            )}
            {!isSubscriber &&
                <Typography>Subscribe (5€/month) to see it.</Typography>
            }
            {isSubscriber &&
                <ListeningTime />
            }
        </Stack>
    );
};

export default StatsBody;
