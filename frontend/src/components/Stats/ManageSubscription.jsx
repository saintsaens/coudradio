import React, { useEffect } from "react";
import { Typography } from "@mui/material";

const ManageSubscription = () => {
    const handleManageSubscription = () => {
        const customerPortalUrl = "https://billing.stripe.com/p/login/28o4jm7A0d4d0gw8ww";
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