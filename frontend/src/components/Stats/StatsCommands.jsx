import React from 'react';
import { useSelector } from "react-redux";
import { Stack } from "@mui/material";
import Escape from "./Escape";
import Login from "./Login";
import Logout from "./Logout";
import Subscribe from "./Subscribe";
import ManageSubscription from "./ManageSubscription";

const StatsCommands = () => {
    const { username, isSubscriber } = useSelector((state) => state.user);

    return (
        <Stack spacing={1}>
            <Escape />
            {!username ? <Login /> : <Logout />}
            {!isSubscriber ? <Subscribe /> : <ManageSubscription />}
        </Stack>
    );
};

export default StatsCommands;
