// ============================================================
// Shared / Common types
// ============================================================

export type AccountStatus = 'Active' | 'Suspended' | 'Deactivated';
export type Gender = 'Male' | 'Female' | 'Other';
export type Language = 'ar' | 'en';

// ============================================================
// Storage Seeker
// ============================================================

export interface StorageSeeker {
    SeekerID: number;
    Email: string;
    Password: string;
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
    DateOfBirth: Date;
    Gender?: Gender;
    NationalID?: string;
    IsVerified: boolean;
    VerificationDate?: Date;
    AccountStatus: AccountStatus;
    RegistrationDate: Date;
    PreferredLanguage: Language;
    PreferredLocations?: string;
    NotificationPreferences?: string;
    ContentType?: string;
    CreatedAt: Date;
    UpdatedAt: Date;
}

export interface CreateSeekerInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender?: Gender;
    nationalId?: string;
    preferredLanguage?: Language;
}

export interface UpdateSeekerInput {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    preferredLanguage?: Language;
    preferredLocations?: string;
}

// ============================================================
// Storage Provider
// ============================================================

export interface StorageProvider {
    ProviderID: number;
    Email: string;
    Password: string;
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
    DateOfBirth: Date;
    Gender?: Gender;
    NationalID?: string;
    IsVerified: boolean;
    VerificationDate?: Date;
    AccountStatus: AccountStatus;
    RegistrationDate: Date;
    LastLoginDate?: Date;
    PreferredLanguage: Language;
    BusinessName?: string;
    BankAccountNumber?: string;
    BankName?: string;
    IBAN?: string;
    CommissionRate: number;
    PreferredCommunicationMethod?: 'Email' | 'Phone' | 'SMS' | 'InApp';
    ContentType?: string;
    CreatedAt: Date;
    UpdatedAt: Date;
}

export interface CreateProviderInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender?: Gender;
    nationalId?: string;
    businessName?: string;
    preferredLanguage?: Language;
}

export interface UpdateProviderInput {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    businessName?: string;
    bankAccountNumber?: string;
    bankName?: string;
    iban?: string;
    preferredCommunicationMethod?: 'Email' | 'Phone' | 'SMS' | 'InApp';
}

// ============================================================
// Shared public profile (returned by API without password)
// ============================================================

export type PublicSeeker = Omit<StorageSeeker, 'Password'>;
export type PublicProvider = Omit<StorageProvider, 'Password' | 'BankAccountNumber' | 'IBAN'>;
