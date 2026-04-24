'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { translations, type Language } from '@/lib/translations';

function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}

export default function LocationMap({
    lat,
    lng,
    onChange
}: {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void
}) {

    const lang = getCurrentLang();
    const t = translations[lang];

    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const orangeIcon = L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 24 32">
            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="#ff6b35"/>
            <circle cx="12" cy="8" r="3" fill="#fff"/>
        </svg>`,
        iconSize: [28, 38],
        iconAnchor: [14, 38],
    });

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map('location-picker-map', {
                center: [lat || 21.5433, lng || 39.1728],
                zoom: 12
            });

            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    maxZoom: 18,
                    attribution: '© OpenStreetMap contributors'
                }
            ).addTo(mapRef.current);

            mapRef.current.on('click', (e) => {
                onChange(e.latlng.lat, e.latlng.lng);
            });

            setTimeout(() => {
                mapRef.current?.invalidateSize();
            }, 300);
        }
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        if (lat && lng) {
            if (!markerRef.current) {
                markerRef.current = L.marker(
                    [lat, lng],
                    { icon: orangeIcon }
                ).addTo(mapRef.current);
            } else {
                markerRef.current.setLatLng([lat, lng]);
            }

            mapRef.current.setView(
                [lat, lng],
                mapRef.current.getZoom(),
                { animate: true }
            );
        }
    }, [lat, lng]);

    function useCurrentLocation() {
        if (!navigator.geolocation) {
            alert(t.geolocationNotSupported);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange(
                    pos.coords.latitude,
                    pos.coords.longitude
                );
            },
            () => alert(t.unableToRetrieveLocation)
        );
    }

    return (
        <div style={{ marginBottom: '1.5rem' }}>

            <label className="form-label">
                {t.pinLocation}
            </label>

            <p
                className="step-description"
                style={{
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem'
                }}
            >
                {t.mapClickInstruction}
            </p>

            <div
                id="location-picker-map"
                style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    zIndex: 0
                }}
            />

            <button
                type="button"
                onClick={useCurrentLocation}
                style={{
                    width: '100%',
                    marginTop: '0.6rem',
                    padding: '0.6rem 1rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                }}
            >
                {t.useCurrentLocation}
            </button>

        </div>
    );
}