import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import FullOverlay from "./FullOverlay";
import { useSelector } from 'react-redux';

const Loading = ({ channelName }) => {
    const loadingProgress = useSelector((state) => state.audioPlayer.loadingProgress);
    const message = loadingProgress < 50
        ? `Connecting to ${channelName}…`
        : 'Loading audio…';

    return (
        <Fade in timeout={300}>
            <FullOverlay>
                <Box sx={{ width: '240px' }}>
                    <LinearProgress
                        variant="determinate"
                        value={loadingProgress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: 'rgb(255, 193, 7)',
                                borderRadius: 3,
                            },
                            backgroundColor: 'rgba(255, 193, 7, 0.2)',
                        }}
                    />
                    <Box sx={{ textAlign: 'center', mt: 1.5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                        {message}
                    </Box>
                </Box>
            </FullOverlay>
        </Fade>
    );
};

export default Loading;
