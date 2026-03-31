import React from "react";
import Box from "@mui/material/Box";
import About from "./About";
import ListenerCount from "../Body/ListenerCount";

export default function Footer() {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                height: "100%",
            }}
        >
            <ListenerCount />
            <About />
        </Box>
    );
}