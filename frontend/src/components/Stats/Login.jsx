import React from 'react';
import { useEffect } from "react";
import { Typography } from "@mui/material";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${import.meta.env.VITE_BACKEND_URL}/auth/oauth2/redirect/google`;

const handleLogin = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid%20profile%20email&state=secureRandomState`;

    window.location.href = googleAuthUrl; // Redirect user to Google
};

const Login = () => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'l') {
                handleLogin();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <Typography variant="body2">L: Login (Google)</Typography>
    );
};

export default Login;
