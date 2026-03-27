import React from "react";
import { useSelector } from "react-redux";
import Typography from "@mui/material/Typography";

const ListenerCount = () => {
    const isMuted = useSelector((state) => state.audioPlayer.isMuted);
    const { authenticated, anonymous } = useSelector((state) => state.listeners);

    if (isMuted || authenticated + anonymous === 0) return null;

    const parts = [];
    if (authenticated > 0) parts.push(`${authenticated} listener${authenticated !== 1 ? 's' : ''}`);
    if (anonymous > 0) parts.push(`${anonymous} anonymous`);

    return (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {parts.join(' • ')}
        </Typography>
    );
};

export default ListenerCount;
