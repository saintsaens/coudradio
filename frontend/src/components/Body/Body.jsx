import Box from "@mui/material/Box";
import React from "react";
import Title from "./Title";
import ListenerCount from "./ListenerCount";

export default function Body({ channelName }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
            }}
        >
            <Title channelName={channelName} />
            <ListenerCount />
        </Box>
    );
}