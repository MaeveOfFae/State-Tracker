import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
var hmrHost = process.env.VITE_HMR_HOST;
var hmrPort = process.env.VITE_HMR_PORT ? Number(process.env.VITE_HMR_PORT) : undefined;
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // listen on 0.0.0.0
        port: 5173,
        strictPort: true,
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        hmr: {
            host: hmrHost,
            port: hmrPort,
            overlay: false,
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'), // stages runner (root)
                harness: resolve(__dirname, 'index-harness.html'),
                tests: resolve(__dirname, 'test-harness.html'),
                batch: resolve(__dirname, 'batch-tests.html'),
            },
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    chrono: ['chrono-node'],
                },
            },
        },
    },
});
