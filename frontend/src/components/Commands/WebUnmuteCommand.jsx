import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const WebUnmuteCommand = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.paper",
        zIndex: 1000,
      }}
    >
      <Typography variant="h2">K to unmute</Typography>
    </Box>
  );
};

export default WebUnmuteCommand;
