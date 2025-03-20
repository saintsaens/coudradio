import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { useSelector } from "react-redux";

const paymentBaseUrl = import.meta.env.VITE_PAYMENT_BASE_URL;

const Subscribe = () => {
    const { userId } = useSelector((state) => state.user);

    const handleSubscribe = () => {
        if (!userId) return;
        const paymentLink = `${paymentBaseUrl}?client_reference_id=${userId}`;
        window.open(paymentLink, "_blank", "noopener,noreferrer");
    };

    useEffect(() => {
        if (!userId) return; // Don't register event listener if no userId

        const handleKeyDown = (event) => {
            if (!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                handleSubscribe();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [userId]); // Re-run effect only if userId changes

    return userId ? (
        <Typography variant="body2">S: Subscribe</Typography>
    ) : null;
};

export default Subscribe;
