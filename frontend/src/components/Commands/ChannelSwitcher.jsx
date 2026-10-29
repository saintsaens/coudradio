import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedIndex, closeSwitcher, toggleSwitcher } from "../../store/features/channelSwitcherSlice";
import { Modal, Box, List, ListItem, ListItemButton, ListItemText, InputBase } from "@mui/material";

const VISIBLE_ROWS = 9;
// Row height: 1.3rem text at line-height 1.5, plus 6px of padding above and below
const ROW_HEIGHT = 'calc(1.3rem * 1.5 + 12px)';

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
    const itemRefs = useRef([]);

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
        const value = event.target.value;
        if (value === '?') {
            const others = listItems.filter(item => item !== currentChannel);
            const pool = others.length > 0 ? others : listItems;
            const random = pool[Math.floor(Math.random() * pool.length)];
            navigate(`/${random}`);
            dispatch(closeSwitcher());
            return;
        }
        setSearchQuery(value);
    };

    useEffect(() => {
        itemRefs.current[selectedIndex]?.scrollIntoView?.({ block: 'nearest' });
    }, [selectedIndex, isSwitcherOpen, searchQuery]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    top: '30%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 500,
                    bgcolor: 'var(--third-color)',
                    boxShadow: 24,
                    borderRadius: 1,
                    pointerEvents: "none"
                }}
            >
                <Box sx={{ position: 'relative' }}>
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
                    <Box sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 8,
                        fontSize: '0.65rem',
                        opacity: 0.4,
                        pointerEvents: 'none',
                    }}>
                        ?: random
                    </Box>
                </Box>
                <List disablePadding
                    sx={{
                        paddingBottom: 0.5,
                        maxHeight: `calc(${VISIBLE_ROWS} * ${ROW_HEIGHT} + 4px)`,
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                    }}
                >
                    {filteredItems.map((item, index) => (
                        <ListItem key={index} disablePadding
                            ref={(el) => { itemRefs.current[index] = el; }}
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
                                    paddingX: 1,
                                    paddingY: 0.75,
                                    color: selectedIndex === index ? 'primary.main' : 'inherit', // Change text color when selected
                                }}
                            >
                                <ListItemText
                                    primary={item}
                                    sx={{ margin: 0 }}
                                    slotProps={{
                                        primary: {
                                            sx: { fontSize: "1.3rem", lineHeight: 1.5 }
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
