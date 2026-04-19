import { z } from 'zod';
import {
    searchSpaces, getRecommendedSpaces, findSpaceById,
    createSpace as createSpaceRepo, deleteSpace,
    addSpaceImage, getSpaceImage, getSpaceImagesMeta,
    getAvailableNeighborhoods as getAvailableNeighborhoodsRepo,
} from '@/repositories/space.repository';
import type { SpaceSearchFilters, CreateSpaceInput } from '@/models/space';

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const createSpaceSchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().max(5000).optional(),
    spaceType: z.string().max(50).optional(),
    size: z.number().positive(),
    height: z.number().positive().optional(),
    width: z.number().positive().optional(),
    length: z.number().positive().optional(),
    pricePerMonth: z.number().positive(),
    pricePerWeek: z.number().positive().optional(),
    pricePerDay: z.number().positive().optional(),
    minRentalPeriod: z.number().int().positive().optional().default(1),
    maxRentalPeriod: z.number().int().positive().optional(),
    floorNumber: z.number().int().optional(),
    // Features
    climateControlled: z.boolean().optional().default(false),
    securitySystem: z.boolean().optional().default(false),
    cctvMonitored: z.boolean().optional().default(false),
    accessType: z.string().optional(),
    parkingAvailable: z.boolean().optional().default(false),
    loadingAssistance: z.boolean().optional().default(false),
    restrictions: z.string().max(500).optional(),
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    // Location
    addressLine1: z.string().min(5).max(255),
    addressLine2: z.string().max(255).optional(),
    buildingNumber: z.string().max(50).optional(),
    city: z.string().min(2).max(100),
    region: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).optional().default('Saudi Arabia'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    landmark: z.string().max(255).optional(),
    status: z.string().optional(),
});

// ============================================================
// SERVICE METHODS
// ============================================================

export async function getSpaceDetail(id: number) {
    const space = await findSpaceById(id);
    if (!space) throw new Error('Space not found');
    return space;
}

export async function searchAndRecommendSpaces(filters: SpaceSearchFilters) {
    const results = await searchSpaces(filters);
    return results;
}

export async function getAvailableNeighborhoods() {
    return getAvailableNeighborhoodsRepo();
}

export async function getRecommended(city: string, limit = 6) {
    if (!city) return [];
    return getRecommendedSpaces(city, limit);
}

export async function createNewSpace(providerId: number, data: z.infer<typeof createSpaceSchema>) {
    const input = {
        ...data,
        minRentalPeriod: data.minRentalPeriod ?? 1,
        country: data.country ?? 'Saudi Arabia',
    };
    return createSpaceRepo(providerId, input as CreateSpaceInput);
}

async function createSpace_internal(providerId: number, input: CreateSpaceInput) {
    return createSpaceRepo(providerId, input);
}

export async function uploadSpaceImages(
    spaceId: number,
    files: Array<{ buffer: Buffer; contentType: string; caption?: string }>
) {
    const imageIds: number[] = [];
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const id = await addSpaceImage(spaceId, f.buffer, f.contentType, f.caption, i + 1);
        imageIds.push(id);
    }
    return imageIds;
}

export async function getSpaceImageData(imageId: number) {
    const image = await getSpaceImage(imageId);
    if (!image) throw new Error('Image not found');
    return image;
}

export async function getSpaceImages(spaceId: number) {
    return getSpaceImagesMeta(spaceId);
}

export async function removeSpace(spaceId: number, providerId: number) {
    await deleteSpace(spaceId, providerId);
}
