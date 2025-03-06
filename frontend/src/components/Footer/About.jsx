import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { useSelector } from "react-redux";

const aboutUrl = import.meta.env.VITE_ABOUT_URL;

const About = () => {
  const { isSwitcherOpen } = useSelector((state) => state.channelSwitcher);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key.toLowerCase() === "a" && !event.metaKey && !event.ctrlKey && !isSwitcherOpen) {
        window.open(aboutUrl, "_blank", "noopener, noreferrer");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSwitcherOpen]);

  return (
    <Typography variant="body2">A: about</Typography>
  );
};

export default About;