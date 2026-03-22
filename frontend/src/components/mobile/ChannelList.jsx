import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, ButtonBase } from '@mui/material';

const channels = (import.meta.env.VITE_CHANNELS_LOGGEDIN || '').split(',').filter(Boolean);

const ChannelList = ({ currentChannel, onClose }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            bgcolor: '#041C32',
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            p: 2,
            alignContent: 'start',
        }}>
            {channels.map((channel) => {
                const isActive = channel === currentChannel;
                return (
                    <ButtonBase
                        key={channel}
                        onClick={() => isActive ? onClose?.() : navigate(`/${channel}`)}
                        sx={{
                            bgcolor: '#064663',
                            border: isActive ? '2px solid #ECB365' : '2px solid transparent',
                            borderRadius: 2,
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            color: '#ECB365',
                            transition: 'background-color 0.1s',
                            '&:active': { bgcolor: '#0a5a7a' },
                        }}
                    >
                        {channel}
                    </ButtonBase>
                );
            })}
        </Box>
    );
};

export default ChannelList;
