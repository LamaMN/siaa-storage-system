import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { translations, type Language } from '@/lib/translations';
import LanguageToggle from '@/app/components/LanguageToggle';
import Script from 'next/script';
export const metadata: Metadata = {
    title: "Si'aa — Store Smart. Nearby. Hassle-Free.",
    description:
        "Find, book, and visualize storage spaces in your neighborhood. Saudi Arabia's smart peer-to-peer storage marketplace.",
    openGraph: {
        title: "Si'aa — Peer-to-Peer Storage in Saudi Arabia",
        description: 'Book nearby verified storage spaces or earn from your extra room, garage, or basement.',
        images: ['/Media/Logo.png'],
    },
};

// Schema.org structured data
const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Si'aa",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logo: '/Media/Logo.png',
    sameAs: [],
    description: 'Peer-to-peer storage marketplace connecting storage seekers with providers in Saudi Arabia.',
    areaServed: 'SA',
    serviceType: 'Storage Solutions',
};

export default async function HomePage() {
    const cookieStore = await cookies();
    const lang = (cookieStore.get('lang')?.value === 'ar' ? 'ar' : 'en') as Language;
    const t = translations[lang];

    return (
        <>
            <header className="header">

                <div className="container">
                    <div className="header-content">
                        
                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>

                        <nav className="nav">
                            <a href="#about">{t.about}</a>
                            <a href="#features">{t.features}</a>
                            <a href="#how-it-works">{t.howItWorks}</a>
                        </nav>

                        <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                        }}
                        >
                        <a
                            href="/register"
                            className="btn btn-primary btn-header"
                            style={{ width: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                            {t.getStarted}
                        </a>

                        <LanguageToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="hero">
                <div className="container">

                    <h1 className="hero-title">
                        {t.heroTitle}
                    </h1>

                    <p className="hero-subtitle">
                        {t.heroSubtitle}
                    </p>

                    <div className="hero-buttons">

                        <a href="/search" className="btn btn-dark btn-large">
                            {t.findStorage}
                        </a>

                        <a href="/register" className="btn btn-outline btn-large">
                            {t.becomeProvider}
                        </a>

                    </div>

                </div>
            </section>

            {/* Why Si'aa */}
            <section className="why-section reveal-on-scroll" id="why">
                <div className="container">

                    <h2 className="section-title">
                        {t.whyTitle}
                    </h2>

                    <div className="why-grid">

                        <div className="why-card">
                            <div className="why-image">
                                <img
                                    src="/Media/Image.png"
                                    alt={t.highCostAlt}
                                />
                            </div>

                            <h3 className="why-headline">
                                {t.whyCostTitle}
                            </h3>

                            <p className="why-description">
                                {t.whyCostDesc}
                            </p>
                        </div>

                        <div className="why-card">
                            <div className="why-image">
                                <img
                                    src="/Media/Image (1).png"
                                    alt={t.poorFlexibilityAlt}
                                />
                            </div>

                            <h3 className="why-headline">
                                {t.whyFlexTitle}
                            </h3>

                            <p className="why-description">
                                {t.whyFlexDesc}
                            </p>
                        </div>

                        <div className="why-card">
                            <div className="why-image">
                                <img
                                    src="/Media/Image (2).png"
                                    alt={t.noVisualizationAlt}
                                />
                            </div>

                            <h3 className="why-headline">
                                {t.whyVisualTitle}
                            </h3>

                            <p className="why-description">
                                {t.whyVisualDesc}
                            </p>
                        </div>

                    </div>

                </div>
            </section>

            {/* Features */}
            <section className="features-section reveal-on-scroll" id="features">
                <div className="container">

                    <h2 className="section-title">
                        {t.featuresTitle}
                    </h2>

                    <div className="features-grid">
                        {[
                            {
                                src: '/Media/PeerToPeer.png',
                                title: t.feature1Title,
                                desc: t.feature1Desc,
                            },
                            {
                                src: '/Media/Ai Smart Matching.png',
                                title: t.feature2Title,
                                desc: t.feature2Desc,
                            },
                            {
                                src: '/Media/SpaceVisualization.png',
                                title: t.feature3Title,
                                desc: t.feature3Desc,
                            },
                            {
                                src: '/Media/Logistics.png',
                                title: t.feature4Title,
                                desc: t.feature4Desc,
                            },
                            {
                                src: '/Media/SafetyShield.png',
                                title: t.feature5Title,
                                desc: t.feature5Desc,
                            },
                            {
                                src: '/Media/affordable.png',
                                title: t.feature6Title,
                                desc: t.feature6Desc,
                            },
                        ].map((f, i) => (
                            <div className="feature-card" key={i}>
                                <div className="feature-icon">
                                    <img src={f.src} alt={f.title} />
                                </div>

                                <h3 className="feature-title">
                                    {f.title}
                                </h3>

                                <p className="feature-description">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works-section reveal-on-scroll" id="how-it-works">
                <div className="container">

                    <h2 className="section-title">
                        {t.howTitle}
                    </h2>

                    <div className="steps-container">

                        <div className="step">
                            <div className="step-icon">
                                <img src="/Media/Search.png" alt={t.searchAlt} />
                            </div>

                            <h3 className="step-title">
                                {t.stepSearchTitle}
                            </h3>

                            <p className="step-description">
                                {t.stepSearchDesc}
                            </p>
                        </div>

                        <div className="step-arrow">→</div>

                        <div className="step">
                            <div className="step-icon">
                                <img src="/Media/Visualize.png" alt={t.visualizeAlt} />
                            </div>

                            <h3 className="step-title">
                                {t.stepVisualizeTitle}
                            </h3>

                            <p className="step-description">
                                {t.stepVisualizeDesc}
                            </p>
                        </div>

                        <div className="step-arrow">→</div>

                        <div className="step">
                            <div className="step-icon">
                                <img src="/Media/book.png" alt={t.bookAlt} />
                            </div>

                            <h3 className="step-title">
                                {t.stepBookTitle}
                            </h3>

                            <p className="step-description">
                                {t.stepBookDesc}
                            </p>
                        </div>

                        <div className="step-arrow">→</div>

                        <div className="step">
                            <div className="step-icon">
                                <img src="/Media/store.png" alt={t.storeAlt} />
                            </div>

                            <h3 className="step-title">
                                {t.stepStoreTitle}
                            </h3>

                            <p className="step-description">
                                {t.stepStoreDesc}
                            </p>
                        </div>

                    </div>

                    <div className="how-it-works-cta">
                        <a href="/search" className="btn btn-dark btn-large">
                            {t.howCTA}
                        </a>
                    </div>

                </div>
            </section>

            {/* Income Section */}
            <section className="income-section reveal-on-scroll">
                <div className="container">

                    <div className="income-content">

                        <div className="income-text">

                            <h2 className="income-title">
                                {t.incomeTitle}
                            </h2>

                            <p className="income-description">
                                {t.incomeDescription}
                            </p>

                            <ul className="income-benefits">

                                <li>{t.incomeBenefit1}</li>

                                <li>{t.incomeBenefit2}</li>

                                <li>{t.incomeBenefit3}</li>

                                <li>{t.incomeBenefit4}</li>

                                <li>{t.incomeBenefit5}</li>

                            </ul>

                            <a
                                href="/register?type=provider"
                                className="btn btn-primary btn-large"
                            >
                                {t.incomeCTA}
                            </a>

                        </div>

                        <div className="income-image">
                            <img
                                src="/Media/Card (2).png"
                                alt={t.turnSpaceIntoIncomeAlt}
                            />
                        </div>

                    </div>

                </div>
            </section>

            {/* About */}
            <section className="about-section reveal-on-scroll" id="about">
                <div className="decorative-shapes">
                    <div className="shape shape-circle"></div>
                    <div className="shape shape-square"></div>
                    <div className="shape shape-diamond"></div>
                    <div className="shape shape-triangle"></div>
                </div>

                <div className="container">

                    <h2 className="about-title">
                        {t.aboutTitle}
                    </h2>

                    <div className="about-wrapper">

                        <div className="about-content">

                            <div className="about-card">
                                <div className="about-block">
                                    <div className="about-icon"></div>

                                    <div className="about-text">
                                        <h3 className="about-headline">
                                            {t.aboutHeadline1}
                                        </h3>

                                        <p className="about-description">
                                            {t.aboutDesc1}
                                        </p>
                                    </div>

                                </div>
                            </div>

                            <div className="about-card">
                                <div className="about-block">
                                    <div className="about-icon"></div>

                                    <div className="about-text">
                                        <h3 className="about-headline">
                                            {t.aboutHeadline2}
                                        </h3>

                                        <p className="about-description">
                                            {t.aboutDesc2}
                                        </p>
                                    </div>

                                </div>
                            </div>

                        </div>

                        <div className="about-logo-section">

                            <div className="about-logo">
                                <img
                                    src="/Media/Logo.png"
                                    alt={t.logoAlt}
                                    className="about-logo-img"
                                />
                            </div>

                            <div className="about-vision-mission">

                                <div className="about-card">
                                    <div className="about-column">
                                        <div className="about-icon"></div>

                                        <h3 className="about-headline">
                                            {t.visionTitle}
                                        </h3>

                                        <p className="about-description">
                                            {t.visionDesc}
                                        </p>
                                    </div>
                                </div>

                                <div className="about-card">
                                    <div className="about-column">
                                        <div className="about-icon"></div>

                                        <h3 className="about-headline">
                                            {t.missionTitle}
                                        </h3>

                                        <p className="about-description">
                                            {t.missionDesc}
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="social-icons">
                            <a href="#" aria-label={t.facebook}><i className="fa-brands fa-facebook"></i></a>
                            <a href="#" aria-label={t.linkedin}><i className="fa-brands fa-linkedin-in"></i></a>
                            <a href="#" aria-label={t.x}><i className="fa-brands fa-x-twitter"></i></a>
                            <a href="#" aria-label={t.instagram}><i className="fa-brands fa-instagram"></i></a>
                        </div>
                        <div className="footer-logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="footer-logo-img" />
                        </div>
                    </div>
                </div>
            </footer>

            <Script src="/js/index.js" strategy="afterInteractive" />
        </>
    );
}
