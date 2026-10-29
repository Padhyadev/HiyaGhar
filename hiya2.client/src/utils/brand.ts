// Site images in /image are cached by browsers (see Program.cs). The logo keeps its file name, so
// its URL carries a version: when the logo file is replaced, change LOGO_VERSION so every
// browser and phone downloads the new one instead of showing its cached copy.
const LOGO_VERSION = '2026-10-29';

export const LOGO_URL = `/image/HiyaGhar.webp?v=${LOGO_VERSION}`;
