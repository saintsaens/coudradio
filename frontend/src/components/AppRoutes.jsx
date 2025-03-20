import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Channel from "./Channel";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/lofi" replace />} />
            <Route path="/lofi" element={<Channel channelName={`lofi`}/>} />
            <Route path="/coudrier" element={<Channel channelName={`coudrier`} />} />
        </Routes>
    );
};

export default AppRoutes;
