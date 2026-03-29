import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import FullOverlay from "./FullOverlay";
import { useSelector } from 'react-redux';

const Loading = () => {
    const loadingProgress = useSelector((state) => state.audioPlayer.loadingProgress);

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
                </Box>
            </FullOverlay>
        </Fade>
    );
};

export default Loading;
