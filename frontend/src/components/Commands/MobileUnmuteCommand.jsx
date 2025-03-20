import React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const MobileUnmuteCommand = () => {
  return (
    <Button
      disableRipple
      color="text.primary"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "background.paper",
        zIndex: 1000,
      }}
    >
      <Typography variant="h2">Unmute</Typography>
    </Button>
  );
};

export default MobileUnmuteCommand;
