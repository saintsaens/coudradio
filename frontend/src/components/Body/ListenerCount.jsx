import React from "react";
import { useSelector } from "react-redux";
import Typography from "@mui/material/Typography";

const ListenerCount = () => {
    const { authenticated, anonymous } = useSelector((state) => state.listeners);

    if (authenticated + anonymous === 0) return null;

    const total = authenticated + anonymous;

    return (
        <Typography variant="body2" sx={{ opacity: 0.4 }}>
            {`${total} listener${total !== 1 ? 's' : ''} (${authenticated} connected)`}
        </Typography>
    );
};

export default ListenerCount;
