import type { NextConfig } from "next";
// Permite verificar una compilación sin interferir con el servidor de desarrollo.
const config: NextConfig = { distDir: process.env.NEXT_BUILD_DIR || ".next" };
export default config;
