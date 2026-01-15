import type { NextConfig } from "next";
import million from "million/compiler";

const nextConfig: NextConfig = {
  // Silence Turbopack warning about webpack config from Million.js
  turbopack: {
    root: __dirname,
  },
};

export default million.next(nextConfig, { auto: true });
