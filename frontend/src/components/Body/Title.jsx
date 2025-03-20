import React from "react";
import { useSelector } from "react-redux";
import Typography from "@mui/material/Typography";

const Title = ({ channelName }) => {
    const isMuted = useSelector((state) => state.audioPlayer.isMuted);

    return (
        !isMuted && (
            <Typography
                variant="h4"
            >
                {channelName}
            </Typography>
        )
    );
};

export default Title;
