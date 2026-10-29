#!/usr/bin/env tsx
import React from 'react';
import { render } from 'ink';
import { config } from 'dotenv';
import App from './src/App.jsx';

config();

const backendUrl = (process.env.COUDRADIO_BACKEND_URL || 'https://cestunpeu.troal.me/api').replace(/\/$/, '');
const channels = (process.env.COUDRADIO_CHANNELS || 'lofi').split(',').map((s) => s.trim()).filter(Boolean);
const defaultChannel = process.env.COUDRADIO_DEFAULT_CHANNEL || channels[0];

render(<App channels={channels} backendUrl={backendUrl} defaultChannel={defaultChannel} />);
