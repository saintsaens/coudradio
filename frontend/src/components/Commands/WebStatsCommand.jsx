import React, { useEffect, useState } from "react";
import { Typography, Box, Modal } from "@mui/material";
import { useSelector } from "react-redux";
import Stats from "../Stats/Stats"; // Import the Stats component

const WebStatsCommand = () => {
  const { userId } = useSelector((state) => state.user);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "#") {
        setOpen((prev) => !prev); // Toggle modal on #
      } else if (event.key === "Escape") {
        setOpen(false); // Always close on Escape
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Typography variant="body2">#: stats {userId && "🟢"}</Typography>

      <Modal open={open} onClose={() => setOpen(false)} disableAutoFocus>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: "background.default",
            display: 'flex',
            justifyContent: 'center', // Center horizontally
            alignItems: 'center', // Center vertically
          }}
        >
          <Stats />
        </Box>
      </Modal>
    </>
  );
};

export default WebStatsCommand;
