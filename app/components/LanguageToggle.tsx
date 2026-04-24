'use client';
import { useEffect, useState } from 'react';

export default function LanguageToggle() {
    const [lang, setLang] = useState<'en' | 'ar'>('en');

    useEffect(() => {
        const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
        if (match?.[1] === 'ar') setLang('ar');
    }, []);

    function changeLang(newLang: 'en' | 'ar') {
        document.cookie = `lang=${newLang}; path=/`;
        window.location.reload();
    }

    return (
        <div className="language-toggle">
            <a
                onClick={() => changeLang('en')}
                className={lang === 'en' ? 'active' : ''}
                style={{ cursor: 'pointer' }}
            >
                English
            </a>

            {' | '}

            <a
                onClick={() => changeLang('ar')}
                className={lang === 'ar' ? 'active' : ''}
                style={{ cursor: 'pointer' }}
            >
                العربية
            </a>
        </div>
    );
}