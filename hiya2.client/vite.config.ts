import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "hiya2.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

const target = env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'http://localhost:5196';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    define: {
        // Default og:image falls back to the logo until public/image/og-default.jpg is added (see src/seo/routeSeo.ts).
        __OG_DEFAULT_IMAGE_EXISTS__: JSON.stringify(fs.existsSync(fileURLToPath(new URL('./public/image/og-default.jpg', import.meta.url))))
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/gsap/')) {
                        return 'vendor-animation';
                    }
                    if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
                        return 'vendor-pdf';
                    }
                    if (id.includes('node_modules/html2canvas')) {
                        return 'vendor-html2canvas';
                    }
                    if (id.includes('node_modules/lottie-react') || id.includes('node_modules/lottie-web')) {
                        return 'vendor-lottie';
                    }
                    if (id.includes('node_modules/@xenova')) {
                        return 'vendor-ai';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 800
    },
    server: {
        proxy: {
            '^/api': {
                target,
                changeOrigin: true,
                secure: false
            },
            '^/uploads': {
                target,
                changeOrigin: true,
                secure: false
            },
            '^/weatherforecast': {
                target,
                changeOrigin: true,
                secure: false
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '59978'),
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
})
