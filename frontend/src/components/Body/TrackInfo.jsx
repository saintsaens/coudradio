import React from 'react';
import { useSelector } from 'react-redux';
import Typography from '@mui/material/Typography';

export default function TrackInfo() {
    const track = useSelector((state) => state.currentTrack.track);
    if (!track) return null;
    return (
        <Typography variant="body2" sx={{ opacity: 0.5, mt: 0.5 }}>
            {track}
        </Typography>
    );
}
