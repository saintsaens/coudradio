import React from 'react';
import { useEffect } from "react";
import { Typography } from "@mui/material";

const handleLogout = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
        if (response.ok) {
            window.location.reload(); // Ensure UI updates on logout
        } else {
            console.log("Logout failed");
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
};

const Logout = () => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'l') {
                handleLogout();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <Typography variant="body2">L: Logout</Typography>
    );
};

export default Logout;
