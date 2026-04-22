'use client';

import { useEffect, useState } from 'react';

type Language = 'en' | 'ar';

export default function LanguageToggle() {
    const [lang, setLang] = useState<Language>('en');

    useEffect(() => {
        const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
        const current = match?.[1] === 'ar' ? 'ar' : 'en';
        setLang(current);

        document.documentElement.lang = current;
        document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    }, []);

    function changeLanguage(newLang: Language) {
        document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        setLang(newLang);
        window.location.reload();
    }

    return (
        <div className="lang-switch">
            <span
                onClick={() => changeLanguage('ar')}
                className={lang === 'ar' ? 'active' : ''}
            >
                العربية
            </span>

            <span className="divider">|</span>

            <span
                onClick={() => changeLanguage('en')}
                className={lang === 'en' ? 'active' : ''}
            >
                English
            </span>
        </div>
    );
}