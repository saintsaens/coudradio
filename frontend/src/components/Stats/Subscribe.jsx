import React from 'react';
import { useEffect } from "react";
import { Typography } from "@mui/material";
import { useSelector } from "react-redux";

const paymentBaseUrl = import.meta.env.VITE_PAYMENT_BASE_URL;

const Subscribe = () => {
    const { userId } = useSelector((state) => state.user);
    
    const handleSubscribe = () => {
        const paymentLink = `${paymentBaseUrl}?userId=${userId}`;
        window.location.href = paymentLink;
    };

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
