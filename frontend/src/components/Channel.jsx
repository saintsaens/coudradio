import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from "./AudioPlayer";
import { setCurrentChannel } from "../store/features/channelSwitcherSlice";
import { useDispatch, useSelector } from "react-redux";
import MuteToggler from "./Commands/MuteToggler";
import Loading from "./Loading";
import Unavailable from "./Unavailable";
import { fetchUser, updateLastActivity, updateSessionStartTime } from "../store/features/userSlice";
import useIsMobile from "../hooks/useIsMobile";
import ChannelList from "./mobile/ChannelList";
import { Box } from "@mui/material";

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
        if (userId) {
            const updateActivity = () => {
                dispatch(updateLastActivity());
            };
            dispatch(updateSessionStartTime());
            const interval = setInterval(updateActivity, 59000);
            return () => clearInterval(interval);
        }
    }, [dispatch, userId]);

    if (error) {
        return <Unavailable />;
    }

    return (
        <>
            <AudioPlayer audioRef={audioRef} channelName={channelName} />

            {!playing && <Loading />}
            {playing && (
                <MuteToggler
                    audioRef={audioRef}
                    channelName={channelName}
                    onShowChannels={() => setShowChannelList(true)}
                />
            )}

            {isMobile && showChannelList && (
                <Box sx={{ position: 'fixed', inset: 0, zIndex: 2000, bgcolor: '#041C32', overflowY: 'auto' }}>
                    <ChannelList />
                </Box>
            )}
        </>
    );
}
