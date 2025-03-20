import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import { setMuted } from "../../store/features/audioPlayerSlice";
import MobileChannelContainer from "../MobileChannelContainer";
import { Typography, Button } from "@mui/material";
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
        <>
            {isMuted
                ?
                <Button
                    disableRipple
                    color="text.primary"
                    onClick={handleToggleMute}
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "background.paper",
                        zIndex: 1000,
                    }}
                >
                    <Typography variant="h2">Unmute</Typography>
                </Button>
                :
                <>
                    <Button
                        disableRipple
                        color="text.primary"
                        onClick={handleToggleMute}
                        sx={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "transparent",
                            zIndex: 1000,
                        }}
                    >
                    </Button>
                    <MobileChannelContainer channelName={channelName} onClick={handleToggleMute} />
                </>
            }
        </>
    );
};

export default MobileMuteToggler;
