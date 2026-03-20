import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';
import { fetchUser } from '../../store/features/userSlice';

const ChannelList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { channelList } = useSelector((state) => state.user);

    useEffect(() => {
        dispatch(fetchUser());
    }, [dispatch]);

    return (
        <Box sx={{ bgcolor: '#041C32', minHeight: '100vh' }}>
            <List disablePadding>
                {channelList.map((channel, index) => (
                    <React.Fragment key={channel}>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => navigate(`/${channel}`)}
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
                        {index < channelList.length - 1 && (
                            <Divider sx={{ bgcolor: '#064663' }} />
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default ChannelList;
