import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'siaa.database.windows.net',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            { source: '/booking', destination: '/HTML/booking.html' },
            { source: '/payment', destination: '/HTML/payment.html' },
            { source: '/confirmation', destination: '/HTML/confirmation.html' },
            { source: '/booking.html', destination: '/HTML/booking.html' },
            { source: '/payment.html', destination: '/HTML/payment.html' },
            { source: '/confirmation.html', destination: '/HTML/confirmation.html' }
        ];
    },
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
    },
};

export default nextConfig;
