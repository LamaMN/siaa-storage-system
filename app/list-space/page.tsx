'use client';
import { useEffect, useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';

const LocationMap = dynamic(() => import('./LocationMap'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}><Loader /></div>
});

interface User {
    id: number;
    userType: string;
    firstName: string;
}

export default function ListSpacePage() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1
        listingTitle: '',
        listingNeighborhood: '',
        listingAddress: '',
        latitude: '',
        longitude: '',
        listingType: '',
        listingSize: '',
        listingLength: '',
        listingWidth: '',
        listingHeight: '',
        listingDescription: '',
        buildingNumber: '',
        floorNumber: '',

        // Step 2
        featTemperature: false,
        featClimate: false,
        featHumidity: false,
        featDry: false,
        featSecureAccess: false,
        featCCTV: false,
        featLighting: false,
        temperatureValue: '',
        humidityValue: '',
        prohibitedItems: '',
        listingPhotos: null as FileList | null,
        listingVideo: null as FileList | null,

        // Step 3
        accessType: '24-7',
        availableFrom: '',
        availableTo: '',
        pricePerDay: '',
        pricePerWeek: '',
        pricePerMonth: '',
        maxRentalPeriod: '',
        accessNotes: '',

        // Step 4
        listingStatus: 'active'
    });

    // Derived Area
    const length = parseFloat(formData.listingLength) || 0;
    const width = parseFloat(formData.listingWidth) || 0;
    const calculatedArea = length * width;

    useEffect(() => {
        const storedUser = localStorage.getItem('siaaUser');
        const storedToken = localStorage.getItem('siaaToken');
        if (!storedUser || !storedToken) {
            window.location.href = '/login';
            return;
        }
        const u = JSON.parse(storedUser);
        if (u.userType !== 'provider') {
            alert('Only providers can list spaces');
            window.location.href = '/dashboard';
            return;
        }
        setUser(u);
        setToken(storedToken);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).files }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const nextStep = () => {
        // Simple validations
        if (currentStep === 1) {
            if (!formData.listingTitle || !formData.listingNeighborhood || !formData.listingAddress || !formData.latitude || !formData.longitude || !formData.listingType || !formData.listingLength || !formData.listingWidth || !formData.listingHeight || !formData.listingDescription) {
                alert('Please fill out all required fields in Step 1.');
                return;
            }
        }
        if (currentStep === 2) {
            if (!formData.listingPhotos || formData.listingPhotos.length < 3) {
                alert('Please upload at least 3 photos.');
                return;
            }
        }
        if (currentStep === 3) {
            if (!formData.pricePerMonth) {
                alert('Please provide a monthly price.');
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const data: Record<string, unknown> = {
            title: formData.listingTitle,
            city: 'Jeddah',
            addressLine1: formData.listingAddress,
            addressLine2: formData.listingNeighborhood,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            spaceType: formData.listingType,
            size: calculatedArea || parseFloat(formData.listingSize),
            length: length,
            width: width,
            height: parseFloat(formData.listingHeight),
            description: formData.listingDescription,
            buildingNumber: formData.buildingNumber || undefined,
            floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : undefined,

            climateControlled: formData.featClimate || formData.featTemperature,
            cctvMonitored: formData.featCCTV,
            securitySystem: formData.featSecureAccess,
            parkingAvailable: false,
            loadingAssistance: false,
            restrictions: formData.prohibitedItems,
            temperature: (formData.featTemperature || formData.featClimate || formData.featHumidity) && formData.temperatureValue ? parseFloat(formData.temperatureValue) : undefined,
            humidity: (formData.featTemperature || formData.featClimate || formData.featHumidity) && formData.humidityValue ? parseFloat(formData.humidityValue) : undefined,

            accessType: formData.accessType,
            availableFrom: formData.availableFrom,
            availableTo: formData.availableTo,
            accessNotes: formData.accessNotes,

            pricePerMonth: parseFloat(formData.pricePerMonth),
            pricePerWeek: formData.pricePerWeek ? parseFloat(formData.pricePerWeek) : undefined,
            pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : undefined,
            maxRentalPeriod: formData.maxRentalPeriod ? parseInt(formData.maxRentalPeriod) : undefined,
            status: 'Pending',
        };

        try {
            const res = await fetch('/api/spaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const response = await res.json();

            if (!res.ok) {
                setError(response.error || 'Failed to list space');
                return;
            }

            const spaceId = response.data?.spaceId;

            // Upload photos if provider selected any
            if (spaceId && formData.listingPhotos && formData.listingPhotos.length > 0) {
                const photoForm = new FormData();
                for (let i = 0; i < formData.listingPhotos.length; i++) {
                    photoForm.append(`image${i}`, formData.listingPhotos[i]);
                }
                await fetch(`/api/spaces/${spaceId}/images`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: photoForm,
                });
            }

            setSuccess('Your space has been submitted for review! It will be visible to renters once approved by the admin.');
            (document.getElementById('listingForm') as HTMLFormElement)?.reset();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return <Loader />;

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/dashboard">Dashboard</a>
                            <a href="/#about">About</a>
                            <a href="/#features">Features</a>
                            <a href="/#how-it-works">How It Works</a>
                        </nav>
                        <div className="logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>
            <style dangerouslySetInnerHTML={{
                __html: `
                .premium-file-input {
                    font-family: 'Baloo Bhaijaan 2', sans-serif !important;
                }
                .premium-file-input::file-selector-button {
                    padding: 8px 16px;
                    margin-right: 15px;
                    border-radius: 999px;
                    border: none;
                    background-color: #e2e8f0;
                    color: #4a5568;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Baloo Bhaijaan 2', sans-serif !important;
                }
                .premium-file-input::file-selector-button:hover {
                    background-color: #cbd5e0;
                }
                .step-panel.is-active {
                    display: flex;
                    flex-direction: column;
                    gap: 5px; /* Increased spacing between rows */
                }
                .step-row {
                    gap: 24px !important; /* Increased spacing between items in a row */
                }
                .form-group {
                    gap: 10px !important; /* Increased spacing between label and input */
                }
                .step-actions {
                    margin-top: 12px;
                }
            ` }} />

            <section className="listing-section">
                <div className="container">
                    {success ? (
                        <div className="listing-confirmation" style={{ display: 'block' }}>
                            <h3>Your space has been submitted for review 📋</h3>
                            <p>Wen admin will review your listing shortly. Once approved, it will be visible to renters searching in your neighborhood.</p>
                            <a href="/dashboard" className="btn btn-dark" style={{ marginTop: '1rem', display: 'inline-block' }}>Go to Dashboard</a>
                        </div>
                    ) : (
                        <>
                            <div className="listing-header">
                                <h1 className="listing-title">List a New Storage Space</h1>
                                <p className="listing-subtitle">
                                    Add your space in a few guided steps. We’ll help you set details, environment, access, and publish your listing.
                                </p>
                            </div>

                            {error && (
                                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    ✗ {error}
                                </div>
                            )}

                            <div className="listing-layout">
                                <div className="steps-card">
                                    <div className="steps-row">
                                        <div className={`step-pill ${currentStep === 1 ? 'is-active' : ''}`}>
                                            <span className="step-number">1</span>
                                            <span className="step-label">Basic Details</span>
                                        </div>
                                        <div className={`step-pill ${currentStep === 2 ? 'is-active' : ''}`}>
                                            <span className="step-number">2</span>
                                            <span className="step-label">Environment & Media</span>
                                        </div>
                                        <div className={`step-pill ${currentStep === 3 ? 'is-active' : ''}`}>
                                            <span className="step-number">3</span>
                                            <span className="step-label">Access & Pricing</span>
                                        </div>
                                        <div className={`step-pill ${currentStep === 4 ? 'is-active' : ''}`}>
                                            <span className="step-number">4</span>
                                            <span className="step-label">Review & Publish</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="listing-card">
                                    <form id="listingForm" className="listing-form" onSubmit={handleSubmit}>

                                        {/* STEP 1 */}
                                        {currentStep === 1 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Basic space details</h2>
                                                <p className="step-description">Tell guests what type of space you’re offering and where it is.</p>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Listing title *</label>
                                                        <input name="listingTitle" type="text" className="form-input" placeholder="e.g., Indoor storage room in Al-Salama" value={formData.listingTitle} onChange={handleInputChange} required />
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">Neighborhood (Jeddah) *</label>
                                                        <input list="neighborhoods" name="listingNeighborhood" className="form-input" placeholder="e.g., Al-Salama" value={formData.listingNeighborhood} onChange={handleInputChange} required />
                                                        <datalist id="neighborhoods">
                                                            <option value="Al-Salama" />
                                                            <option value="Al-Rawdah" />
                                                            <option value="Al-Nahda" />
                                                            <option value="Al-Andalus" />
                                                            <option value="Al-Hamra" />
                                                            <option value="Al-Rehab" />
                                                            <option value="Al-Faisaliyah" />
                                                            <option value="Al-Naeem" />
                                                            <option value="Al-Basateen" />
                                                            <option value="Al-Shati" />
                                                            <option value="Al-Safa" />
                                                            <option value="Al-Aziziyah" />
                                                            <option value="Al-Baghdadiyah" />
                                                            <option value="Al-Balad" />
                                                        </datalist>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Full address *</label>
                                                    <input name="listingAddress" type="text" className="form-input" placeholder="Building, street, nearby landmark…" value={formData.listingAddress} onChange={handleInputChange} required />
                                                </div>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Building Number</label>
                                                        <input name="buildingNumber" type="text" className="form-input" placeholder="Optional" value={formData.buildingNumber} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Floor Number</label>
                                                        <input name="floorNumber" type="number" className="form-input" placeholder="Optional" value={formData.floorNumber} onChange={handleInputChange} />
                                                    </div>
                                                </div>

                                                <LocationMap
                                                    lat={parseFloat(formData.latitude) || 21.5433}
                                                    lng={parseFloat(formData.longitude) || 39.1728}
                                                    onChange={(lat, lng) => setFormData(f => ({ ...f, latitude: String(lat), longitude: String(lng) }))}
                                                />

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Latitude *</label>
                                                        <input name="latitude" type="number" step="0.000001" className="form-input" placeholder="e.g., 21.543321" value={formData.latitude} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Longitude *</label>
                                                        <input name="longitude" type="number" step="0.000001" className="form-input" placeholder="e.g., 39.172123" value={formData.longitude} onChange={handleInputChange} required />
                                                    </div>
                                                </div>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Space type *</label>
                                                        <input list="spaceTypes" name="listingType" className="form-input" placeholder="e.g., room" value={formData.listingType} onChange={handleInputChange} required />
                                                        <datalist id="spaceTypes">
                                                            <option value="room" />
                                                            <option value="garage" />
                                                            <option value="warehouse" />
                                                            <option value="outdoor" />
                                                            <option value="Basement" />
                                                        </datalist>
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">Approximate size (m²)</label>
                                                        <input name="listingSize" type="number" min="1" className="form-input" placeholder="e.g., 6" value={formData.listingSize} onChange={handleInputChange} />
                                                    </div>
                                                </div>

                                                <div className="step-row four-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">Length (m) *</label>
                                                        <input name="listingLength" type="number" min="1" className="form-input" placeholder="e.g. 3" value={formData.listingLength} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Width (m) *</label>
                                                        <input name="listingWidth" type="number" min="1" className="form-input" placeholder="e.g. 2" value={formData.listingWidth} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Height (m) *</label>
                                                        <input name="listingHeight" type="number" min="1" className="form-input" placeholder="e.g. 2.5" value={formData.listingHeight} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Area (m²) *</label>
                                                        <input type="text" className="form-input" value={calculatedArea > 0 ? calculatedArea : ''} placeholder="auto-calculated" disabled required />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Description *</label>
                                                    <textarea name="listingDescription" className="form-input" rows={3} placeholder="Describe what can be stored, building type, access, etc." value={formData.listingDescription} onChange={handleInputChange} required></textarea>
                                                </div>

                                                <div className="step-actions">
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>Next: Environment & Media</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2 */}
                                        {currentStep === 2 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Environment & media</h2>
                                                <p className="step-description">Set environmental conditions and upload photos / video of your space.</p>

                                                <div className="form-group">
                                                    <span className="form-label">Environmental conditions (choose all that apply)</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featTemperature" checked={formData.featTemperature} onChange={handleInputChange} />
                                                            <span>Temperature-controlled</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featClimate" checked={formData.featClimate} onChange={handleInputChange} />
                                                            <span>Climate-controlled</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featHumidity" checked={formData.featHumidity} onChange={handleInputChange} />
                                                            <span>Humidity-controlled</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featDry" checked={formData.featDry} onChange={handleInputChange} />
                                                            <span>Dry storage</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <span className="form-label">Security & convenience</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featSecureAccess" checked={formData.featSecureAccess} onChange={handleInputChange} />
                                                            <span>Secure access (lock / gate)</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featCCTV" checked={formData.featCCTV} onChange={handleInputChange} />
                                                            <span>CCTV</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featLighting" checked={formData.featLighting} onChange={handleInputChange} />
                                                            <span>Good lighting</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {(formData.featTemperature || formData.featClimate || formData.featHumidity) && (
                                                    <>
                                                        <div className="step-row">
                                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                                <label className="form-label">Temperature (°C) (Optional)</label>
                                                                <input name="temperatureValue" type="number" step="0.1" className="form-input" placeholder="e.g. 22" value={formData.temperatureValue} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                                <label className="form-label">Humidity (%) (Optional)</label>
                                                                <input name="humidityValue" type="number" step="1" className="form-input" placeholder="e.g. 45" value={formData.humidityValue} onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        <p className="step-note" style={{ marginTop: '0.25rem', marginBottom: '1.5rem' }}>Note: this is the current condition at home.</p>
                                                    </>
                                                )}

                                                <div className="form-group">
                                                    <label className="form-label">Prohibited items (optional)</label>
                                                    <textarea name="prohibitedItems" className="form-input" rows={2} placeholder="e.g., No flammable materials, no chemicals…" value={formData.prohibitedItems} onChange={handleInputChange}></textarea>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" style={{ fontFamily: "'Baloo Bhaijaan 2', sans-serif" }}>Upload photos *</label>
                                                    <input
                                                        name="listingPhotos"
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="premium-file-input"
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            padding: '10px 14px',
                                                            backgroundColor: 'rgba(240, 247, 255, 0.4)',
                                                            border: '1px solid #e1e9f4',
                                                            borderRadius: '10px',
                                                            fontSize: '14px',
                                                            color: '#4a5568',
                                                            cursor: 'pointer',
                                                            fontFamily: "'Baloo Bhaijaan 2', sans-serif"
                                                        }}
                                                        onChange={handleInputChange}
                                                    />
                                                    <p style={{ fontSize: '11px', color: '#718096', marginTop: '6px', marginLeft: '4px', fontFamily: "'Baloo Bhaijaan 2', sans-serif" }}>
                                                        JPG, PNG, max 2MB. A clear front-facing photo works best. Min 3, max 15.
                                                    </p>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" style={{ fontFamily: "'Baloo Bhaijaan 2', sans-serif" }}>Optional video tour</label>
                                                    <input
                                                        name="listingVideo"
                                                        type="file"
                                                        accept="video/*"
                                                        className="premium-file-input"
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            padding: '10px 14px',
                                                            backgroundColor: 'rgba(240, 247, 255, 0.4)',
                                                            border: '1px solid #e1e9f4',
                                                            borderRadius: '10px',
                                                            fontSize: '14px',
                                                            color: '#4a5568',
                                                            cursor: 'pointer',
                                                            fontFamily: "'Baloo Bhaijaan 2', sans-serif"
                                                        }}
                                                        onChange={handleInputChange}
                                                    />
                                                    <p style={{ fontSize: '11px', color: '#718096', marginTop: '6px', marginLeft: '4px', fontFamily: "'Baloo Bhaijaan 2', sans-serif" }}>
                                                        Optional short video showing the space entrance and conditions.
                                                    </p>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep}>Back</button>
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>Next: Access & Pricing</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3 */}
                                        {currentStep === 3 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Access & pricing</h2>
                                                <p className="step-description">Define how and when renters can access the space and set your price.</p>

                                                <div className="form-group">
                                                    <span className="form-label">Access method *</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="radio" name="accessType" value="24-7" checked={formData.accessType === '24-7'} onChange={handleInputChange} required />
                                                            <span>24/7 access</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="radio" name="accessType" value="business-hours" checked={formData.accessType === 'business-hours'} onChange={handleInputChange} />
                                                            <span>Business hours</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="radio" name="accessType" value="by-appointment" checked={formData.accessType === 'by-appointment'} onChange={handleInputChange} />
                                                            <span>By appointment</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {formData.accessType !== '24-7' && (
                                                    <div className="step-row availability-row">
                                                        <div className="form-group">
                                                            <label className="form-label">Available from</label>
                                                            <input name="availableFrom" type="time" className="form-input" value={formData.availableFrom} onChange={handleInputChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">Available until</label>
                                                            <input name="availableTo" type="time" className="form-input" value={formData.availableTo} onChange={handleInputChange} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="step-row three-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">Price per Day (SAR)</label>
                                                        <input name="pricePerDay" type="number" min="0" className="form-input" placeholder="Optional" value={formData.pricePerDay} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Price per Week (SAR)</label>
                                                        <input name="pricePerWeek" type="number" min="0" className="form-input" placeholder="Optional" value={formData.pricePerWeek} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Price per Month (SAR) *</label>
                                                        <input name="pricePerMonth" type="number" min="1" className="form-input" placeholder="Required" value={formData.pricePerMonth} onChange={handleInputChange} required />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Max Rental Period (Months)</label>
                                                    <input name="maxRentalPeriod" type="number" min="1" className="form-input" placeholder="Optional" value={formData.maxRentalPeriod} onChange={handleInputChange} />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Entry requirements / access notes</label>
                                                    <textarea name="accessNotes" className="form-input" rows={2} placeholder="e.g., Access via security gate, ID required with guard, parking instructions…" value={formData.accessNotes} onChange={handleInputChange}></textarea>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep}>Back</button>
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>Next: Review & Publish</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 4 */}
                                        {currentStep === 4 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Review & publish</h2>
                                                <p className="step-description">Check your information before publishing your listing.</p>

                                                <div className="summary-box">
                                                    <h3>{formData.listingTitle || 'Untitled Listing'}</h3>
                                                    <p><strong>Location:</strong> {formData.listingAddress}, {formData.listingNeighborhood}</p>
                                                    <p><strong>Type:</strong> {formData.listingType} ({calculatedArea} m²)</p>
                                                    <p><strong>Price:</strong> {formData.pricePerMonth} SAR/month</p>
                                                    <br />
                                                    <p className="step-note">When you click "List space", your listing will be submitted for admin approval. Once approved, it will be visible to renters.</p>
                                                </div>

                                                <div className="form-group">
                                                    <span className="form-label">Ownership Verification Document *</span>
                                                    <input name="listingVerification" type="file" accept=".pdf,image/*" className="form-input" onChange={handleInputChange} required />
                                                    <p className="step-note">Upload a deed, leasing contract, or authorization proof for security verification.</p>
                                                </div>



                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep} disabled={loading}>Back</button>
                                                    <button type="submit" className="btn btn-dark" disabled={loading}>{loading ? 'Listing Space...' : 'List Space'}</button>
                                                </div>
                                            </div>
                                        )}

                                    </form>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

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
        </>
    );
}

