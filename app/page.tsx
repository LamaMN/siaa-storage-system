import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { translations, type Language } from '@/lib/translations';
import LanguageToggle from '@/app/components/LanguageToggle';

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
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                    <LanguageToggle />
                </div>

                <div className="container">
                    <div className="header-content">
                        <a
                            href="/register"
                            className="btn btn-primary btn-header"
                            style={{ width: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                            {t.getStarted}
                        </a>

                        <nav className="nav">
                            <a href="#about">{t.about}</a>
                            <a href="#features">{t.features}</a>
                            <a href="#how-it-works">{t.howItWorks}</a>
                        </nav>

                        <div className="logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="hero">
                <div className="container">
                    <h1 className="hero-title">Store Smart. Nearby. Hassle-Free.</h1>
                    <p className="hero-subtitle">Find, book, and visualize storage spaces in your neighborhood.</p>
                    <div className="hero-buttons">
                        <a href="/search" className="btn btn-dark btn-large">Find Storage Near Me</a>
                        <a href="/register" className="btn btn-outline btn-large">Become a Space Provider</a>
                    </div>
                </div>
            </section>

            {/* Why Si'aa */}
            <section className="why-section reveal-on-scroll" id="why">
                <div className="container">
                    <h2 className="section-title">Why Si&apos;aa Exists</h2>
                    <div className="why-grid">
                        <div className="why-card">
                            <div className="why-image"><img src="/Media/Image.png" alt="High Cost & Wasted Space" /></div>
                            <h3 className="why-headline">High Cost & Wasted Space</h3>
                            <p className="why-description">Traditional storage forces long-term contracts & oversized units.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-image"><img src="/Media/Image (1).png" alt="Poor Flexibility" /></div>
                            <h3 className="why-headline">Poor Flexibility</h3>
                            <p className="why-description">Users can&apos;t rent for short durations or adjust space as needed.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-image"><img src="/Media/Image (2).png" alt="No Visualization" /></div>
                            <h3 className="why-headline">No Visualization or Smart Matching</h3>
                            <p className="why-description">No tools to estimate fit — booking errors, dissatisfaction.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section reveal-on-scroll" id="features">
                <div className="container">
                    <h2 className="section-title">Everything You Need in One Platform</h2>
                    <div className="features-grid">
                        {[
                            { src: '/Media/PeerToPeer.png', title: 'Peer-to-Peer Storage', desc: 'Utilize unused rooms, garages, basements.' },
                            { src: '/Media/Ai Smart Matching.png', title: 'AI Smart Matching', desc: 'Recommends ideal space based on size, budget, and environment.' },
                            { src: '/Media/SpaceVisualization.png', title: 'Space Visualization', desc: 'Preview how your items fit before booking.' },
                            { src: '/Media/Logistics.png', title: 'Integrated Logistics', desc: 'Pickup & delivery from third-party providers.' },
                            { src: '/Media/SafetyShield.png', title: 'Trust & Safety System', desc: 'Verified hosts, ID checks, reviews, and insurance.' },
                            { src: '/Media/affordable.png', title: 'Flexible, Affordable Pricing', desc: 'Book daily/weekly/monthly storage.' },
                        ].map((f) => (
                            <div className="feature-card" key={f.title}>
                                <div className="feature-icon"><img src={f.src} alt={f.title} /></div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-description">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works-section reveal-on-scroll" id="how-it-works">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-icon"><img src="/Media/Search.png" alt="Search" /></div>
                            <h3 className="step-title">Search</h3>
                            <p className="step-description">Enter your location & storage needs.</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-icon"><img src="/Media/Visualize.png" alt="Visualize" /></div>
                            <h3 className="step-title">Visualize</h3>
                            <p className="step-description">Preview how items fit.</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-icon"><img src="/Media/book.png" alt="Book" /></div>
                            <h3 className="step-title">Book</h3>
                            <p className="step-description">Choose dates, pay securely through Mada/Apple Pay.</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-icon"><img src="/Media/store.png" alt="Store" /></div>
                            <h3 className="step-title">Store</h3>
                            <p className="step-description">Drop items off or book logistics for pickup.</p>
                        </div>
                    </div>
                    <div className="how-it-works-cta">
                        <a href="/search" className="btn btn-dark btn-large">Find Your Space Now</a>
                    </div>
                </div>
            </section>

            {/* Income Section */}
            <section className="income-section reveal-on-scroll">
                <div className="container">
                    <div className="income-content">
                        <div className="income-text">
                            <h2 className="income-title">Turn Your Extra Space Into Income</h2>
                            <p className="income-description">List your spare room, garage, or basement and earn money effortlessly.</p>
                            <ul className="income-benefits">
                                <li>List your spare room, garage, or basement.</li>
                                <li>Earn passive income.</li>
                                <li>Full control of pricing & availability.</li>
                                <li>Optional insurance for your space.</li>
                                <li>Verified and trusted renters.</li>
                            </ul>
                            <a href="/register?type=provider" className="btn btn-primary btn-large">Start Listing Your Space</a>
                        </div>
                        <div className="income-image">
                            <img src="/Media/Card (2).png" alt="Turn Your Extra Space Into Income" />
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
                    <h2 className="about-title">Who We Are?</h2>
                    <div className="about-wrapper">
                        <div className="about-content">
                            <div className="about-card">
                                <div className="about-block">
                                    <div className="about-icon"></div>
                                    <div className="about-text">
                                        <h3 className="about-headline">A technical project aiming to redefine the concept of storage through a smart platform that connects users</h3>
                                        <p className="about-description">with available spaces near them in a flexible, safe, and easy way.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="about-card">
                                <div className="about-block">
                                    <div className="about-icon"></div>
                                    <div className="about-text">
                                        <h3 className="about-headline">We believe that empty space is an opportunity — through artificial intelligence</h3>
                                        <p className="about-description">and smart matching, Si&apos;aa helps individuals and small business owners find the suitable space, at the price, location, and duration that suits them.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-logo-section">
                            <div className="about-logo">
                                <img src="/Media/Logo.png" alt="Si'aa Logo" className="about-logo-img" />
                            </div>
                            <div className="about-vision-mission">
                                <div className="about-card">
                                    <div className="about-column">
                                        <div className="about-icon"></div>
                                        <h3 className="about-headline">Our Vision</h3>
                                        <p className="about-description">To be the first choice for smart and community storage in the Arab world.</p>
                                    </div>
                                </div>
                                <div className="about-card">
                                    <div className="about-column">
                                        <div className="about-icon"></div>
                                        <h3 className="about-headline">Our Mission</h3>
                                        <p className="about-description">Empowering individuals and communities to use spaces smartly and efficiently.</p>
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
                            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
                            <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
                            <a href="#" aria-label="X"><i className="fa-brands fa-x-twitter"></i></a>
                            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                        </div>
                        <div className="footer-logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="footer-logo-img" />
                        </div>
                    </div>
                </div>
            </footer>

            <script src="/js/index.js" defer></script>
        </>
    );
}
