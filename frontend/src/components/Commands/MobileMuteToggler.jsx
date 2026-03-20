import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import { setMuted } from "../../store/features/audioPlayerSlice";
import MobileChannelContainer from "../MobileChannelContainer";
import { Typography, Box } from "@mui/material";

const MobileMuteToggler = ({ audioRef, channelName, onShowChannels }) => {
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
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <MobileChannelContainer channelName={channelName} onShowChannels={onShowChannels} />
            {isMuted && (
                <Typography variant="h2" sx={{ position: 'absolute', left: 0, right: 0, textAlign: 'center' }}>tap to unmute</Typography>
            )}
        </Box>
    );
};

export default MobileMuteToggler;
