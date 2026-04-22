export type Language = 'en' | 'ar';

export const translations = {
    en: {
        getStarted: 'Get Started',
        about: 'About',
        features: 'Features',
        howItWorks: 'How It Works',
    },
    ar: {
        getStarted: 'ابدأ الآن',
        about: 'حول',
        features: 'المميزات',
        howItWorks: 'كيف يعمل',
    },
} as const;