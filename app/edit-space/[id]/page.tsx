'use client';
import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('../../list-space/LocationMap'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>Loading map...</div>
});

interface User {
    id: number;
    userType: string;
    firstName: string;
}

export default function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
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

        // Step 2
        featTemperature: false,
        featClimate: false,
        featHumidity: false,
        featDry: false,
        featSecureAccess: false,
        featCCTV: false,
        featLighting: false,
        prohibitedItems: '',

        // Step 3
        accessType: '24-7',
        availableFrom: '',
        availableTo: '',
        pricePerDay: '',
        pricePerWeek: '',
        pricePerMonth: '',
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
            alert('Only providers can edit spaces');
            window.location.href = '/dashboard';
            return;
        }
        setUser(u);
        setToken(storedToken);

        // Fetch existing space and pre-fill form
        fetch(`/api/spaces/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.space) {
                    const s = data.space;

                    // Reverse-map access type value
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

                        featTemperature: !!s.ClimateControlled,
                        featClimate: !!s.ClimateControlled,
                        featHumidity: false,
                        featDry: false,
                        featSecureAccess: !!s.SecuritySystem,
                        featCCTV: !!s.CctvMonitored,
                        featLighting: false,
                        prohibitedItems: s.Restrictions || '',

                        accessType,
                        availableFrom: s.AvailableFrom || '',
                        availableTo: s.AvailableTo || '',
                        pricePerDay: s.PricePerDay != null ? String(s.PricePerDay) : '',
                        pricePerWeek: s.PricePerWeek != null ? String(s.PricePerWeek) : '',
                        pricePerMonth: s.PricePerMonth != null ? String(s.PricePerMonth) : '',
                        accessNotes: s.AccessNotes || '',

                        listingStatus: (s.Status || 'active').toLowerCase(),
                    });
                } else {
                    setError('Space not found');
                }
            })
            .catch(() => setError('Failed to load space'))
            .finally(() => setSpaceLoading(false));
    }, [id]);

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
            if (!formData.listingTitle || !formData.listingNeighborhood || !formData.listingAddress || !formData.latitude || !formData.longitude || !formData.listingType || !formData.listingLength || !formData.listingWidth || !formData.listingHeight || !formData.listingDescription) {
                alert('Please fill out all required fields in Step 1.');
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

            climateControlled: formData.featClimate || formData.featTemperature,
            cctvMonitored: formData.featCCTV,
            securitySystem: formData.featSecureAccess,
            parkingAvailable: false,
            loadingAssistance: false,
            restrictions: formData.prohibitedItems,

            accessType: formData.accessType,
            availableFrom: formData.availableFrom,
            availableTo: formData.availableTo,
            accessNotes: formData.accessNotes,

            pricePerMonth: parseFloat(formData.pricePerMonth),
            pricePerWeek: formData.pricePerWeek ? parseFloat(formData.pricePerWeek) : undefined,
            pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : undefined,

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
                setError(response.error || 'Failed to update space');
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
                    setSuccess('Space updated, but photo upload failed. Try again from this page.');
                    return;
                }
                setSelectedPhotos(null);
            }

            setSuccess('Your space has been updated successfully! Photos saved.');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!user || spaceLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (error && spaceLoading === false && !formData.listingTitle) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

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

            <section className="listing-section">
                <div className="container">
                    {success ? (
                        <div className="listing-confirmation" style={{ display: 'block' }}>
                            <h3>Space updated successfully! ✅</h3>
                            <p>Your changes have been saved. You can continue editing or return to your dashboard.</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                <a href="/dashboard" className="btn btn-dark" style={{ display: 'inline-block' }}>Go to Dashboard</a>
                                <button className="btn btn-outline" onClick={() => setSuccess('')} style={{ display: 'inline-block' }}>Continue Editing</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="listing-header">
                                <h1 className="listing-title">Edit Your Storage Space</h1>
                                <p className="listing-subtitle">
                                    Update your space details below. Navigate between steps to make changes and save when you're done.
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
                                        <div className={`step-pill ${currentStep === 1 ? 'is-active' : ''}`} onClick={() => goToStep(1)} style={{ cursor: 'pointer' }}>
                                            <span className="step-number">1</span>
                                            <span className="step-label">Basic Details</span>
                                        </div>
                                        <div className={`step-pill ${currentStep === 2 ? 'is-active' : ''}`} onClick={() => goToStep(2)} style={{ cursor: 'pointer' }}>
                                            <span className="step-number">2</span>
                                            <span className="step-label">Environment &amp; Media</span>
                                        </div>
                                        <div className={`step-pill ${currentStep === 3 ? 'is-active' : ''}`} onClick={() => goToStep(3)} style={{ cursor: 'pointer' }}>
                                            <span className="step-number">3</span>
                                            <span className="step-label">Access &amp; Pricing</span>
                                        </div>
                                        <div className={`step-pill ${currentStep === 4 ? 'is-active' : ''}`} onClick={() => goToStep(4)} style={{ cursor: 'pointer' }}>
                                            <span className="step-number">4</span>
                                            <span className="step-label">Review &amp; Save</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="listing-card">
                                    <form id="editListingForm" className="listing-form" onSubmit={handleSubmit}>

                                        {/* STEP 1 */}
                                        {currentStep === 1 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Basic space details</h2>
                                                <p className="step-description">Update the type, location, and dimensions of your space.</p>

                                                <div className="step-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Listing title *</label>
                                                        <input name="listingTitle" type="text" className="form-input" placeholder="e.g., Indoor storage room in Al-Salama" value={formData.listingTitle} onChange={handleInputChange} required />
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">Neighborhood (Jeddah) *</label>
                                                        <select name="listingNeighborhood" className="form-input" value={formData.listingNeighborhood} onChange={handleInputChange} required>
                                                            <option value="">Select neighborhood</option>
                                                            <option value="al-salama">Al-Salama</option>
                                                            <option value="al-rawdah">Al-Rawdah</option>
                                                            <option value="al-nahda">Al-Nahda</option>
                                                            <option value="al-andalus">Al-Andalus</option>
                                                            <option value="al-hamra">Al-Hamra</option>
                                                            <option value="al-rehab">Al-Rehab</option>
                                                            <option value="al-faisaliyah">Al-Faisaliyah</option>
                                                            <option value="al-naeem">Al-Naeem</option>
                                                            <option value="al-basateen">Al-Basateen</option>
                                                            <option value="al-shati">Al-Shati (Corniche)</option>
                                                            <option value="al-safa">Al-Safa</option>
                                                            <option value="al-aziziyah">Al-Aziziyah</option>
                                                            <option value="al-baghdadiyah">Al-Baghdadiyah</option>
                                                            <option value="al-balad">Al-Balad</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Full address *</label>
                                                    <input name="listingAddress" type="text" className="form-input" placeholder="Building, street, nearby landmark…" value={formData.listingAddress} onChange={handleInputChange} required />
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
                                                        <select name="listingType" className="form-input" value={formData.listingType} onChange={handleInputChange} required>
                                                            <option value="">Choose type</option>
                                                            <option value="room">Indoor room</option>
                                                            <option value="garage">Garage / parking</option>
                                                            <option value="warehouse">Warehouse corner</option>
                                                            <option value="outdoor">Outdoor covered area</option>
                                                            <option value="Basement">Basement</option>
                                                        </select>
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
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>Next: Environment &amp; Media</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2 */}
                                        {currentStep === 2 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Environment &amp; media</h2>
                                                <p className="step-description">Update environmental conditions and security features.</p>

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
                                                    <span className="form-label">Security &amp; convenience</span>
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

                                                <div className="form-group">
                                                    <label className="form-label">Prohibited items (optional)</label>
                                                    <textarea name="prohibitedItems" className="form-input" rows={2} placeholder="e.g., No flammable materials, no chemicals…" value={formData.prohibitedItems} onChange={handleInputChange}></textarea>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Upload new photos (optional)</label>
                                                    <input name="listingPhotos" type="file" accept="image/*" multiple className="form-input" onChange={handleInputChange} />
                                                    {selectedPhotos && selectedPhotos.length > 0 ? (
                                                        <p className="step-note" style={{ color: '#38a169', fontWeight: 600 }}>
                                                            ✓ {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} ready to upload — click &quot;Save Changes&quot; to save them.
                                                        </p>
                                                    ) : (
                                                        <p className="step-note">Leave empty to keep existing photos. Upload new ones to add to this space.</p>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Optional video tour</label>
                                                    <input name="listingVideo" type="file" accept="video/*" className="form-input" />
                                                    <p className="step-note">Short video showing how to access and use the space (optional).</p>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep}>Back</button>
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>Next: Access &amp; Pricing</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3 */}
                                        {currentStep === 3 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Access &amp; pricing</h2>
                                                <p className="step-description">Update how renters access the space and adjust your price.</p>

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
                                                    <label className="form-label">Entry requirements / access notes</label>
                                                    <textarea name="accessNotes" className="form-input" rows={2} placeholder="e.g., Access via security gate, ID required with guard, parking instructions…" value={formData.accessNotes} onChange={handleInputChange}></textarea>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep}>Back</button>
                                                    <button type="button" className="btn btn-dark next-btn" onClick={nextStep}>Next: Review &amp; Save</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 4 */}
                                        {currentStep === 4 && (
                                            <div className="step-panel is-active">
                                                <h2 className="step-title">Review &amp; save</h2>
                                                <p className="step-description">Check your updated information before saving.</p>

                                                <div className="summary-box">
                                                    <h3>{formData.listingTitle || 'Untitled Listing'}</h3>
                                                    <p><strong>Location:</strong> {formData.listingAddress}, {formData.listingNeighborhood}</p>
                                                    <p><strong>Type:</strong> {formData.listingType} ({calculatedArea} m²)</p>
                                                    <p><strong>Price:</strong> {formData.pricePerMonth} SAR/month</p>
                                                    <p><strong>Access:</strong> {formData.accessType}</p>
                                                    <br />
                                                    <p className="step-note">Click "Save Changes" to apply your updates.</p>
                                                </div>

                                                <div className="form-group">
                                                    <span className="form-label">Listing status *</span>
                                                    <div className="chip-row">
                                                        <label className="chip-option">
                                                            <input type="radio" name="listingStatus" value="active" checked={formData.listingStatus === 'active'} onChange={handleInputChange} required />
                                                            <span>Active (visible to renters)</span>
                                                        </label>
                                                        <label className="chip-option">
                                                            <input type="radio" name="listingStatus" value="inactive" checked={formData.listingStatus === 'inactive'} onChange={handleInputChange} />
                                                            <span>Inactive (not visible)</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="step-actions step-actions--split">
                                                    <button type="button" className="btn btn-outline prev-btn" onClick={prevStep} disabled={loading}>Back</button>
                                                    <button type="submit" className="btn btn-dark" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
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
