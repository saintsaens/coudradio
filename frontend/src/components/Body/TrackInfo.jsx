import React from 'react';
import { useSelector } from 'react-redux';
import Typography from '@mui/material/Typography';

export default function TrackInfo() {
    const { name, artist } = useSelector((state) => state.currentTrack);
    if (!name) return null;
    return (
        <Typography variant="body2" sx={{ opacity: 0.6, mt: 0.5 }}>
            {artist ? `${artist} — ${name}` : name}
        </Typography>
    );
}
