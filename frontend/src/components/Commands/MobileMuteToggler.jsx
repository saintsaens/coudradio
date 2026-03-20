import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import { setMuted } from "../../store/features/audioPlayerSlice";
import MobileChannelContainer from "../MobileChannelContainer";
import { Typography, Box } from "@mui/material";

const MobileMuteToggler = ({ audioRef, channelName }) => {
    const isMuted = useSelector((state) => state.audioPlayer.isMuted);
    const dispatch = useDispatch();

    const handleToggleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.muted = !audio.muted;
            dispatch(setMuted(audio.muted));
        }
    };

    return (
        <Box
            onClick={handleToggleMute}
            sx={{
                position: 'fixed',
                inset: 0,
                backgroundColor: isMuted ? 'background.paper' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {isMuted
                ? <Typography variant="h2">Unmute</Typography>
                : <MobileChannelContainer channelName={channelName} />
            }
        </Box>
    );
};

export default MobileMuteToggler;
