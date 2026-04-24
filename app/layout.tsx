import type { Metadata } from 'next';
import { cookies } from 'next/headers';
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

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const lang = cookieStore.get('lang')?.value === 'ar' ? 'ar' : 'en';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={lang} dir={dir}>
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
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
