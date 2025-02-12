import React from 'react';
import { useEffect } from "react";
import { Typography } from "@mui/material";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const handleSubscribe = () => {
    console.log("Flying off to Stripe!");
    const paymentLink = "https://buy.stripe.com/test_aEUdRm0qIafx3LObII";

    window.location.href = paymentLink; // Redirect user to Google
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
