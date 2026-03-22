import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from "./AudioPlayer";
import { setCurrentChannel } from "../store/features/channelSwitcherSlice";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "../store/features/audioPlayerSlice";
import MuteToggler from "./Commands/MuteToggler";
import Loading from "./Loading";
import Unavailable from "./Unavailable";
import { fetchUser, updateLastActivity, updateSessionStartTime } from "../store/features/userSlice";
import { fetchListeners } from "../store/features/listenersSlice";
import useIsMobile from "../hooks/useIsMobile";
import ChannelList from "./mobile/ChannelList";
import { Box, Fade } from "@mui/material";

export default function Channel({ channelName }) {
    const audioRef = useRef(null);
    const playing = useSelector((state) => state.audioPlayer.playing);
    const error = useSelector((state) => state.audioPlayer.error);
    const { userId } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const isMobile = useIsMobile();
    const [showChannelList, setShowChannelList] = useState(false);

    useEffect(() => {
        setShowChannelList(false);
    }, [channelName]);

    useEffect(() => {
        dispatch(setCurrentChannel(channelName));
    }, [dispatch, channelName]);

    useEffect(() => {
        dispatch(fetchUser());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchListeners());

        let interval = setInterval(() => dispatch(fetchListeners()), 30000);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                clearInterval(interval);
            } else {
                dispatch(fetchListeners());
                interval = setInterval(() => dispatch(fetchListeners()), 30000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [dispatch]);

    useEffect(() => {
        if (userId) {
            const updateActivity = () => {
                dispatch(updateLastActivity(channelName));
            };
            dispatch(updateSessionStartTime());
            const interval = setInterval(updateActivity, 59000);
            return () => clearInterval(interval);
        }
    }, [dispatch, userId, channelName]);

    if (error) {
        return <Unavailable onRetry={() => dispatch(setError(false))} />;
    }

    return (
        <>
            <AudioPlayer audioRef={audioRef} channelName={channelName} />

            {!playing && <Loading channelName={channelName} />}
            {playing && (
                <MuteToggler
                    audioRef={audioRef}
                    channelName={channelName}
                    onShowChannels={() => setShowChannelList(true)}
                />
            )}

            {isMobile && (
                <Fade in={showChannelList} timeout={200} unmountOnExit>
                    <Box sx={{ position: 'fixed', inset: 0, zIndex: 2000, bgcolor: '#041C32', overflowY: 'auto' }}>
                        <ChannelList currentChannel={channelName} onClose={() => setShowChannelList(false)} />
                    </Box>
                </Fade>
            )}
        </>
    );
}
