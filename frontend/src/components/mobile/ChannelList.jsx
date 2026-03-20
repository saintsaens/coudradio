import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';

const channels = (import.meta.env.VITE_CHANNELS_LOGGEDIN || '').split(',').filter(Boolean);

const ChannelList = ({ currentChannel, onClose }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#041C32', minHeight: '100vh' }}>
            <List disablePadding>
                {channels.map((channel, index) => (
                    <React.Fragment key={channel}>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => channel === currentChannel ? onClose?.() : navigate(`/${channel}`)}
                                sx={{
                                    py: 4,
                                    px: 3,
                                    '&:active': { bgcolor: '#064663' },
                                }}
                            >
                                <ListItemText
                                    primary={channel}
                                    slotProps={{
                                        primary: {
                                            sx: {
                                                fontSize: '1.5rem',
                                                color: '#ECB365',
                                                fontFamily: 'monospace',
                                            }
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                        {index < channels.length - 1 && (
                            <Divider sx={{ bgcolor: '#064663' }} />
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default ChannelList;
