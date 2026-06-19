import { resolveBackendUrl } from '@/utils/url';

/**
 * Wrapper around the existing `resolveBackendUrl` util, providing the same
 * defaults as the user front-end avatar resolver.
 */
export function useImageResolver() {
    function resolveImageUrl(url) {
        if (!url) return undefined;
        return resolveBackendUrl(url) || undefined;
    }
    return { resolveImageUrl };
}
