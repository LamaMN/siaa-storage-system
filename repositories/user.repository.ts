import { query, queryOne, execute } from '@/lib/db';
import type {
    StorageSeeker,
    StorageProvider,
    CreateSeekerInput,
    CreateProviderInput,
    UpdateSeekerInput,
    UpdateProviderInput,
} from '@/models/user';
import { hashPassword } from '@/lib/auth';

// ============================================================
// SEEKER REPOSITORY
// ============================================================

export async function findSeekerByEmail(email: string): Promise<StorageSeeker | null> {
    return queryOne<StorageSeeker>(
        `SELECT * FROM StorageSeekers WHERE Email = @email`,
        { email }
    );
}

export async function findSeekerById(id: number): Promise<StorageSeeker | null> {
    return queryOne<StorageSeeker>(
        `SELECT * FROM StorageSeekers WHERE SeekerID = @id`,
        { id }
    );
}

export async function createSeeker(input: CreateSeekerInput): Promise<number> {
    const hashedPassword = await hashPassword(input.password);

    const result = await execute(
        `INSERT INTO StorageSeekers (
      Email, Password, FirstName, LastName, PhoneNumber,
      DateOfBirth, Gender, NationalID,
      PreferredLanguage, ProfilePicture, ContentType
    )
    OUTPUT INSERTED.SeekerID
    VALUES (
      @email, @password, @firstName, @lastName, @phoneNumber,
      @dateOfBirth, @gender, @nationalId,
      @preferredLanguage, 0x, NULL
    )`,
        {
            email: input.email,
            password: hashedPassword,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender || null,
            nationalId: input.nationalId || null,
            preferredLanguage: input.preferredLanguage || 'ar',
        }
    );

    const rows = result.recordset as Array<{ SeekerID: number }>;
    return rows[0].SeekerID;
}

export async function updateSeeker(id: number, input: UpdateSeekerInput): Promise<void> {
    await execute(
        `UPDATE StorageSeekers SET
      FirstName = ISNULL(@firstName, FirstName),
      LastName = ISNULL(@lastName, LastName),
      PhoneNumber = ISNULL(@phoneNumber, PhoneNumber),
      PreferredLanguage = ISNULL(@preferredLanguage, PreferredLanguage),
      PreferredLocations = ISNULL(@preferredLocations, PreferredLocations),
      UpdatedAt = GETDATE()
    WHERE SeekerID = @id`,
        {
            id,
            firstName: input.firstName || null,
            lastName: input.lastName || null,
            phoneNumber: input.phoneNumber || null,
            preferredLanguage: input.preferredLanguage || null,
            preferredLocations: input.preferredLocations || null,
        }
    );
}

export async function updateSeekerProfilePicture(
    id: number,
    buffer: Buffer,
    contentType: string
): Promise<void> {
    await execute(
        `UPDATE StorageSeekers SET ProfilePicture = @picture, ContentType = @contentType, UpdatedAt = GETDATE()
     WHERE SeekerID = @id`,
        { id, picture: buffer, contentType }
    );
}

export async function updateSeekerLastLogin(id: number): Promise<void> {
    await execute(
        `UPDATE StorageSeekers SET UpdatedAt = GETDATE() WHERE SeekerID = @id`,
        { id }
    );
}

// ============================================================
// PROVIDER REPOSITORY
// ============================================================

export async function findProviderByEmail(email: string): Promise<StorageProvider | null> {
    return queryOne<StorageProvider>(
        `SELECT * FROM StorageProviders WHERE Email = @email`,
        { email }
    );
}

export async function findProviderById(id: number): Promise<StorageProvider | null> {
    return queryOne<StorageProvider>(
        `SELECT * FROM StorageProviders WHERE ProviderID = @id`,
        { id }
    );
}

export async function createProvider(input: CreateProviderInput): Promise<number> {
    const hashedPassword = await hashPassword(input.password);

    const result = await execute(
        `INSERT INTO StorageProviders (
      Email, Password, FirstName, LastName, PhoneNumber,
      DateOfBirth, Gender, NationalID, BusinessName,
      PreferredLanguage, ProfilePicture, ContentType
    )
    OUTPUT INSERTED.ProviderID
    VALUES (
      @email, @password, @firstName, @lastName, @phoneNumber,
      @dateOfBirth, @gender, @nationalId, @businessName,
      @preferredLanguage, 0x, NULL
    )`,
        {
            email: input.email,
            password: hashedPassword,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender || null,
            nationalId: input.nationalId || null,
            businessName: input.businessName || null,
            preferredLanguage: input.preferredLanguage || 'ar',
        }
    );

    const rows = result.recordset as Array<{ ProviderID: number }>;
    return rows[0].ProviderID;
}

export async function updateProvider(id: number, input: UpdateProviderInput): Promise<void> {
    await execute(
        `UPDATE StorageProviders SET
      FirstName = ISNULL(@firstName, FirstName),
      LastName = ISNULL(@lastName, LastName),
      PhoneNumber = ISNULL(@phoneNumber, PhoneNumber),
      BusinessName = ISNULL(@businessName, BusinessName),
      BankAccountNumber = ISNULL(@bankAccountNumber, BankAccountNumber),
      BankName = ISNULL(@bankName, BankName),
      IBAN = ISNULL(@iban, IBAN),
      UpdatedAt = GETDATE()
    WHERE ProviderID = @id`,
        {
            id,
            firstName: input.firstName || null,
            lastName: input.lastName || null,
            phoneNumber: input.phoneNumber || null,
            businessName: input.businessName || null,
            bankAccountNumber: input.bankAccountNumber || null,
            bankName: input.bankName || null,
            iban: input.iban || null,
        }
    );
}

export async function updateProviderProfilePicture(
    id: number,
    buffer: Buffer,
    contentType: string
): Promise<void> {
    await execute(
        `UPDATE StorageProviders SET ProfilePicture = @picture, ContentType = @contentType, UpdatedAt = GETDATE()
     WHERE ProviderID = @id`,
        { id, picture: buffer, contentType }
    );
}

export async function updateProviderLastLogin(id: number): Promise<void> {
    await execute(
        `UPDATE StorageProviders SET LastLoginDate = GETDATE(), UpdatedAt = GETDATE() WHERE ProviderID = @id`,
        { id }
    );
}

// ============================================================
// Profile Picture retrieval
// ============================================================

export async function getSeekerProfilePicture(
    id: number
): Promise<{ data: Buffer; contentType: string } | null> {
    const row = await queryOne<{ ProfilePicture: Buffer; ContentType: string }>(
        `SELECT ProfilePicture, ContentType FROM StorageSeekers WHERE SeekerID = @id`,
        { id }
    );
    if (!row || !row.ProfilePicture || row.ProfilePicture.length === 0) return null;
    return { data: row.ProfilePicture, contentType: row.ContentType || 'image/jpeg' };
}

export async function getProviderProfilePicture(
    id: number
): Promise<{ data: Buffer; contentType: string } | null> {
    const row = await queryOne<{ ProfilePicture: Buffer; ContentType: string }>(
        `SELECT ProfilePicture, ContentType FROM StorageProviders WHERE ProviderID = @id`,
        { id }
    );
    if (!row || !row.ProfilePicture || row.ProfilePicture.length === 0) return null;
    return { data: row.ProfilePicture, contentType: row.ContentType || 'image/jpeg' };
}
