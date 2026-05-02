'use client';
import { useEffect, useState, useRef } from 'react';
import React from 'react';

interface FavoriteSpace {
    SpaceID: number;
    Title: string;
    AddressLine1?: string;
    FirstImageID?: number;
    PricePerMonth?: number;
    Size?: number;
    BusinessName?: string;
    ClimateControlled?: boolean;
    SecuritySystem?: boolean;
    CCTVMonitored?: boolean;
    ParkingAvailable?: boolean;
    LoadingAssistance?: boolean;
}

export default function LanguageToggle() {
    const [lang, setLang] = useState<'en' | 'ar'>('en');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProvider, setIsProvider] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [showFavorites, setShowFavorites] = useState(false);
    const [favorites, setFavorites] = useState<FavoriteSpace[]>([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
        if (match?.[1] === 'ar') setLang('ar');

        const token = localStorage.getItem('siaaToken');
        if (token) setIsLoggedIn(true);

        const userStr = localStorage.getItem('siaaUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.userType === 'provider') setIsProvider(true);
                if (user.userType === 'admin') setIsAdmin(true);
            } catch (e) {}
        }

        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setShowFavorites(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function toggleFavoritesDropdown() {
        if (showFavorites) {
            setShowFavorites(false);
            return;
        }
        setShowFavorites(true);
        setFavoritesLoading(true);
        try {
            const token = localStorage.getItem('siaaToken');
            if (!token) return;
            const res = await fetch('/api/favorites', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const data = json.data || json;
            setFavorites(data.favorites || []);
        } catch (error) {
            console.error('Failed to load favorites', error);
        } finally {
            setFavoritesLoading(false);
        }
    }

    async function removeFavorite(e: React.MouseEvent, spaceId: number) {
        e.stopPropagation();
        const token = localStorage.getItem('siaaToken');
        try {
            const res = await fetch(`/api/spaces/${spaceId}/favorite`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setFavorites(prev => prev.filter(f => f.SpaceID !== spaceId));
            }
        } catch (error) {
            console.error('Failed to remove favorite', error);
        }
    }

    function openSpaceDetails(spaceId: number) {
        sessionStorage.setItem('openSpaceId', spaceId.toString());
        window.location.href = '/search';
    }

    function toggleLang() {
        const newLang = lang === 'en' ? 'ar' : 'en';
        document.cookie = `lang=${newLang}; path=/`;
        window.location.reload();
    }

    async function handleSignOut(e: React.MouseEvent) {
        e.preventDefault();
        try {
            await fetch('/api/auth/me', { method: 'POST' });
        } catch (error) {
            console.error('Error signing out:', error);
        }
        document.cookie = 'siaa-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/login';
    }

    return (
        <div className="header-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '1.2rem', color: '#4a5568' }}>
            <a
                onClick={toggleLang}
                style={{ cursor: 'pointer', transition: 'color 0.3s', fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a365d')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
            >
                {lang === 'en' ? 'AR' : 'EN'}
            </a>

            {isLoggedIn && !isProvider && !isAdmin && (
                <div className="favorites-container" ref={popupRef}>
                    <button
                        onClick={toggleFavoritesDropdown}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: showFavorites ? '#e53e3e' : '#ff6b35',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.3s'
                        }}
                        title={lang === 'en' ? 'Favorites' : 'المفضلة'}
                    >
                        <i className="fa-solid fa-heart"></i>
                    </button>
                    
                    {showFavorites && (
                        <div className="favorites-dropdown">
                            <div className="favorites-dropdown-header">
                                {lang === 'en' ? 'Your Favorites' : 'المفضلة لديك'}
                            </div>
                            {favoritesLoading ? (
                                <div className="favorites-empty">{lang === 'en' ? 'Loading...' : 'جاري التحميل...'}</div>
                            ) : favorites.length === 0 ? (
                                <div className="favorites-empty">{lang === 'en' ? 'No saved spaces yet.' : 'لا توجد مساحات محفوظة حتى الآن.'}</div>
                            ) : (
                                favorites.map(space => {
                                    const features = [];
                                    if (space.ClimateControlled) features.push(lang === 'en' ? 'Climate Controlled' : 'مكيفة');
                                    if (space.SecuritySystem || space.CCTVMonitored) features.push(lang === 'en' ? 'Secure' : 'آمنة');
                                    if (space.ParkingAvailable) features.push(lang === 'en' ? 'Parking' : 'مواقف');
                                    if (space.LoadingAssistance) features.push(lang === 'en' ? 'Loading Assistance' : 'مساعدة تحميل');

                                    return (
                                        <div key={space.SpaceID} className="favorite-item" onClick={() => openSpaceDetails(space.SpaceID)}>
                                            <img
                                                src={space.FirstImageID ? `/api/spaces/${space.FirstImageID}/image` : '/Media/space-placeholder.png'}
                                                alt={space.Title}
                                                className="favorite-item-img"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/Media/space-placeholder.png'; }}
                                            />
                                            <div className="favorite-item-content">
                                                <h4 className="favorite-item-title">{space.Title}</h4>
                                                {space.BusinessName && <span className="favorite-item-company">{space.BusinessName}</span>}
                                                <div className="favorite-item-details">
                                                    <span>{space.AddressLine1}</span>
                                                    <span>{space.PricePerMonth} SAR/mo • {space.Size} m²</span>
                                                </div>
                                                {features.length > 0 && (
                                                    <span className="favorite-item-features">{features.join(' • ')}</span>
                                                )}
                                            </div>
                                            <button 
                                                className="favorite-item-remove" 
                                                onClick={(e) => removeFavorite(e, space.SpaceID)}
                                                title={lang === 'en' ? 'Remove from favorites' : 'إزالة من المفضلة'}
                                            >
                                                <i className="fa-solid fa-heart"></i>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            <a
                href="/dashboard"
                style={{ cursor: 'pointer', transition: 'color 0.3s', color: 'inherit' }}
                title="Dashboard"
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a365d')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
            >
                <i className="fa-solid fa-user"></i>
            </a>

            {isLoggedIn && (
                <a
                    onClick={handleSignOut}
                    style={{ cursor: 'pointer', transition: 'color 0.3s' }}
                    title="Sign Out"
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#1a365d')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
                >
                    <i className="fa-solid fa-sign-out-alt"></i>
                </a>
            )}
        </div>
    );
}