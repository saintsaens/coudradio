import React from "react";
import Box from "@mui/material/Box";
import About from "./About";

export default function Footer() {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "right",
                alignItems: "flex-end",
                height: "100%",
            }}
        >
            <About />
        </Box>
    );
}