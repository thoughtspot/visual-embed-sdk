import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Entry point of your application

    // Configure the development server
    server: {
        port: 2343,
    },
    build: {
        modulePreload: false,
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve('local', 'index.html'),
            },
        },
    }
});