import Box from "@mui/material/Box";
import React from "react";
import Title from "./Title";

export default function Body({ channelName }) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
            }}
        >
            <Title channelName={channelName} />
        </Box>
    );
}