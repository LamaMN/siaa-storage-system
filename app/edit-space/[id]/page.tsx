'use client';
import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';

function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';

    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}
function usePageLanguage(): Language {
    const [lang, setLang] = useState<Language>(() => getCurrentLang());

    useEffect(() => {
        setLang(getCurrentLang());
    }, []);

    return lang;
}
const LocationMap = dynamic(() => import('../../list-space/LocationMap'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}><Loader /></div>
});

interface User {
    id: number;
    userType: string;
    firstName: string;
}

export default function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
    const lang = usePageLanguage();
    const t = translations[lang];
    const { id } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [spaceLoading, setSpaceLoading] = useState(true);
    const [selectedPhotos, setSelectedPhotos] = useState<FileList | null>(null);

    // Form State – mirrors list-space
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
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    useEffect(() => {
        const storedUser = localStorage.getItem('siaaUser');
        const storedToken = localStorage.getItem('siaaToken');

        if (!storedUser || !storedToken) {
            window.location.href = '/login';
            return;
        }

        const u = JSON.parse(storedUser);

        if (u.userType !== 'provider') {
            alert(t.onlyProvidersEditSpaces);
            window.location.href = '/dashboard';
            return;
        }

        setUser(u);
        setToken(storedToken);

        fetch(`/api/spaces/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.space) {
                    const s = data.space;

                    let accessType = '24-7';
                    if (s.AccessType === 'BusinessHours' || s.AccessType === 'business-hours') accessType = 'business-hours';
                    else if (s.AccessType === 'ByAppointment' || s.AccessType === 'by-appointment') accessType = 'by-appointment';

                    setFormData({
                        listingTitle: s.Title || '',
                        listingNeighborhood: s.AddressLine2 || '',
                        listingAddress: s.AddressLine1 || '',
                        latitude: s.Latitude != null ? String(s.Latitude) : '',
                        longitude: s.Longitude != null ? String(s.Longitude) : '',
                        listingType: s.SpaceType || '',
                        listingSize: s.Size != null ? String(s.Size) : '',
                        listingLength: s.Length != null ? String(s.Length) : '',
                        listingWidth: s.Width != null ? String(s.Width) : '',
                        listingHeight: s.Height != null ? String(s.Height) : '',
                        listingDescription: s.Description || '',
                        buildingNumber: s.BuildingNumber || '',
                        floorNumber: s.FloorNumber != null ? String(s.FloorNumber) : '',
                        featTemperature: !!s.ClimateControlled,
                        featClimate: !!s.ClimateControlled,
                        featHumidity: false,
                        featDry: false,
                        featSecureAccess: !!s.SecuritySystem,
                        featCCTV: !!s.CctvMonitored,
                        featLighting: false,
                        temperatureValue: s.Temperature != null ? String(s.Temperature) : '',
                        humidityValue: s.Humidity != null ? String(s.Humidity) : '',
                        prohibitedItems: s.Restrictions || '',
                        accessType,
                        availableFrom: s.AvailableFrom || '',
                        availableTo: s.AvailableTo || '',
                        pricePerDay: s.PricePerDay != null ? String(s.PricePerDay) : '',
                        pricePerWeek: s.PricePerWeek != null ? String(s.PricePerWeek) : '',
                        pricePerMonth: s.PricePerMonth != null ? String(s.PricePerMonth) : '',
                        maxRentalPeriod: s.MaxRentalPeriod != null ? String(s.MaxRentalPeriod) : '',
                        accessNotes: s.AccessNotes || '',
                        listingStatus: (s.Status || 'active').toLowerCase(),
                    });
                } else {
                    setError(t.spaceNotFound);
                }
            })
            .catch(() => setError(t.failedToLoadSpace))
            .finally(() => setSpaceLoading(false));
    }, [id, t]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'file') {
            setSelectedPhotos((e.target as HTMLInputElement).files);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const goToStep = (step: number) => {
        setCurrentStep(step);
        window.scrollTo(0, 0);
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (
                !formData.listingTitle ||
                !formData.listingNeighborhood ||
                !formData.listingAddress ||
                !formData.latitude ||
                !formData.longitude ||
                !formData.listingType ||
                !formData.listingLength ||
                !formData.listingWidth ||
                !formData.listingHeight ||
                !formData.listingDescription
            ) {
                alert(t.fillRequiredFieldsStep1);
                return;
            }
        }

        if (currentStep === 3) {
            if (!formData.pricePerMonth) {
                alert(t.provideMonthlyPrice);
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
    async function handleSubmit(e: React.FormEvent) {
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
            temperature: (formData.featTemperature || formData.featClimate || formData.featHumidity) && formData.temperatureValue
                ? parseFloat(formData.temperatureValue)
                : undefined,
            humidity: (formData.featTemperature || formData.featClimate || formData.featHumidity) && formData.humidityValue
                ? parseFloat(formData.humidityValue)
                : undefined,

            accessType: formData.accessType,
            availableFrom: formData.availableFrom,
            availableTo: formData.availableTo,
            accessNotes: formData.accessNotes,

            pricePerMonth: parseFloat(formData.pricePerMonth),
            pricePerWeek: formData.pricePerWeek ? parseFloat(formData.pricePerWeek) : undefined,
            pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : undefined,
            maxRentalPeriod: formData.maxRentalPeriod ? parseInt(formData.maxRentalPeriod) : undefined,

            status: formData.listingStatus,
        };

        try {
            const res = await fetch(`/api/spaces/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const response = await res.json();

            if (!res.ok) {
                setError(response.error || t.failedToUpdateSpace);
                return;
            }
            // Upload new photos if any were selected
            if (selectedPhotos && selectedPhotos.length > 0) {
                const photoForm = new FormData();
                for (let i = 0; i < selectedPhotos.length; i++) {
                    photoForm.append(`image${i}`, selectedPhotos[i]);
                }
                const imgRes = await fetch(`/api/spaces/${id}/images`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: photoForm,
                });
                if (!imgRes.ok) {
                    setSuccess(t.spaceUpdatedPhotoUploadFailed);
                    return;
                }
                setSelectedPhotos(null);
            }

            setSuccess(t.spaceUpdatedPhotosSaved);
        } catch {
            setError(t.networkErrorTryAgain);
        } finally {
            setLoading(false);
        }
    }

    if (!user || spaceLoading) return <Loader />;
    if (error && spaceLoading === false && !formData.listingTitle) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <>
            <style>{`
                .premium-file-input::file-selector-button {
                    border-radius: 20px;
                    padding: 8px 18px;
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #718096;
                    border: 1px solid #cbd5e0;
                    margin-right: 15px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'Baloo Bhaijaan 2', sans-serif;
                    transition: all 0.3s ease;
                }
                .premium-file-input::file-selector-button:hover {
                    background-color: #f7fafc;
                    border-color: #ff6b35;
                    color: #ff6b35;
                }
                .premium-file-input:hover {
                    border-color: #ff6b35 !important;
                }
            `}</style>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                        <nav className="nav">
                            <a href="/dashboard">{t.dashboard}</a>
                            <a href="/#about">{t.about}</a>
                            <a href="/#features">{t.features}</a>
                            <a href="/#how-it-works">{t.howItWorks}</a>
                        </nav>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                            <LanguageToggle />
                        </div>
                    </div>
                </div>
            </header>

            <section className="listing-section">
                <div className="container">
                    {success ? (
                        <div className="listing-confirmation" style={{ display: 'block', textAlign: 'center', padding: '40px' }}>
                            <h3 style={{ fontSize: '28px', color: '#1a365d', marginBottom: '16px' }}>{t.spaceUpdatedSuccessfully} ✅</h3>
                            <p style={{ fontSize: '18px', color: '#718096', marginBottom: '32px' }}>{t.changesSavedMessage}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                <a
                                    href="/dashboard"
                                    className="btn btn-dark"
                                    style={{ display: 'inline-block' }}
                                >
                                    {t.goToDashboard}
                                </a>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setSuccess('')}
                                    style={{ display: 'inline-block' }}
                                >
                                    {t.continueEditing}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="listing-header">
                                <h1 className="listing-title">{t.editStorageSpaceTitle}</h1>
                                <p className="listing-subtitle">
                                    {t.editStorageSpaceSubtitle}
                                </p>
                            </div>

                            {error && (
                                <div
                                    style={{
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem'
                                    }}
                                >
                                    ✗ {error}
                                </div>
                            )}

                            <div className="listing-layout">
                                <div className="steps-card">
                                    <div className="steps-row">
                                        <div
                                            className={`step-pill ${currentStep === 1 ? 'is-active' : ''}`}
                                            onClick={() => goToStep(1)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="step-number">1</span>
                                            <span className="step-label">{t.stepBasicDetails}</span>
                                        </div>

                                        <div
                                            className={`step-pill ${currentStep === 2 ? 'is-active' : ''}`}
                                            onClick={() => goToStep(2)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="step-number">2</span>
                                            <span className="step-label">{t.stepEnvironmentMedia}</span>
                                        </div>

                                        <div
                                            className={`step-pill ${currentStep === 3 ? 'is-active' : ''}`}
                                            onClick={() => goToStep(3)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="step-number">3</span>
                                            <span className="step-label">{t.stepAccessPricing}</span>
                                        </div>

                                        <div
                                            className={`step-pill ${currentStep === 4 ? 'is-active' : ''}`}
                                            onClick={() => goToStep(4)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="step-number">4</span>
                                            <span className="step-label">{t.stepReviewSave}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="listing-card">
                                    <form id="editListingForm" className="listing-form" onSubmit={handleSubmit}>

                                        {/* STEP 1 */}
                                        {currentStep === 1 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">{t.basicSpaceDetails}</h2>
                                                <p className="step-description">{t.updateTypeLocationDimensions}</p>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">{t.listingTitle} *</label>
                                                        <input
                                                            name="listingTitle"
                                                            type="text"
                                                            className="form-input"
                                                            placeholder={t.listingTitlePlaceholder}
                                                            value={formData.listingTitle}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">{t.neighborhoodJeddah} *</label>
                                                        <input
                                                            list="neighborhoods"
                                                            name="listingNeighborhood"
                                                            className="form-input"
                                                            placeholder={t.neighborhoodPlaceholder}
                                                            value={formData.listingNeighborhood}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
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
                                                    <label className="form-label">{t.fullAddress} *</label>
                                                    <input
                                                        name="listingAddress"
                                                        type="text"
                                                        className="form-input"
                                                        placeholder={t.fullAddressPlaceholder}
                                                        value={formData.listingAddress}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">{t.buildingNumber}</label>
                                                        <input name="buildingNumber" type="text" className="form-input" placeholder={t.optional} value={formData.buildingNumber} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.floorNumber}</label>
                                                        <input name="floorNumber" type="number" className="form-input" placeholder={t.optional} value={formData.floorNumber} onChange={handleInputChange} />
                                                    </div>
                                                </div>

                                                <LocationMap
                                                    lat={parseFloat(formData.latitude) || 21.5433}
                                                    lng={parseFloat(formData.longitude) || 39.1728}
                                                    onChange={(lat, lng) =>
                                                        setFormData(f => ({
                                                            ...f,
                                                            latitude: String(lat),
                                                            longitude: String(lng)
                                                        }))
                                                    }
                                                />

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">{t.latitude} *</label>
                                                        <input
                                                            name="latitude"
                                                            type="number"
                                                            step="0.000001"
                                                            className="form-input"
                                                            placeholder={t.latitudePlaceholder}
                                                            value={formData.latitude}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">{t.longitude} *</label>
                                                        <input
                                                            name="longitude"
                                                            type="number"
                                                            step="0.000001"
                                                            className="form-input"
                                                            placeholder={t.longitudePlaceholder}
                                                            value={formData.longitude}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">{t.spaceType} *</label>
                                                        <input
                                                            list="spaceTypes"
                                                            name="listingType"
                                                            className="form-input"
                                                            placeholder={t.spaceTypePlaceholder}
                                                            value={formData.listingType}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                        <datalist id="spaceTypes">
                                                            <option value="room" />
                                                            <option value="garage" />
                                                            <option value="warehouse" />
                                                            <option value="outdoor" />
                                                            <option value="Basement" />
                                                        </datalist>
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">{t.approximateSize}</label>
                                                        <input
                                                            name="listingSize"
                                                            type="number"
                                                            min="1"
                                                            className="form-input"
                                                            placeholder={t.approximateSizePlaceholder}
                                                            value={formData.listingSize}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="step-row four-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">{t.lengthM} *</label>
                                                        <input name="listingLength" type="number" min="1" className="form-input" placeholder={t.lengthPlaceholder} value={formData.listingLength} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.widthM} *</label>
                                                        <input name="listingWidth" type="number" min="1" className="form-input" placeholder={t.widthPlaceholder} value={formData.listingWidth} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.heightM} *</label>
                                                        <input name="listingHeight" type="number" min="1" className="form-input" placeholder={t.heightPlaceholder} value={formData.listingHeight} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.areaM2} *</label>
                                                        <input type="text" className="form-input" value={calculatedArea > 0 ? calculatedArea : ''} placeholder={t.autoCalculated} disabled required />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">{t.description} *</label>
                                                    <textarea name="listingDescription" className="form-input" rows={3} placeholder={t.descriptionPlaceholder} value={formData.listingDescription} onChange={handleInputChange} required></textarea>
                                                </div>

                                                <div className="step-actions">
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>{t.nextEnvironmentMedia}</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2 */}
                                        {currentStep === 2 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">{t.environmentMediaTitle}</h2>
                                                <p className="step-description">{t.environmentMediaDescription}</p>

                                                <div className="form-group">
                                                    <span className="form-label">{t.environmentalConditions}</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featTemperature" checked={formData.featTemperature} onChange={handleInputChange} />
                                                            <span>{t.temperatureControlled}</span>
                                                        </label>

                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featClimate" checked={formData.featClimate} onChange={handleInputChange} />
                                                            <span>{t.climateControlled}</span>
                                                        </label>

                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featHumidity" checked={formData.featHumidity} onChange={handleInputChange} />
                                                            <span>{t.humidityControlled}</span>
                                                        </label>

                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featDry" checked={formData.featDry} onChange={handleInputChange} />
                                                            <span>{t.dryStorage}</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <span className="form-label">{t.securityConvenience}</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featSecureAccess" checked={formData.featSecureAccess} onChange={handleInputChange} />
                                                            <span>{t.secureAccess}</span>
                                                        </label>

                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featCCTV" checked={formData.featCCTV} onChange={handleInputChange} />
                                                            <span>{t.cctv}</span>
                                                        </label>

                                                        <label className="chip-option">
                                                            <input type="checkbox" name="featLighting" checked={formData.featLighting} onChange={handleInputChange} />
                                                            <span>{t.goodLighting}</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {(formData.featTemperature || formData.featClimate || formData.featHumidity) && (
                                                    <div className="step-row">
                                                        <div className="form-group">
                                                            <label className="form-label">{t.temperatureOptional}</label>
                                                            <input name="temperatureValue" type="number" step="0.1" className="form-input" placeholder={t.optional} value={formData.temperatureValue} onChange={handleInputChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">{t.humidityOptional}</label>
                                                            <input name="humidityValue" type="number" step="0.1" className="form-input" placeholder={t.optional} value={formData.humidityValue} onChange={handleInputChange} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="form-group">
                                                    <label className="form-label">{t.prohibitedItems}</label>
                                                    <textarea
                                                        name="prohibitedItems"
                                                        className="form-input"
                                                        rows={2}
                                                        placeholder={t.prohibitedItemsPlaceholder}
                                                        value={formData.prohibitedItems}
                                                        onChange={handleInputChange}
                                                    ></textarea>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">{t.uploadNewPhotos}</label>
                                                    <input
                                                        name="listingPhotos"
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="form-input premium-file-input"
                                                        onChange={handleInputChange}
                                                        lang={lang}
                                                    />

                                                    {selectedPhotos && selectedPhotos.length > 0 ? (
                                                        <p className="step-note" style={{ color: '#38a169', fontWeight: 600 }}>
                                                            ✓ {selectedPhotos.length} {selectedPhotos.length > 1 ? t.photosReadyPlural : t.photoReadySingular}
                                                        </p>
                                                    ) : (
                                                        <p className="step-note">
                                                            {t.keepExistingPhotosNote}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">{t.optionalVideoTour}</label>
                                                    <input name="listingVideo" type="file" accept="video/*" className="form-input premium-file-input" />
                                                    <p className="step-note">{t.optionalVideoTourNote}</p>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep}>{t.back}</button>
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>{t.nextAccessPricing}</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3 */}
                                        {currentStep === 3 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">{t.accessPricingTitle}</h2>
                                                <p className="step-description">{t.accessPricingDescription}</p>

                                                <div className="form-group">
                                                    <span className="form-label">{t.accessMethod} *</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="radio" name="accessType" value="24-7" checked={formData.accessType === '24-7'} onChange={handleInputChange} required />
                                                            <span>{t.access247}</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="radio" name="accessType" value="business-hours" checked={formData.accessType === 'business-hours'} onChange={handleInputChange} />
                                                            <span>{t.businessHours}</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="radio" name="accessType" value="by-appointment" checked={formData.accessType === 'by-appointment'} onChange={handleInputChange} />
                                                            <span>{t.byAppointment}</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {formData.accessType !== '24-7' && (
                                                    <div className="step-row availability-row">
                                                        <div className="form-group">
                                                            <label className="form-label">{t.availableFrom}</label>
                                                            <input name="availableFrom" type="time" className="form-input" value={formData.availableFrom} onChange={handleInputChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">{t.availableUntil}</label>
                                                            <input name="availableTo" type="time" className="form-input" value={formData.availableTo} onChange={handleInputChange} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="step-row three-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">{t.pricePerDay}</label>
                                                        <input name="pricePerDay" type="number" min="0" className="form-input" placeholder={t.optional} value={formData.pricePerDay} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.pricePerWeek}</label>
                                                        <input name="pricePerWeek" type="number" min="0" className="form-input" placeholder={t.optional} value={formData.pricePerWeek} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.pricePerMonth} *</label>
                                                        <input name="pricePerMonth" type="number" min="1" className="form-input" placeholder={t.required} value={formData.pricePerMonth} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t.maxRentalPeriod}</label>
                                                        <input name="maxRentalPeriod" type="number" min="1" className="form-input" placeholder={t.optional} value={formData.maxRentalPeriod} onChange={handleInputChange} />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">{t.accessNotes}</label>
                                                    <textarea name="accessNotes" className="form-input" rows={2} placeholder={t.accessNotesPlaceholder} value={formData.accessNotes} onChange={handleInputChange}></textarea>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep}>{t.back}</button>
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>{t.nextReviewSave}</button>
                                                </div>
                                            </div>
                                        )}
                                        {/* STEP 4 */}
                                        {currentStep === 4 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">{t.reviewSaveTitle}</h2>
                                                <p className="step-description">{t.reviewSaveDescription}</p>

                                                <div className="summary-box">
                                                    <h3>{formData.listingTitle || t.untitledListing}</h3>

                                                    <p>
                                                        <strong>{t.locationLabel}</strong>
                                                        {formData.listingAddress}, {formData.listingNeighborhood}
                                                    </p>

                                                    <p>
                                                        <strong>{t.typeLabel}</strong>
                                                        {formData.listingType} ({calculatedArea} m²)
                                                    </p>

                                                    <p>
                                                        <strong>{t.priceLabel}</strong>
                                                        {formData.pricePerMonth} {t.sarPerMonth}
                                                    </p>

                                                    <p>
                                                        <strong>{t.accessLabel}</strong>
                                                        {formData.accessType}
                                                    </p>

                                                    <br />

                                                    <p className="step-note">
                                                        {t.clickSaveChangesNote}
                                                    </p>
                                                </div>

                                                <div className="form-group">
                                                    <span className="form-label">{t.listingStatus} *</span>

                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input
                                                                type="radio"
                                                                name="listingStatus"
                                                                value="active"
                                                                checked={formData.listingStatus === 'active'}
                                                                onChange={handleInputChange}
                                                                required
                                                            />
                                                            <span>{t.activeVisible}</span>
                                                        </label>

                                                        <label className="chip-option">
                                                            <input
                                                                type="radio"
                                                                name="listingStatus"
                                                                value="inactive"
                                                                checked={formData.listingStatus === 'inactive'}
                                                                onChange={handleInputChange}
                                                            />
                                                            <span>{t.inactiveNotVisible}</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline prev-btn"
                                                        onClick={prevStep}
                                                        disabled={loading}
                                                    >
                                                        {t.back}
                                                    </button>

                                                    <button
                                                        type="submit"
                                                        className="btn btn-dark"
                                                        disabled={loading}
                                                    >
                                                        {loading ? t.saving : t.saveChanges}
                                                    </button>
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
        </>
    );
}
