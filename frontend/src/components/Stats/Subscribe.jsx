import React from 'react';
import { useEffect } from "react";
import { Typography } from "@mui/material";

const handleSubscribe = () => {
};

const Subscribe = () => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                handleSubscribe();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <Typography variant="body2">S: Subscribe</Typography>
    );
};

export default Subscribe;
