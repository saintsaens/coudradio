import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Channel from "./Channel";

function ChannelWrapper() {
    const { channelName } = useParams();
    return <Channel channelName={channelName} />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/lofi" replace />} />
            <Route path="/:channelName" element={<ChannelWrapper />} />
        </Routes>
    );
}

export default AppRoutes;
