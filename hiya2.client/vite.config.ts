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

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7028';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    define: {
        // Default og:image falls back to the logo until public/image/og-default.webp is added (see src/seo/routeSeo.ts).
        __OG_DEFAULT_IMAGE_EXISTS__: JSON.stringify(fs.existsSync(fileURLToPath(new URL('./public/image/og-default.webp', import.meta.url)))),
        // Our Story "Behind the scenes" photos that exist in public/image/story (bts-1..4.webp). The
        // section shows only these, and stays hidden until at least one is added (see BehindTheScenes.tsx).
        __STORY_BTS_IMAGES__: JSON.stringify(
            [1, 2, 3, 4].filter((n) => fs.existsSync(fileURLToPath(new URL(`./public/image/story/bts-${n}.webp`, import.meta.url))))
        ),
        // Our Story "From our ghar to yours" arch photo: public/image/story/our-kitchen.webp once it
        // is added, until then an existing kitchen photo (see StorySection.tsx).
        __STORY_KITCHEN_IMAGE_EXISTS__: JSON.stringify(fs.existsSync(fileURLToPath(new URL('./public/image/story/our-kitchen.webp', import.meta.url))))
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        rollupOptions: {
            output: {
                // Only libraries every page loads get their own long-cached chunk. Libraries used
                // on a few pages (gsap on Home, jsPDF/html2canvas for invoices) are left to the
                // bundler so they load with those pages: a manual chunk for them also picks up
                // shared helpers the main script imports, which made every page download the
                // whole PDF library.
                manualChunks(id) {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/motion-')) {
                        return 'vendor-animation';
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
        // Listen on 127.0.0.1 too and accept VS Code port-forwarding (dev tunnel) hosts
        host: true,
        allowedHosts: true,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
})
