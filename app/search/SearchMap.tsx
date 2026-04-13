'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NEIGHBORHOODS: Record<string, { lat: number; lng: number; label: string }> = {
    'al-salama': { lat: 21.5550, lng: 39.1728, label: 'Al-Salama' },
    'al-rawdah': { lat: 21.5620, lng: 39.1850, label: 'Al-Rawdah' },
    'al-nahda': { lat: 21.5700, lng: 39.1950, label: 'Al-Nahda' },
    'al-andalus': { lat: 21.5433, lng: 39.1622, label: 'Al-Andalus' },
    'al-hamra': { lat: 21.5200, lng: 39.1500, label: 'Al-Hamra' },
    'al-rehab': { lat: 21.5380, lng: 39.2080, label: 'Al-Rehab' },
    'al-faisaliyah': { lat: 21.5300, lng: 39.1700, label: 'Al-Faisaliyah' },
    'al-naeem': { lat: 21.5650, lng: 39.2050, label: 'Al-Naeem' },
    'al-basateen': { lat: 21.5790, lng: 39.2200, label: 'Al-Basateen' },
    'al-shati': { lat: 21.4950, lng: 39.1150, label: 'Al-Shati (Corniche)' },
    'al-safa': { lat: 21.5100, lng: 39.1800, label: 'Al-Safa' },
    'al-aziziyah': { lat: 21.5460, lng: 39.2250, label: 'Al-Aziziyah' },
    'al-baghdadiyah': { lat: 21.5780, lng: 39.1630, label: 'Al-Baghdadiyah' },
    'al-balad': { lat: 21.4865, lng: 39.1815, label: 'Al-Balad' },
};

const JEDDAH_CENTER: [number, number] = [21.5433, 39.1728];

export default function SearchMap({ spaces }: { spaces: any[] }) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const mapContainerId = 'search-map-container';

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerId, { zoomControl: true, scrollWheelZoom: false }).setView(JEDDAH_CENTER, 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
            }).addTo(mapRef.current);

            setTimeout(() => { mapRef.current?.invalidateSize(); }, 300);
        }
    }, [mapContainerId]);

    useEffect(() => {
        if (!mapRef.current) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        spaces.forEach(space => {
            const hood = space.Neighborhood || space.City || '';
            const hoodKey = Object.keys(NEIGHBORHOODS).find(k =>
                hood.toLowerCase().includes(k) || k.includes(hood.toLowerCase())
            );

            let lat, lng;
            if (hoodKey) {
                lat = NEIGHBORHOODS[hoodKey].lat + (Math.random() - 0.5) * 0.005;
                lng = NEIGHBORHOODS[hoodKey].lng + (Math.random() - 0.5) * 0.005;
            } else if (space.Latitude && space.Longitude) {
                lat = space.Latitude;
                lng = space.Longitude;
            } else {
                lat = JEDDAH_CENTER[0] + (Math.random() - 0.5) * 0.08;
                lng = JEDDAH_CENTER[1] + (Math.random() - 0.5) * 0.08;
            }

            const formatScore = space.PricePerMonth ? (space.PricePerMonth >= 1000 ? (space.PricePerMonth / 1000).toFixed(1) + 'k' : space.PricePerMonth.toFixed(0)) : '?';

            const icon = L.divIcon({
                className: '',
                html: `<div style="
                    background: #ff6b35; color: #fff; font-size: 11px; font-weight: 700;
                    padding: 4px; border-radius: 50%; width: 40px; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 8px rgba(255,107,53,0.6); border: 2px solid #fff;
                ">${formatScore}</div>`,
                iconAnchor: [20, 20],
            });

            const marker = L.marker([lat, lng], { icon })
                .addTo(mapRef.current!)
                .bindPopup(`
                    <strong>${space.Title || 'Storage Space'}</strong><br>
                    ${space.SpaceType || ''} · ${space.Size || '?'} m²<br>
                    <b>${space.PricePerMonth !== undefined ? (space.PricePerMonth >= 1000 ? (space.PricePerMonth / 1000).toFixed(1) + 'k' : space.PricePerMonth.toFixed(0)) : '?'} SAR/mo</b><br>
                    <button onclick="window.dispatchEvent(new CustomEvent('openSpaceModal', {detail: ${space.SpaceID}}))" class="btn btn-dark btn-small" style="width: 100%; margin-top: 8px; padding: 4px; font-size: 11px;">View Details</button>
                `);

            markersRef.current.push(marker);
        });

    }, [spaces]);

    return (
        <div
            id={mapContainerId}
            style={{
                height: '280px', width: '100%', borderRadius: '14px', marginBottom: '20px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 0
            }}
        />
    );
}
