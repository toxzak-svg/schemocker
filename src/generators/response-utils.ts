/**
 * Add branding metadata to response (unless disabled for paid users)
 */
export function addBranding(data: unknown, hideBranding: boolean, version: string): unknown {
    // Skip branding if explicitly disabled
    if (hideBranding) {
        return data;
    }

    // Don't add metadata to non-objects or arrays
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return data;
    }

    // Check if _meta already exists in response
    if ('_meta' in data) {
        return data;
    }

    // Add branding metadata
    return {
        ...data,
        _meta: {
            generated_by: 'Schemock',
            version: version,
            url: 'https://github.com/toxzak-svg/schemock-app'
        }
    };
}
