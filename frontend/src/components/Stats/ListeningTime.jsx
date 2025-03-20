import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { useSelector } from "react-redux";

const ListeningTime = () => {
    const { timeSpent } = useSelector((state) => state.user);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (timeSpent !== 0) {
            setElapsedTime(timeSpent);
        }
    }, [timeSpent]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
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
        <Typography variant="h3">{formatTime(elapsedTime)}</Typography>
    );
};

export default ListeningTime;
