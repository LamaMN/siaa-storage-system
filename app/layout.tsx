import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: "Si'aa - Store Smart. Nearby. Hassle-Free.",
        template: "%s | Si'aa",
    },
    description:
        "Si'aa is a peer-to-peer storage marketplace in Saudi Arabia. Find verified nearby storage spaces or list your extra space and earn income.",
    keywords: ['storage', 'Saudi Arabia', 'peer-to-peer', 'مستودع', 'تخزين', 'Jeddah', 'Riyadh'],
    authors: [{ name: "Si'aa Team" }],
    openGraph: {
        type: 'website',
        locale: 'ar_SA',
        alternateLocale: 'en_US',
        siteName: "Si'aa",
        title: "Si'aa - Store Smart. Nearby. Hassle-Free.",
        description: 'Find verified nearby storage spaces or earn from your extra space.',
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
