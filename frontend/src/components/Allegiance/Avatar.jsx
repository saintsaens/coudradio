import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Butler from "../../styles/allegiances/butler-300.png";
import { Box, Typography } from "@mui/material";

const Avatar = () => {
    return (
        <Box
            component="img"
            src={Butler}
            sx={{
                height: '50px',
                opacity: 0.8,
                display: 'block',
                borderRadius: '4px',
                transition: 'background-color 0.15s, transform 0.03s',
                cursor: 'pointer',
                padding: '4px 8px',
                '&:hover': {
                    opacity: 0.7,
                },
                '&:active': {
                    transform: 'scale(0.95)',
                }
            }}
        />
    );
};

export default Avatar;
