import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from "react-redux";

const ListeningTime = () => {
    const { timeSpent, listeningTimes, listeningTimesFetchedAt } = useSelector((state) => state.user);
    const { currentChannel } = useSelector((state) => state.channelSwitcher);
    const [elapsedTotal, setElapsedTotal] = useState(0);
    const [elapsedChannel, setElapsedChannel] = useState(0);

    useEffect(() => {
        if (timeSpent) setElapsedTotal(timeSpent);
    }, [timeSpent]);

    useEffect(() => {
        const base = listeningTimes[currentChannel] ?? 0;
        const secondsSinceFetch = listeningTimesFetchedAt
            ? Math.floor((Date.now() - listeningTimesFetchedAt) / 1000)
            : 0;
        setElapsedChannel(base + secondsSinceFetch);
    }, [listeningTimes, currentChannel, listeningTimesFetchedAt]);

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

    const channels = Object.entries({ ...listeningTimes, [currentChannel]: listeningTimes[currentChannel] ?? 0 })
        .filter(([channel, t]) => t > 0 || channel === currentChannel)
        .sort(([, a], [, b]) => b - a);

    return (
        <Box>
            {channels.map(([channel]) => {
                const active = channel === currentChannel;
                return (
                    <Box key={channel} sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, py: 0.25, opacity: active ? 1 : 0.35 }}>
                        <Typography variant="body2">{channel}</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatTime(active ? elapsedChannel : listeningTimes[channel])}
                        </Typography>
                    </Box>
                );
            })}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, mt: 2 }}>
                <Typography variant="body2">total</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatTime(elapsedTotal)}</Typography>
            </Box>
        </Box>
    );
};

export default ListeningTime;
