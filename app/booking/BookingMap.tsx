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

interface BookingMapProps {
    lat: number;
    lng: number;
}

export default function BookingMap({ lat, lng }: BookingMapProps) {

    const lang = getCurrentLang();
    const t = translations[lang];

    const mapRef = useRef<L.Map | null>(null);
    const mapContainerId = 'booking-map-container';

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerId, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false
            }).setView([lat, lng], 16);

            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution: t.openStreetMapAttribution,
                    maxZoom: 19,
                }
            ).addTo(mapRef.current);

            L.marker([lat, lng], {
                icon: L.divIcon({
                    className: '',
                    html: `<div style="background:#ff6b35;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(255,107,53,0.5);"></div>`,
                    iconAnchor: [7, 7],
                }),
            }).addTo(mapRef.current);

            setTimeout(() => {
                mapRef.current?.invalidateSize();
            }, 300);

        } else {
            mapRef.current.setView([lat, lng], 16);
        }

    }, [lat, lng]);

    return (
        <div
            id={mapContainerId}
            style={{
                height: '200px',
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden'
            }}
        />
    );
}