/**
 * API client for communicating with the backend.
 */


// Backend API base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Outfit interface matching the backend ClothingItem model.
 */
export interface Outfit {
    id: string;
    name: string;
    category: string;
    occasion: string;
    style: string;
    gender: string;
    garment_image: string;  // For try-on
    preview_image: string;  // For UI display (renamed from 'image')
    description: string | null;
    price: string | null;
    created_at?: string;
    updated_at?: string;
    // Alias for backward compatibility
    image?: string;
}

/**
 * Try-on request payload.
 */
export interface TryOnRequest {
    person_image: string;
    garment_image: string;
    session_id?: string;
    // Optional clothing metadata for dynamic prompt injection
    clothing_name?: string;
    clothing_category?: string;
    clothing_style?: string;
    gender_target?: string;
}

/**
 * Try-on response from the API.
 */
export interface TryOnResponse {
    success: boolean;
    tryon_result_image: string | null;
    error: string | null;
    processing_time_ms: number | null;
}

/**
 * Gender detection response from the vision API.
 */
export interface GenderDetectResponse {
    detected_gender: "Male" | "Female" | "Unisex";
}

/**
 * Clothing list response.
 */
export interface ClothingListResponse {
    items: Outfit[];
    total: number;
}

/**
 * Build full image URL from path.
 */
export function getImageUrl(path: string | null | undefined): string {
    if (!path) return "/placeholder.svg";

    // If already a full URL or data URL, return as-is
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
    }

    // If it's an API path, prepend the base URL (without /api suffix)
    if (path.startsWith("/api/")) {
        const baseUrl = API_BASE_URL.replace("/api", "");
        return `${baseUrl}${path}`;
    }

    return path;
}

/**
 * Fetch clothing recommendations based on occasion and style.
 */
export async function getRecommendations(
    occasion: string | null,
    style: string | null
): Promise<Outfit[]> {
    try {
        const params = new URLSearchParams();
        if (occasion) params.append("occasion", occasion);
        if (style) params.append("style", style);
        params.append("limit", "6");

        const response = await fetch(
            `${API_BASE_URL}/clothing/recommendations?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
        }

        const data: ClothingListResponse = await response.json();

        // Map preview_image to image for backward compatibility
        return data.items.map(item => ({
            ...item,
            image: getImageUrl(item.preview_image),
            garment_image: getImageUrl(item.garment_image),
            preview_image: getImageUrl(item.preview_image),
        }));
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        // Return empty array on error
        return [];
    }
}

/**
 * Generate a virtual try-on image.
 */
export async function generateTryOn(
    personImage: string,
    garmentImage: string,
    sessionId?: string,
    clothingName?: string,
    clothingCategory?: string,
    clothingStyle?: string,
    genderTarget?: string
): Promise<TryOnResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/tryon`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                person_image: personImage,
                garment_image: garmentImage,
                session_id: sessionId,
                clothing_name: clothingName,
                clothing_category: clothingCategory,
                clothing_style: clothingStyle,
                gender_target: genderTarget,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                tryon_result_image: null,
                error: data.detail || data.error || "Failed to generate try-on",
                processing_time_ms: null,
            };
        }

        return data as TryOnResponse;
    } catch (error) {
        console.error("Error generating try-on:", error);
        return {
            success: false,
            tryon_result_image: null,
            error: error instanceof Error ? error.message : "Network error",
            processing_time_ms: null,
        };
    }
}

/**
 * Detect the apparent gender of the person in a captured image.
 * Calls POST /api/vision/gender — designed for ultra-low latency (maxOutputTokens: 20).
 * Falls back to "Unisex" on any error so it never blocks the user flow.
 */
export async function detectGender(
    base64Image: string
): Promise<"Male" | "Female" | "Unisex"> {
    try {
        const response = await fetch(`${API_BASE_URL}/vision/gender`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
            console.warn("[Vision] Gender detection failed:", response.status);
            return "Unisex";
        }

        const data: GenderDetectResponse = await response.json();
        return data.detected_gender ?? "Unisex";
    } catch (error) {
        console.warn("[Vision] Gender detection error (non-blocking):", error);
        return "Unisex";
    }
}

/**
 * Fetch all clothing items (for admin).
 */
export async function getAllClothing(): Promise<Outfit[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/clothing`);

        if (!response.ok) {
            throw new Error(`Failed to fetch clothing: ${response.statusText}`);
        }

        const data: ClothingListResponse = await response.json();

        return data.items.map(item => ({
            ...item,
            image: getImageUrl(item.preview_image),
            garment_image: getImageUrl(item.garment_image),
            preview_image: getImageUrl(item.preview_image),
        }));
    } catch (error) {
        console.error("Error fetching clothing:", error);
        return [];
    }
}

/**
 * Create a new clothing item (admin).
 */
export async function createClothing(clothing: {
    name: string;
    category: string;
    occasion: string;
    style: string;
    gender: string;
    garment_image: string;
    preview_image: string;
    description?: string;
    price?: string;
}): Promise<Outfit | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/clothing`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(clothing),
        });

        if (!response.ok) {
            throw new Error(`Failed to create clothing: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating clothing:", error);
        return null;
    }
}

/**
 * Update a clothing item (admin).
 */
export async function updateClothing(
    id: string,
    updates: Partial<{
        name: string;
        category: string;
        occasion: string;
        style: string;
        gender: string;
        garment_image: string;
        preview_image: string;
        description: string;
        price: string;
    }>
): Promise<Outfit | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/clothing/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error(`Failed to update clothing: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating clothing:", error);
        return null;
    }
}

/**
 * Delete a clothing item (admin).
 */
export async function deleteClothing(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/clothing/${id}`, {
            method: "DELETE",
        });

        return response.ok;
    } catch (error) {
        console.error("Error deleting clothing:", error);
        return false;
    }
}
