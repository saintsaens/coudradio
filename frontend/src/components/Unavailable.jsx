import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import FullOverlay from "./FullOverlay";
import useIsMobile from "../hooks/useIsMobile";

const Unavailable = ({ onRetry }) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key.toLowerCase() === 'r') onRetry?.();
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [onRetry]);

    return (
        <FullOverlay onClick={isMobile ? onRetry : undefined} sx={isMobile ? { cursor: 'pointer' } : {}}>
            <Typography variant="h2" sx={{ textAlign: "center" }}>
                Coudradio not available right now.
            </Typography>
            <Typography variant="h4" sx={{ textAlign: "center", opacity: 0.5, mt: 2 }}>
                {isMobile ? 'Tap to retry' : 'R: retry'}
            </Typography>
        </FullOverlay>
    );
};

export default Unavailable;
