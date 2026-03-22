import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Channel from "./Channel";
import ChannelList from "./mobile/ChannelList";
import useIsMobile from "../hooks/useIsMobile";

function ChannelWrapper() {
    const { channelName } = useParams();
    return <Channel channelName={channelName} />;
}

function AppRoutes() {
    const isMobile = useIsMobile();

    return (
        <Routes>
            <Route path="/" element={<Navigate to={isMobile ? "/channels" : "/lofi"} replace />} />
            {isMobile && <Route path="/channels" element={<ChannelList />} />}
            <Route path="/:channelName" element={<ChannelWrapper />} />
        </Routes>
    );
}

export default AppRoutes;
