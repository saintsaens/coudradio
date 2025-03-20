import React, { useEffect, useRef } from 'react';
import AudioPlayer from "./AudioPlayer";
import { setCurrentChannel } from "../store/features/channelSwitcherSlice";
import { useDispatch, useSelector } from "react-redux";
import MuteToggler from "./Commands/MuteToggler";
import Loading from "./Loading";
import Unavailable from "./Unavailable";
import { fetchUser, updateLastActivity, updateSessionStartTime } from "../store/features/userSlice";

export default function Channel({ channelName }) {
    const audioRef = useRef(null);
    const playing = useSelector((state) => state.audioPlayer.playing);
    const error = useSelector((state) => state.audioPlayer.error);
    const { userId } = useSelector((state) => state.user);
    const dispatch = useDispatch();

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
            const interval = setInterval(updateActivity, 59000); // Run every 59 seconds
            return () => clearInterval(interval); // Cleanup on unmount
        }
    }, [dispatch, userId]);

    if (error) {
        return (
            <Unavailable />
        );
    }

    return (
        <>
            <AudioPlayer audioRef={audioRef} channelName={channelName} />

            {!playing && (
                <Loading />
            )}
            {playing && (
                <MuteToggler
                    audioRef={audioRef}
                    channelName={channelName}
                />
            )}
        </>
    );
}
