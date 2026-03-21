import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.VITE_KEYENV === 'local';
const keyPath = process.env.VITE_SSL_KEY_PATH ? path.resolve(__dirname, process.env.VITE_SSL_KEY_PATH) : null;
const certPath = process.env.VITE_SSL_CERT_PATH ? path.resolve(__dirname, process.env.VITE_SSL_CERT_PATH) : null;

if (isLocal) {
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.error("Error: SSL key or cert file not found.");
        process.exit(1);
    }
}

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
                    'mui-vendor': ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
                    'dashjs': ['dashjs'],
                },
            },
        },
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Coudradio',
                short_name: 'Coudradio',
                description: 'Radio streaming',
                theme_color: '#041C32',
                background_color: '#041C32',
                display: 'standalone',
                start_url: '/',
                icons: [
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
        }),
    ],
    server: isLocal
        ? {
              https: {
                  key: keyPath,
                  cert: certPath
              },
              host: 'localhost',
              port: process.env.VITE_PORT
          }
        : {}, // No HTTPS for other environments
});
