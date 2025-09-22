import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedIndex, closeSwitcher, toggleSwitcher } from "../../store/features/channelSwitcherSlice";
import { Modal, Box, List, ListItem, ListItemButton, ListItemText, InputBase } from "@mui/material";

const ChannelSwitcher = () => {
    const { currentChannel, selectedIndex, isSwitcherOpen } = useSelector((state) => state.channelSwitcher);
    const { channelList } = useSelector((state) => state.user);
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const listItems = channelList;

    const processedItems = [...listItems]
        .sort((a, b) => a.localeCompare(b))
        .filter((item) => item !== currentChannel)
        .concat(currentChannel ? [currentChannel] : []);

    const filteredItems = processedItems.filter((item) =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const searchInputRef = useRef(null);

    const handleKeyPress = (event) => {
        const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

        if (isSwitcherOpen) {
            if (event.key === 'ArrowDown') {
                dispatch(setSelectedIndex((selectedIndex + 1) % filteredItems.length));
            } else if (event.key === 'ArrowUp') {
                dispatch(setSelectedIndex(
                    (selectedIndex - 1 + filteredItems.length) % filteredItems.length
                ));
            } else if (event.key === 'Enter') {
                navigate(`/${filteredItems[selectedIndex]}`);
                dispatch(closeSwitcher());
            } else if (event.key === 'Escape') {
                dispatch(closeSwitcher());
                dispatch(setSelectedIndex(0));
            }
        }
        if (isCmdK) {
            event.preventDefault();
            dispatch(toggleSwitcher());
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);

        if (!isSwitcherOpen) {
            setSearchQuery('');
        }

        if (isSwitcherOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [isSwitcherOpen, filteredItems]);

    return (
        <Modal
            open={isSwitcherOpen}
            onClose={() => dispatch(closeSwitcher())}
            disableAutoFocus
            hideBackdrop
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 500,
                    bgcolor: 'var(--third-color)',
                    boxShadow: 24,
                    borderRadius: 1,
                    pointerEvents: "none"
                }}
            >
                <InputBase
                    inputRef={searchInputRef}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    fullWidth
                    autoFocus
                    sx={{
                        padding: 1,
                        fontSize: "2rem"
                    }}
                />
                <List disablePadding
                    sx={{
                        paddingBottom: 0.5,
                    }}
                >
                    {filteredItems.map((item, index) => (
                        <ListItem key={index} disablePadding
                            sx={{
                                bgcolor: selectedIndex === index ? 'fourth.main' : 'transparent', // Change background color when selected
                            }}
                        >
                            <ListItemButton
                                selected={selectedIndex === index}
                                onClick={() => {
                                    navigate(`/${item}`);
                                    dispatch(closeSwitcher());
                                }}
                                sx={{
                                    padding: 1,
                                    color: selectedIndex === index ? 'primary.main' : 'inherit', // Change text color when selected
                                }}
                            >
                                <ListItemText
                                    primary={item}
                                    slotProps={{
                                        primary: {
                                            sx: { fontSize: "1.3rem" }
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Modal>
    );
};

export default ChannelSwitcher;
