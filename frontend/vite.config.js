import { defineConfig } from 'vite';
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
