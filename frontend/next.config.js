/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: true,
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        const isProd = process.env.NODE_ENV === 'production';
        const apiBase = isProd ? 'https://devis-ai-api.onrender.com' : 'http://127.0.0.1:8000';
        return [
            {
                source: '/api/:path*',
                destination: `${apiBase}/:path*`, // Proxy to Backend
            },
        ];
    },
};

module.exports = nextConfig;
