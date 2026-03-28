import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { useSelector, useDispatch } from "react-redux";
import { fetchChannelListeningTime } from "../../store/features/userSlice";

const ListeningTime = () => {
    const dispatch = useDispatch();
    const { timeSpent, channelTimeSpent } = useSelector((state) => state.user);
    const { currentChannel } = useSelector((state) => state.channelSwitcher);
    const [elapsedTotal, setElapsedTotal] = useState(0);
    const [elapsedChannel, setElapsedChannel] = useState(0);

    useEffect(() => {
        if (timeSpent !== 0) setElapsedTotal(timeSpent);
    }, [timeSpent]);

    useEffect(() => {
        setElapsedChannel(channelTimeSpent);
    }, [channelTimeSpent]);

    useEffect(() => {
        dispatch(fetchChannelListeningTime(currentChannel));
    }, [dispatch, currentChannel]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTotal((prev) => prev + 1);
            setElapsedChannel((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds) => {
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${days.toString().padStart(2, "0")}:${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <>
            <Typography variant="h3">{formatTime(elapsedChannel)}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>{`total: ${formatTime(elapsedTotal)}`}</Typography>
        </>
    );
};

export default ListeningTime;
