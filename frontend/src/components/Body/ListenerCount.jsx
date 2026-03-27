import React from "react";
import { useSelector } from "react-redux";
import Typography from "@mui/material/Typography";

const ListenerCount = () => {
    const { authenticated, anonymous } = useSelector((state) => state.listeners);

    if (authenticated + anonymous === 0) return null;

    const total = authenticated + anonymous;
    const details = [];
    if (authenticated > 0) details.push(`${authenticated} connected`);
    if (anonymous > 0) details.push(`${anonymous} anonymous`);

    return (
        <Typography variant="body2" sx={{ opacity: 0.6, mt: 1 }}>
            {`${total} listener${total !== 1 ? 's' : ''}`}{details.length > 0 && ` (${details.join(', ')})`}
        </Typography>
    );
};

export default ListenerCount;
