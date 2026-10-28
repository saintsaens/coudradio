import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/tests/setup.js'],
        // Ignore the dev-only fake login from a local .env, so tests always hit the mocked backend
        env: { VITE_DEV_LOGGED_IN: '' },
    },
});
