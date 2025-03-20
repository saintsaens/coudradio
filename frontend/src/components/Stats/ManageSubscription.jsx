import React, { useEffect } from "react";
import { Typography } from "@mui/material";

const ManageSubscription = () => {
    const handleManageSubscription = () => {
        const customerPortalUrl = import.meta.env.VITE_MANAGE_SUBSCRIPTION_URL;
        window.open(customerPortalUrl, "_blank", "noopener,noreferrer");
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                event.preventDefault(); // Prevent default browser behavior
                handleManageSubscription();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <Typography variant="body2">S: Manage subscription</Typography>
    );
};

export default ManageSubscription;